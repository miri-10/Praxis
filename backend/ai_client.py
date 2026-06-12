"""
ai_client.py
------------
Handles all AI calls for the Praxis Nepal legal RAG system.
Uses the Groq API — fast, free-tier friendly, runs Llama models.

Two models are available:
  - FAST_MODEL   : llama-3.1-8b-instant   — use during development/testing
  - QUALITY_MODEL: llama-3.3-70b-versatile — use in production for best answers
"""

import os
from groq import Groq
from dotenv import load_dotenv

# ── Load environment variables from backend/.env ──────────────────────────────

# load_dotenv() reads the .env file and puts the values into os.environ
# so we can safely access them without hardcoding secrets in code.
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# ── Model names ───────────────────────────────────────────────────────────────

# Use FAST_MODEL while building and testing — it's quicker and cheaper.
# Switch to QUALITY_MODEL when you want the best possible legal answers.
FAST_MODEL    = "llama-3.1-8b-instant"
QUALITY_MODEL = "llama-3.3-70b-versatile"

# ── System prompt ─────────────────────────────────────────────────────────────

# This tells the AI how to behave for every question it receives.
# It is sent once as a "system" message before the user's question.
SYSTEM_PROMPT = """You are a legal assistant for Nepal startups.
Answer using ONLY the provided document excerpts.
Always cite which document your answer comes from.
Answer in the same language the user asked in — if they ask in Nepali, answer in Nepali.
If the answer is not in the documents, say:
'यो जानकारी मेरो कागजातमा छैन।'
Keep answers under 200 words."""


# ── Main function ─────────────────────────────────────────────────────────────

def ask_question(question: str, context: str, model: str = FAST_MODEL) -> str:
    """
    Sends a legal question to Groq along with relevant document excerpts.

    How it works:
      1. The 'context' is text chunks retrieved from ChromaDB — these are the
         most relevant passages from your Nepal legal PDFs.
      2. We combine the context and question into a single user message.
      3. Groq runs the Llama model and returns the answer.

    Parameters:
        question (str) : The user's question (Nepali or English).
        context  (str) : Relevant document excerpts from ChromaDB.
        model    (str) : Which Groq model to use. Defaults to FAST_MODEL.

    Returns:
        str : The AI's answer, or an error message if something goes wrong.
    """

    # Read the API key that was loaded from .env
    api_key = os.getenv("GROQ_API_KEY")

    # Stop early with a clear message if the key is missing
    if not api_key:
        return (
            "ERROR: GROQ_API_KEY not found. "
            "Make sure backend/.env contains: GROQ_API_KEY=your_key_here"
        )

    # Build the user message — we give the AI the documents first,
    # then ask the question so it can ground its answer in the text.
    user_message = f"""Document excerpts:
{context}

Question: {question}"""

    try:
        # Create a Groq client using the API key
        client = Groq(api_key=api_key)

        # Send the request to the Groq API
        response = client.chat.completions.create(
            model=model,
            messages=[
                # System message sets the AI's behavior rules
                {"role": "system", "content": SYSTEM_PROMPT},
                # User message contains the documents + question
                {"role": "user",   "content": user_message},
            ],
            max_tokens=500,   # keeps answers concise and costs low
            temperature=0.2,  # low temperature = more factual, less creative
        )

        # Extract the text from the response object
        return response.choices[0].message.content

    except Exception as e:
        # If the API call fails for any reason (bad key, network issue, rate
        # limit, etc.) return a human-readable error instead of crashing.
        return f"ERROR: Groq API call failed — {str(e)}"


# ── Quick test ────────────────────────────────────────────────────────────────
# This block only runs when you execute the file directly:
#   python backend/ai_client.py
# It does NOT run when the file is imported by another module.

if __name__ == "__main__":
    # Force UTF-8 output so Devanagari prints correctly on Windows terminals
    import sys
    sys.stdout.reconfigure(encoding="utf-8")

    print("Testing Groq connection...")
    print(f"Model: {FAST_MODEL}")
    print("-" * 50)

    test_question = "नेपालमा कम्पनी दर्ता गर्न के चाहिन्छ?"
    test_context  = (
        "Test context: Company Act 2063 — "
        "A company must be registered with the Office of Company Registrar. "
        "Required documents include: memorandum of association, articles of "
        "association, and identification of directors."
    )

    answer = ask_question(test_question, test_context)

    print(f"Question : {test_question}")
    print(f"Context  : {test_context}")
    print("-" * 50)
    print(f"Answer:\n{answer}")
