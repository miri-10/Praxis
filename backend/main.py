"""
main.py
-------
FastAPI server for the SuruwaatAI Nepal legal RAG system.

Endpoints:
  GET  /          → health ping
  GET  /health    → status + doc count
  POST /ask       → answer a legal question using ChromaDB + Groq

Start the server:
    uvicorn backend.main:app --reload --port 8000
"""

import os
import sys
import time
import logging
from collections import defaultdict, deque
from contextlib import asynccontextmanager

# When uvicorn runs as `uvicorn backend.main:app` from the project root,
# the backend/ folder itself is not on sys.path — only the project root is.
# This line adds backend/ so that `from ai_client import ...` works correctly.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import chromadb
from chromadb.utils import embedding_functions
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ai_client import ask_question
from projects_router import router as projects_router

# ── Paths ─────────────────────────────────────────────────────────────────────

SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
CHROMA_DIR   = os.path.join(SCRIPT_DIR, "chroma_db")
LOG_FILE     = os.path.join(SCRIPT_DIR, "errors.log")

# ── Logging ───────────────────────────────────────────────────────────────────

# Writes ERROR-level messages (and above) to backend/errors.log with timestamps.
# INFO messages still appear in the terminal but not in the log file.
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.ERROR,
    format="%(asctime)s  %(levelname)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── ChromaDB constants ────────────────────────────────────────────────────────

# Must match the model used in ingest.py so query embeddings are compatible
EMBED_MODEL       = "paraphrase-multilingual-MiniLM-L12-v2"
COLLECTION_NAME   = "nepal_legal"
TOP_K             = 5      # number of chunks to retrieve per question
SIMILARITY_CUTOFF = 0.45   # chunks below this score are considered irrelevant

# ── Module-level variables ────────────────────────────────────────────────────

# These are set once at startup and reused for every request.
# Loading ChromaDB and the embedding model on every request would be very slow.
chroma_collection = None   # holds the ChromaDB collection object
docs_loaded_count = 0      # number of unique source documents in the DB

# ── Rate limiter state ────────────────────────────────────────────────────────

# Maps each IP address to a deque of request timestamps (as Unix seconds).
# On each request we remove timestamps older than 60 s, then check the count.
RATE_LIMIT_REQUESTS = 10   # max allowed per window
RATE_LIMIT_WINDOW   = 60   # seconds
_rate_buckets: dict[str, deque] = defaultdict(deque)


def is_rate_limited(ip: str) -> bool:
    """
    Returns True if the given IP has exceeded the rate limit.
    Automatically evicts timestamps older than the window on each call.
    """
    now    = time.time()
    bucket = _rate_buckets[ip]

    # Drop timestamps that are outside the current window
    while bucket and bucket[0] < now - RATE_LIMIT_WINDOW:
        bucket.popleft()

    if len(bucket) >= RATE_LIMIT_REQUESTS:
        return True  # too many requests

    bucket.append(now)  # record this request
    return False


# ── Startup / shutdown (lifespan) ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(_app: FastAPI):
    """
    Code inside the `async with` block runs ONCE when the server starts.
    Code after `yield` runs ONCE when the server shuts down.

    We load ChromaDB here so every request can reuse the same connection
    instead of opening a new one each time (which would be slow).
    """
    global chroma_collection, docs_loaded_count

    print("Loading ChromaDB and embedding model...")

    embed_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=EMBED_MODEL
    )

    client = chromadb.PersistentClient(path=CHROMA_DIR)

    try:
        chroma_collection = client.get_collection(
            name=COLLECTION_NAME,
            embedding_function=embed_fn,
        )
    except Exception as e:
        # Server can still start, but /ask will fail until ingest.py is run
        logger.error(f"Failed to load ChromaDB collection: {e}")
        print(f"WARNING: ChromaDB collection not found — run ingest.py first. ({e})")
        chroma_collection = None

    if chroma_collection is not None:
        # Count unique source documents stored in the collection
        all_meta = chroma_collection.get(include=["metadatas"])["metadatas"]
        docs_loaded_count = len({m.get("source", "") for m in all_meta})
        print(f"ChromaDB ready — {docs_loaded_count} documents loaded.")

    yield  # server is now running and handling requests

    # Shutdown: nothing explicit needed for ChromaDB
    print("Server shutting down.")


# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="SuruwaatAI — Nepal Legal RAG",
    description="Ask legal questions about Nepal startup law in Nepali or English.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS middleware ───────────────────────────────────────────────────────────

# Allows the React frontend (running on a different port) to call this API.
# In production, replace "*" with your actual frontend domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # any origin — safe during local development
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all projects / chats / todos / files / notifications endpoints
app.include_router(projects_router)


# ── Request / Response models ─────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str
    language: str = "ne"   # "ne" = Nepali, "en" = English (informational only)


class AskResponse(BaseModel):
    answer:   str
    sources:  list[str]
    language: str


# ── Helper: retrieve + filter chunks ─────────────────────────────────────────

def retrieve_relevant_chunks(question: str) -> list[dict]:
    """
    Queries ChromaDB for the TOP_K most similar chunks.
    Filters out any chunk whose similarity score is below SIMILARITY_CUTOFF
    so we never send irrelevant context to the AI.

    Returns a list of dicts: [{"text": ..., "source": ..., "similarity": ...}]
    """
    results = chroma_collection.query(
        query_texts=[question],
        n_results=TOP_K,
        include=["documents", "metadatas", "distances"],
    )

    chunks = []
    for text, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        similarity = round(1 - dist, 3)  # cosine distance → similarity (0–1)
        if similarity >= SIMILARITY_CUTOFF:
            chunks.append({
                "text":       text,
                "source":     meta.get("source", "Unknown"),
                "similarity": similarity,
            })

    return chunks


def build_context(chunks: list[dict]) -> str:
    """
    Formats retrieved chunks into a single labelled context string for the AI.
    Each excerpt is prefixed with its source document name so the AI can cite it.
    """
    parts = []
    for i, chunk in enumerate(chunks, start=1):
        source_name = chunk["source"].replace(".txt", "")
        parts.append(f"[Excerpt {i} — {source_name}]\n{chunk['text']}")
    return "\n\n".join(parts)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    """Quick ping to confirm the server is running."""
    return {"message": "SuruwaatAI API is running"}


@app.get("/health")
async def health():
    """
    Returns server status and the number of source documents in ChromaDB.
    Use this to check the server is up and data was loaded correctly.
    """
    return {
        "status":      "ok",
        "docs_loaded": docs_loaded_count,
        "collection":  COLLECTION_NAME,
        "model":       EMBED_MODEL,
    }


@app.post("/ask", response_model=AskResponse)
async def ask(request: Request, body: AskRequest):
    """
    Main endpoint. Accepts a legal question and returns an AI answer
    grounded in the Nepal legal documents stored in ChromaDB.

    Flow:
      1. Validate the question is not empty
      2. Check the rate limit for this IP
      3. Search ChromaDB for relevant chunks
      4. If no chunks pass the similarity threshold → return fallback
      5. Send chunks + question to Groq via ask_question()
      6. Return the answer and the source document names
    """

    # ── 1. Validate input ─────────────────────────────────────────────────────
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question must not be empty.")

    # ── 2. Rate limit check ───────────────────────────────────────────────────
    client_ip = request.client.host
    if is_rate_limited(client_ip):
        raise HTTPException(
            status_code=429,
            detail=f"Too many requests. Maximum {RATE_LIMIT_REQUESTS} per minute.",
        )

    # ── 3. Ensure ChromaDB is ready ───────────────────────────────────────────
    if chroma_collection is None:
        logger.error("POST /ask called but ChromaDB collection is not loaded.")
        raise HTTPException(
            status_code=503,
            detail="Database not ready. Run ingest.py to load documents.",
        )

    # ── 4. Retrieve relevant chunks ───────────────────────────────────────────
    try:
        chunks = retrieve_relevant_chunks(body.question)
    except Exception as e:
        logger.error(f"ChromaDB query failed for question '{body.question}': {e}")
        raise HTTPException(
            status_code=503,
            detail="AI service temporarily unavailable. Please try again later.",
        )

    # If no chunk passes the similarity threshold, return the Nepali fallback
    if not chunks:
        return AskResponse(
            answer="यो जानकारी मेरो कागजातमा छैन।",
            sources=[],
            language=body.language,
        )

    # ── 5. Build context and call Groq ────────────────────────────────────────
    context = build_context(chunks)

    try:
        answer = ask_question(body.question, context, language=body.language)
    except Exception as e:
        logger.error(f"Groq API failed for question '{body.question}': {e}")
        raise HTTPException(
            status_code=503,
            detail="AI service temporarily unavailable. Please try again later.",
        )

    # ask_question() returns a string starting with "ERROR:" on failure
    if answer.startswith("ERROR:"):
        logger.error(f"ask_question returned error: {answer}")
        raise HTTPException(
            status_code=503,
            detail="AI service temporarily unavailable. Please try again later.",
        )

    # ── 6. Build unique, clean source list ────────────────────────────────────
    # If Groq returned the fallback message the retrieved chunks weren't
    # actually relevant — suppress sources so the UI isn't misleading.
    FALLBACK = "यो जानकारी मेरो कागजातमा छैन।"
    if FALLBACK in answer:
        return AskResponse(answer=answer, sources=[], language=body.language)

    seen    = set()
    sources = []
    for chunk in chunks:
        name = chunk["source"].replace(".txt", "")
        if name not in seen:
            sources.append(name)
            seen.add(name)

    return AskResponse(answer=answer, sources=sources, language=body.language)


# ══════════════════════════════════════════════════════════════════════════════
#  GRANTS ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

class EligibilityQuiz(BaseModel):
    """Five questions used to match a startup to the right Nepal grant."""
    business_stage:     str   # "idea" | "early" | "growth" | "established"
    sector:             str   # "tech" | "agriculture" | "manufacturing" | ...
    team_size:          int   # number of people on the team
    investment_needed:  str   # "under_1m" | "1m_5m" | "5m_25m" | "above_25m" (NPR)
    legal_status:       str   # "sole_proprietor" | "private_company" | "cooperative" | ...


@app.post("/grants/ask", response_model=AskResponse)
async def grants_ask(request: Request, body: AskRequest):
    """
    Searches the Nepal legal document collection for grant-related content
    and returns an AI answer. Works identically to /ask but is a dedicated
    endpoint so the frontend can route grant questions separately.
    """
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question must not be empty.")

    client_ip = request.client.host
    if is_rate_limited(client_ip):
        raise HTTPException(
            status_code=429,
            detail=f"Too many requests. Maximum {RATE_LIMIT_REQUESTS} per minute.",
        )

    if chroma_collection is None:
        raise HTTPException(status_code=503, detail="Database not ready.")

    try:
        chunks = retrieve_relevant_chunks(body.question)
    except Exception as e:
        logger.error(f"grants_ask ChromaDB error: {e}")
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable.")

    if not chunks:
        return AskResponse(
            answer="यो जानकारी मेरो कागजातमा छैन।",
            sources=[],
            language=body.language,
        )

    context = build_context(chunks)

    try:
        answer = ask_question(body.question, context, language=body.language)
    except Exception as e:
        logger.error(f"grants_ask Groq error: {e}")
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable.")

    if answer.startswith("ERROR:"):
        logger.error(f"grants_ask returned error: {answer}")
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable.")

    FALLBACK = "यो जानकारी मेरो कागजातमा छैन।"
    if FALLBACK in answer:
        return AskResponse(answer=answer, sources=[], language=body.language)

    seen, sources = set(), []
    for chunk in chunks:
        name = chunk["source"].replace(".txt", "")
        if name not in seen:
            sources.append(name)
            seen.add(name)

    return AskResponse(answer=answer, sources=sources, language=body.language)


@app.post("/grants/eligible")
async def grants_eligible(body: EligibilityQuiz):
    """
    Takes five startup profile answers and asks Groq to recommend the top 3
    most suitable Nepal government grants or loans.

    Returns a JSON list of grant recommendations with name, reason, and amount.
    Does NOT use ChromaDB — the grant knowledge is baked into the prompt.
    """
    quiz_summary = (
        f"- Business stage    : {body.business_stage}\n"
        f"- Sector            : {body.sector}\n"
        f"- Team size         : {body.team_size} people\n"
        f"- Investment needed : NPR {body.investment_needed}\n"
        f"- Legal status      : {body.legal_status}"
    )

    # Known Nepal grants are listed explicitly so Groq does not hallucinate
    prompt = f"""You are an expert on Nepal government grants, startup loans, and entrepreneur funds.

A startup has the following profile:
{quiz_summary}

From the list below, recommend the top 3 best-matching grants or loans for this startup.
Explain in one sentence WHY each one fits.

Available Nepal grants/funds:
1. IEDI Startup Loan — up to NPR 2.5M, ages 18–40, manufacturing/service
2. Youth Self Employment Fund (YSEF) — NPR 0.5–2M, any sector, under 40
3. Women Entrepreneurship Fund — for women-led businesses, up to NPR 1.5M
4. Business Incubation Support (FNCCI) — mentorship + seed funding, tech/innovation
5. Startup Nepal Grant (ICT Board) — up to NPR 1M, ICT/software startups
6. Agricultural Development Grant (MoALD) — agri-tech, farming, food processing
7. Manufacturing Development Fund — import-substitution products, up to NPR 5M
8. Export Promotion Fund — businesses with export potential
9. Enterprise Development Program (EDP) — skills + micro-loans for early-stage

Respond with ONLY a valid JSON array — no markdown, no explanation. Format:
[
  {{"name": "...", "reason": "...", "amount": "...", "eligibility_note": "..."}}
]"""

    try:
        from groq import Groq
        _groq = Groq(api_key=os.getenv("GROQ_API_KEY"))
        response = _groq.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=600,
            temperature=0.2,
        )
        raw = response.choices[0].message.content
    except Exception as e:
        logger.error(f"grants_eligible Groq error: {e}")
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable.")

    # Strip markdown code fences Groq sometimes adds
    import re
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw)
    if fenced:
        raw = fenced.group(1).strip()

    try:
        import json
        grants = json.loads(raw[raw.find("["):raw.rfind("]") + 1])
    except Exception:
        logger.error(f"grants_eligible JSON parse error. Raw: {raw}")
        raise HTTPException(status_code=500, detail="AI returned invalid format. Try again.")

    return {"recommendations": grants, "quiz": body.model_dump()}


# ── Entry point (for running directly with: python backend/main.py) ───────────
# Railway uses the Procfile command instead, but this block is kept for
# local development and as a fallback if Railway runs the file directly.

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port)
