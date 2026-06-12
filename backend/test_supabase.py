"""
test_supabase.py
----------------
Quick connection test for Supabase.
Loads credentials from backend/.env, connects, and tries to fetch
rows from the 'projects' table.

Run:
    python backend/test_supabase.py
"""

import os
import sys

# Force UTF-8 output so any Unicode content prints correctly on Windows
sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
from supabase import create_client, Client

# ── Load credentials from .env ────────────────────────────────────────────────

# Resolve the path relative to this file so it works regardless of where
# you run the script from.
ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path=ENV_PATH)

SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# The Supabase Python client needs the bare project URL.
# If the .env stores the full REST URL (ending in /rest/v1/), strip it —
# the client adds that path internally.
_raw_url     = os.getenv("SUPABASE_URL", "")
SUPABASE_URL = _raw_url.rstrip("/").removesuffix("/rest/v1")

# ── Validate that credentials are present ────────────────────────────────────

if not SUPABASE_URL:
    print("ERROR: SUPABASE_URL not found in backend/.env")
    sys.exit(1)

if not SUPABASE_SERVICE_KEY:
    print("ERROR: SUPABASE_SERVICE_KEY not found in backend/.env")
    sys.exit(1)

# ── Connect and test ──────────────────────────────────────────────────────────

try:
    # create_client() returns a Supabase client object.
    # We use the SERVICE_KEY (not the anon key) so we can bypass Row Level
    # Security and see all rows — useful for admin-level connection tests.
    client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    # Attempt to fetch up to 5 rows from the 'projects' table.
    # .limit(5) keeps the test fast even if the table has many rows.
    response = client.table("projects").select("*").limit(5).execute()

    print("Supabase connected successfully!")
    print(f"Table 'projects' — rows returned: {len(response.data)}")

    if response.data:
        print("\nSample row (first result):")
        for key, value in response.data[0].items():
            print(f"  {key}: {value}")
    else:
        print("(Table exists but contains no rows yet — that is fine.)")

except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
