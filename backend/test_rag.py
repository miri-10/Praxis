"""
test_rag.py
-----------
Tests the full RAG pipeline end-to-end:
  1. Takes a question (Nepali or English)
  2. Searches ChromaDB for the top 2 most relevant chunks
  3. Passes those chunks to ask_question() in ai_client.py
  4. Prints the answer and the source document name

Run:
    python backend/test_rag.py
"""

import os
import sys
import chromadb
from chromadb.utils import embedding_functions

# Force UTF-8 so Devanagari prints correctly on Windows
sys.stdout.reconfigure(encoding="utf-8")

# Import our Groq-powered AI function
from ai_client import ask_question, FAST_MODEL

# ── Paths ─────────────────────────────────────────────────────────────────────

SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
CHROMA_DIR   = os.path.join(PROJECT_ROOT, "chroma_db")

# Must match the model used in ingest.py — embeddings only compare correctly
# when query and documents were embedded by the same model.
EMBED_MODEL  = "paraphrase-multilingual-MiniLM-L12-v2"

# Number of document chunks to retrieve and send to the AI
TOP_K = 2


# ── ChromaDB retrieval ────────────────────────────────────────────────────────

def retrieve_chunks(question: str, top_k: int = TOP_K) -> list[dict]:
    """
    Converts the question into an embedding and finds the most similar
    chunks stored in ChromaDB.

    Returns a list of dicts, each with:
        "text"   : the chunk content
        "source" : the filename it came from (e.g. "Company Act 2063.txt")
    """
    embed_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=EMBED_MODEL
    )

    # Connect to the existing persistent database created by ingest.py
    client     = chromadb.PersistentClient(path=CHROMA_DIR)
    collection = client.get_collection(
        name="nepal_legal",
        embedding_function=embed_fn,
    )

    # query_texts automatically embeds the question and finds nearest chunks
    results = collection.query(
        query_texts=[question],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )

    # Unpack ChromaDB's nested result structure into a clean list
    chunks = []
    for text, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        chunks.append({
            "text"      : text,
            "source"    : meta.get("source", "Unknown"),
            "similarity": round(1 - dist, 3),  # cosine distance → similarity score
        })

    return chunks


# ── Build context string ──────────────────────────────────────────────────────

def build_context(chunks: list[dict]) -> str:
    """
    Formats the retrieved chunks into a single context string to pass to
    the AI. Each chunk is labelled with its source document so the AI can
    cite it correctly.
    """
    parts = []
    for i, chunk in enumerate(chunks, start=1):
        # Strip the .txt extension for a cleaner citation in the AI's answer
        source_name = chunk["source"].replace(".txt", "")
        parts.append(f"[Excerpt {i} — {source_name}]\n{chunk['text']}")
    return "\n\n".join(parts)


# ── Main test flow ────────────────────────────────────────────────────────────

def run(question: str):
    print("=" * 60)
    print(f"Question: {question}")
    print("=" * 60)

    # Step 1: Retrieve relevant chunks from ChromaDB
    print(f"\nSearching ChromaDB for top {TOP_K} relevant chunks...")
    try:
        chunks = retrieve_chunks(question)
    except Exception as e:
        print(f"ERROR: Could not query ChromaDB — {e}")
        print("Make sure you have run ingest.py first.")
        return

    # Step 2: Show which documents were found
    print("\nRetrieved chunks:")
    for i, chunk in enumerate(chunks, start=1):
        source_name = chunk["source"].replace(".txt", "")
        preview     = chunk["text"][:80].replace("\n", " ")
        print(f"  {i}. [{source_name}] (similarity: {chunk['similarity']}) — {preview}...")

    # Step 3: Build the context and call the AI
    context = build_context(chunks)
    print(f"\nSending to Groq ({FAST_MODEL})...")

    answer = ask_question(question, context)

    # Step 4: Print the answer and sources
    print("\n" + "=" * 60)
    print("Answer:")
    print("=" * 60)
    print(answer)

    print("\n" + "-" * 60)
    print("Sources used:")
    seen = set()
    for chunk in chunks:
        src = chunk["source"].replace(".txt", "")
        if src not in seen:
            print(f"  • {src}")
            seen.add(src)
    print("-" * 60)


if __name__ == "__main__":
    TEST_QUESTION = "नेपालमा निजी कम्पनी दर्ता गर्ने प्रक्रिया के हो?"
    run(TEST_QUESTION)
