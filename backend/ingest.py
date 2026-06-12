"""
ingest.py
---------
Reads extracted .txt files from documents/extracted/, splits them into
overlapping chunks, generates embeddings, and stores everything in ChromaDB.

Run this once (and re-run whenever you add new documents):
    python backend/ingest.py
"""

import os
import chromadb
from chromadb.utils import embedding_functions

# ── Paths ─────────────────────────────────────────────────────────────────────

SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

EXTRACTED_DIR = os.path.join(PROJECT_ROOT, "documents", "extracted")
CHROMA_DIR    = os.path.join(PROJECT_ROOT, "chroma_db")  # where ChromaDB stores data

# ── Chunking settings ─────────────────────────────────────────────────────────

CHUNK_SIZE    = 800   # characters per chunk — large enough for legal sentences
CHUNK_OVERLAP = 100   # characters shared between consecutive chunks so context
                      # is never cut off right at a chunk boundary

# ── Embedding model ───────────────────────────────────────────────────────────

# paraphrase-multilingual-MiniLM-L12-v2 understands 50+ languages including
# Nepali Devanagari — much better than English-only models for this project.
EMBED_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"


# ── Helper functions ──────────────────────────────────────────────────────────

def chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    """
    Splits a long string into overlapping chunks of fixed character length.

    Example with chunk_size=10, overlap=3:
      "ABCDEFGHIJKLMNOP" → ["ABCDEFGHIJ", "HIJKLMNOPQ", ...]

    Overlap ensures that a sentence split across a boundary still appears
    fully in at least one chunk, so no information is lost.
    """
    chunks = []
    start  = 0

    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap  # step back by overlap before next chunk

    return chunks


def safe_id(filename: str, index: int) -> str:
    """
    Creates a unique, ChromaDB-safe ID for each chunk.
    ChromaDB requires IDs to be plain ASCII strings.
    Example: "Company Act.txt", 3  →  "company_act_txt_chunk_3"
    """
    base = filename.lower().replace(" ", "_").replace(".", "_")
    return f"{base}_chunk_{index}"


# ── Main ingestion ────────────────────────────────────────────────────────────

def main():
    # Collect all .txt files in the extracted folder
    try:
        txt_files = sorted(
            f for f in os.listdir(EXTRACTED_DIR) if f.endswith(".txt")
        )
    except FileNotFoundError:
        print(f"ERROR: Folder not found: {EXTRACTED_DIR}")
        print("Run extract_pdfs.py first.")
        return

    if not txt_files:
        print("No .txt files found. Run extract_pdfs.py first.")
        return

    print(f"Found {len(txt_files)} documents to ingest.")
    print(f"Embedding model: {EMBED_MODEL}")
    print(f"ChromaDB path  : {CHROMA_DIR}")
    print()

    # Set up the embedding function using sentence-transformers
    # ChromaDB will call this automatically when adding or querying documents
    embed_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=EMBED_MODEL
    )

    # Create a persistent ChromaDB client — data survives between runs
    client = chromadb.PersistentClient(path=CHROMA_DIR)

    # Get or create the collection (like a table in a database)
    # delete_collection first so re-running gives a clean slate
    try:
        client.delete_collection("nepal_legal")
    except Exception:
        pass  # collection didn't exist yet — that's fine

    collection = client.create_collection(
        name="nepal_legal",
        embedding_function=embed_fn,
        metadata={"hnsw:space": "cosine"},  # cosine similarity works best for text
    )

    total_chunks = 0

    for filename in txt_files:
        filepath = os.path.join(EXTRACTED_DIR, filename)

        with open(filepath, "r", encoding="utf-8") as f:
            text = f.read().strip()

        if not text:
            print(f"  Skipping (empty): {filename}")
            continue

        # Split the document into overlapping chunks
        chunks = chunk_text(text, CHUNK_SIZE, CHUNK_OVERLAP)

        # Build parallel lists that ChromaDB expects
        ids       = [safe_id(filename, i) for i in range(len(chunks))]
        documents = chunks
        # Metadata lets us retrieve the source filename when answering questions
        metadatas = [{"source": filename} for _ in chunks]

        # Add all chunks for this document to ChromaDB
        # ChromaDB automatically generates and stores embeddings via embed_fn
        collection.add(
            ids=ids,
            documents=documents,
            metadatas=metadatas,
        )

        print(f"  Ingested: {filename} — {len(chunks)} chunks")
        total_chunks += len(chunks)

    print()
    print(f"Done. {total_chunks} total chunks stored in ChromaDB.")


if __name__ == "__main__":
    main()
