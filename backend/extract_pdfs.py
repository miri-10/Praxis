"""
extract_pdfs.py
---------------
Extracts text from digital (text-selectable) Nepali PDFs using PyMuPDF.
Saves each PDF's full text as a .txt file in documents/extracted/.
Warns if extracted text doesn't look like Devanagari Unicode.
"""

import fitz  # PyMuPDF — reads PDF files and extracts text
import os
import sys


# ── Path configuration ────────────────────────────────────────────────────────

# Resolve paths relative to this script's location so the script works
# regardless of which directory you run it from.
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

PDF_DIR = os.path.join(PROJECT_ROOT, "documents", "pdfs")
OUT_DIR = os.path.join(PROJECT_ROOT, "documents", "extracted")


# ── Helper functions ──────────────────────────────────────────────────────────

def is_devanagari_char(ch):
    """
    Returns True if a character falls in the Devanagari Unicode block.
    The block covers codepoints U+0900 to U+097F, which includes all
    standard Nepali, Hindi, and Sanskrit characters.
    """
    return "ऀ" <= ch <= "ॿ"


def devanagari_ratio(text):
    """
    Calculates what fraction of the letters in `text` are Devanagari.

    We only count actual letters (not spaces, punctuation, or numbers)
    so that documents with lots of English punctuation don't skew the
    score unfairly.

    Returns a float between 0.0 (no Devanagari) and 1.0 (all Devanagari).
    """
    # Keep only alphabetic characters for a fair comparison
    letters = [ch for ch in text if ch.isalpha()]

    # Avoid division by zero if the page has no letters at all
    if not letters:
        return 0.0

    devanagari_count = sum(1 for ch in letters if is_devanagari_char(ch))
    return devanagari_count / len(letters)


def output_path_for(pdf_filename):
    """
    Given a PDF filename like 'company_act.pdf', returns the full path
    to its matching output file: documents/extracted/company_act.txt
    """
    base_name = os.path.splitext(pdf_filename)[0]  # strip .pdf extension
    return os.path.join(OUT_DIR, base_name + ".txt")


def already_extracted(pdf_filename):
    """
    Returns True if a .txt file already exists for this PDF.
    Used to skip PDFs that were successfully extracted in a previous run,
    so re-running the script is always safe and never duplicates work.
    """
    return os.path.exists(output_path_for(pdf_filename))


def extract_text_from_pdf(pdf_path):
    """
    Opens a PDF and extracts all its text, page by page.

    PyMuPDF's get_text("text") returns the raw Unicode text embedded in the
    PDF. For digital (non-scanned) PDFs this is fast and accurate.

    Returns:
        full_text (str)  — all pages joined with newlines
        page_count (int) — number of pages in the PDF
    """
    doc = fitz.open(pdf_path)
    pages_text = []

    for page in doc:
        # "text" mode preserves reading order and Unicode characters
        page_text = page.get_text("text")
        pages_text.append(page_text)

    doc.close()

    full_text = "\n".join(pages_text)
    return full_text, len(pages_text)


# ── Main extraction loop ──────────────────────────────────────────────────────

def main():
    # Make sure the output folder exists before we try to write into it
    os.makedirs(OUT_DIR, exist_ok=True)

    # Collect all PDF files from the input directory
    try:
        all_files = os.listdir(PDF_DIR)
    except FileNotFoundError:
        print(f"ERROR: PDF folder not found: {PDF_DIR}")
        sys.exit(1)

    pdf_files = sorted(f for f in all_files if f.lower().endswith(".pdf"))

    if not pdf_files:
        print(f"No PDF files found in {PDF_DIR}")
        print("Drop your Nepali PDFs into documents/pdfs/ and run again.")
        sys.exit(0)

    # Counters for the final summary line
    extracted_count = 0
    warning_count = 0
    skipped_count = 0

    for pdf_filename in pdf_files:

        # ── Skip if already done ──────────────────────────────────────────
        if already_extracted(pdf_filename):
            print(f"Skipping (already extracted): {pdf_filename}")
            skipped_count += 1
            continue

        pdf_path = os.path.join(PDF_DIR, pdf_filename)
        print(f"Extracting: {pdf_filename}...", end=" ", flush=True)

        # ── Extract text ──────────────────────────────────────────────────
        try:
            full_text, page_count = extract_text_from_pdf(pdf_path)
        except Exception as e:
            print(f"\nERROR reading {pdf_filename}: {e}")
            continue

        char_count = len(full_text)

        # ── Devanagari quality check ──────────────────────────────────────
        ratio = devanagari_ratio(full_text)
        has_warning = ratio < 0.20  # warn if fewer than 20 % of letters are Devanagari

        # ── Save the extracted text ───────────────────────────────────────
        out_path = output_path_for(pdf_filename)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(full_text)

        # ── Progress line ─────────────────────────────────────────────────
        print(f"Pages: {page_count} | Characters: {char_count:,} | Done")

        if has_warning:
            print(
                f"  WARNING: {pdf_filename} — text may be garbled. "
                f"Check the .txt file manually. "
                f"(Devanagari ratio: {ratio:.0%})"
            )
            warning_count += 1

        extracted_count += 1

    # ── Final summary ─────────────────────────────────────────────────────────
    print()
    print(f"Total: {extracted_count} file(s) extracted successfully")
    if skipped_count:
        print(f"       {skipped_count} file(s) skipped (already extracted)")
    if warning_count:
        print(f"       {warning_count} file(s) had warnings — check manually")
    else:
        print("       No warnings — all files look like valid Devanagari text")


if __name__ == "__main__":
    main()
