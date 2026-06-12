"""
test_all_endpoints.py
---------------------
Tests every API endpoint and prints PASS / FAIL for each.
The server must be running on port 8000 before you run this.

Run:
    python backend/test_all_endpoints.py
"""

import io
import json
import sys

# Force UTF-8 so Devanagari characters print correctly on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

import requests

BASE_URL = "http://localhost:8000"

# These are set during the test run and reused by later tests
PROJECT_ID = None
CHAT_ID    = None

# Collects (test_name, passed: bool, error: str) for the summary
_results: list[tuple[str, bool, str]] = []


# ── Test runner helper ────────────────────────────────────────────────────────

def run_test(
    name: str,
    response: requests.Response,
    *,
    expect_status: int = 200,
    check=None,          # optional callable(data) → (bool, str)
):
    """
    Checks HTTP status, optionally runs a custom assertion, and records the result.

    Parameters:
        name          : human-readable test label
        response      : the requests.Response object
        expect_status : expected HTTP status code (default 200)
        check         : optional function that receives the parsed JSON body and
                        returns (True, "") on success or (False, "reason") on failure
    Returns the parsed JSON body so later tests can use values from it, or None.
    """
    label = f"[{len(_results) + 1:02d}] {name}"

    # ── Status code check ──────────────────────────────────────────────────
    if response.status_code != expect_status:
        msg = (
            f"Expected HTTP {expect_status}, got {response.status_code}. "
            f"Body: {response.text[:300]}"
        )
        _results.append((label, False, msg))
        print(f"  FAIL  {label}\n        {msg}")
        return None

    # ── Parse JSON body ────────────────────────────────────────────────────
    data = None
    content_type = response.headers.get("content-type", "")
    if "application/json" in content_type and response.text:
        try:
            data = response.json()
        except json.JSONDecodeError as e:
            msg = f"Response is not valid JSON: {e} — Body: {response.text[:200]}"
            _results.append((label, False, msg))
            print(f"  FAIL  {label}\n        {msg}")
            return None

    # ── Custom assertion ───────────────────────────────────────────────────
    if check and data is not None:
        try:
            ok, reason = check(data)
        except Exception as e:
            ok, reason = False, f"Assertion threw an exception: {e}"

        if not ok:
            _results.append((label, False, reason))
            print(f"  FAIL  {label}\n        {reason}")
            return data

    _results.append((label, True, ""))
    print(f"  PASS  {label}")
    return data


# ── Individual tests ──────────────────────────────────────────────────────────

def test_01_root():
    """GET / — server is up"""
    r = requests.get(f"{BASE_URL}/")
    run_test(
        "GET / — server ping",
        r,
        check=lambda d: (
            d.get("message") == "SuruwaatAI API is running",
            f"Unexpected message: {d}",
        ),
    )


def test_02_health():
    """GET /health — docs loaded"""
    r = requests.get(f"{BASE_URL}/health")
    run_test(
        "GET /health — docs_loaded > 0",
        r,
        check=lambda d: (
            d.get("docs_loaded", 0) > 0,
            f"docs_loaded is {d.get('docs_loaded')} — run ingest.py first",
        ),
    )


def test_03_ask():
    """POST /ask — legal question in Nepali"""
    r = requests.post(
        f"{BASE_URL}/ask",
        json={"question": "नेपालमा कम्पनी दर्ता गर्न के चाहिन्छ?"},
    )
    run_test(
        "POST /ask — Nepali legal question",
        r,
        check=lambda d: (
            bool(d.get("answer", "").strip()),
            f"answer field is empty. Response: {d}",
        ),
    )


def test_04_grants_ask():
    """POST /grants/ask — grant question"""
    r = requests.post(
        f"{BASE_URL}/grants/ask",
        json={"question": "IEDI loan को लागि के चाहिन्छ?"},
    )
    run_test(
        "POST /grants/ask — grant question",
        r,
        check=lambda d: (
            bool(d.get("answer", "").strip()),
            f"answer field is empty. Response: {d}",
        ),
    )


def test_05_create_project():
    """POST /projects — create a test project (user_id omitted: not a valid UUID)"""
    global PROJECT_ID

    # Note: user_id is omitted because "test_user_1" is not a valid UUID and
    # would fail Postgres's UUID type check. In production this comes from the
    # JWT auth token.
    r = requests.post(
        f"{BASE_URL}/projects",
        json={"name": "Test Project", "grant_type": "iedi_startup_loan"},
    )

    def check(d):
        pid = d.get("id")
        if not pid:
            return False, f"No 'id' in response: {d}"
        return True, ""

    data = run_test("POST /projects — create project", r, expect_status=201, check=check)

    if data:
        PROJECT_ID = data["id"]
        print(f"         → PROJECT_ID = {PROJECT_ID}")


def test_06_list_projects():
    """GET /projects — list projects"""
    r = requests.get(f"{BASE_URL}/projects")
    run_test(
        "GET /projects — list returns array",
        r,
        check=lambda d: (
            isinstance(d, list),
            f"Expected a list, got: {type(d).__name__}",
        ),
    )


def test_07_get_project():
    """GET /projects/{id} — fetch the created project"""
    if not PROJECT_ID:
        _results.append(("[07] GET /projects/{id}", False, "Skipped — PROJECT_ID not set (test 05 failed)"))
        print("  SKIP  [07] GET /projects/{id} — PROJECT_ID not set")
        return

    r = requests.get(f"{BASE_URL}/projects/{PROJECT_ID}")
    run_test(
        f"GET /projects/{{id}} — name matches",
        r,
        check=lambda d: (
            d.get("name") == "Test Project",
            f"name is '{d.get('name')}', expected 'Test Project'",
        ),
    )


def test_08_generate_todos():
    """POST /projects/{id}/todos/generate — AI generates todos"""
    if not PROJECT_ID:
        _results.append(("[08] POST /todos/generate", False, "Skipped — PROJECT_ID not set"))
        print("  SKIP  [08] POST /todos/generate — PROJECT_ID not set")
        return

    r = requests.post(
        f"{BASE_URL}/projects/{PROJECT_ID}/todos/generate",
        timeout=30,   # Groq call can take a few seconds
    )
    run_test(
        "POST /todos/generate — AI generates > 0 todos",
        r,
        expect_status=201,
        check=lambda d: (
            d.get("generated", 0) > 0,
            f"generated count is {d.get('generated')}. Response: {d}",
        ),
    )


def test_09_list_todos():
    """GET /projects/{id}/todos — list todos"""
    if not PROJECT_ID:
        _results.append(("[09] GET /todos", False, "Skipped — PROJECT_ID not set"))
        print("  SKIP  [09] GET /todos — PROJECT_ID not set")
        return

    r = requests.get(f"{BASE_URL}/projects/{PROJECT_ID}/todos")
    run_test(
        "GET /todos — list is non-empty",
        r,
        check=lambda d: (
            isinstance(d, list) and len(d) > 0,
            f"Expected non-empty list, got {len(d) if isinstance(d, list) else type(d).__name__} items",
        ),
    )


def test_10_save_chat():
    """POST /projects/{id}/chats — save an AI answer"""
    global CHAT_ID
    if not PROJECT_ID:
        _results.append(("[10] POST /chats", False, "Skipped — PROJECT_ID not set"))
        print("  SKIP  [10] POST /chats — PROJECT_ID not set")
        return

    r = requests.post(
        f"{BASE_URL}/projects/{PROJECT_ID}/chats",
        json={
            "question": "test question",
            "answer":   "test answer",
            "sources":  [],
        },
    )

    def check(d):
        cid = d.get("id")
        if not cid:
            return False, f"No 'id' in chat response: {d}"
        return True, ""

    data = run_test("POST /chats — save chat returns id", r, expect_status=201, check=check)
    if data:
        CHAT_ID = data["id"]
        print(f"         → CHAT_ID = {CHAT_ID}")


def test_11_list_chats():
    """GET /projects/{id}/chats — list saved chats"""
    if not PROJECT_ID:
        _results.append(("[11] GET /chats", False, "Skipped — PROJECT_ID not set"))
        print("  SKIP  [11] GET /chats — PROJECT_ID not set")
        return

    r = requests.get(f"{BASE_URL}/projects/{PROJECT_ID}/chats")
    run_test(
        "GET /chats — list has at least 1 chat",
        r,
        check=lambda d: (
            isinstance(d, list) and len(d) >= 1,
            f"Expected ≥1 chat, got {len(d) if isinstance(d, list) else d}",
        ),
    )


def test_12_notifications():
    """GET /notifications — returns a list"""
    r = requests.get(f"{BASE_URL}/notifications")
    run_test(
        "GET /notifications — returns array",
        r,
        check=lambda d: (
            isinstance(d, list),
            f"Expected list, got: {type(d).__name__}",
        ),
    )


def test_13_unread_count():
    """GET /notifications/unread-count — returns count key"""
    r = requests.get(f"{BASE_URL}/notifications/unread-count")
    run_test(
        "GET /notifications/unread-count — has unread_count key",
        r,
        check=lambda d: (
            "unread_count" in d,
            f"'unread_count' key missing. Got: {d}",
        ),
    )


def test_14_update_project():
    """PATCH /projects/{id} — update status to submitted"""
    if not PROJECT_ID:
        _results.append(("[14] PATCH /projects/{id}", False, "Skipped — PROJECT_ID not set"))
        print("  SKIP  [14] PATCH /projects/{id} — PROJECT_ID not set")
        return

    r = requests.patch(
        f"{BASE_URL}/projects/{PROJECT_ID}",
        json={"status": "submitted"},
    )
    run_test(
        "PATCH /projects/{id} — status updated to 'submitted'",
        r,
        check=lambda d: (
            d.get("status") == "submitted",
            f"status is '{d.get('status')}', expected 'submitted'",
        ),
    )


def test_15_delete_project():
    """DELETE /projects/{id} — delete the test project"""
    if not PROJECT_ID:
        _results.append(("[15] DELETE /projects/{id}", False, "Skipped — PROJECT_ID not set"))
        print("  SKIP  [15] DELETE /projects/{id} — PROJECT_ID not set")
        return

    r = requests.delete(f"{BASE_URL}/projects/{PROJECT_ID}")
    # DELETE returns 204 No Content (no body)
    run_test(
        "DELETE /projects/{id} — returns 204",
        r,
        expect_status=204,
    )


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  SuruwaatAI — Full API Endpoint Test Suite")
    print(f"  Target: {BASE_URL}")
    print("=" * 60)

    # Check that the server is actually reachable before running tests
    try:
        requests.get(f"{BASE_URL}/", timeout=3)
    except requests.ConnectionError:
        print(f"\nERROR: Cannot connect to {BASE_URL}")
        print("Start the server first:  uvicorn backend.main:app --port 8000")
        sys.exit(1)

    print()

    # Run all tests in order
    test_01_root()
    test_02_health()
    test_03_ask()
    test_04_grants_ask()
    test_05_create_project()
    test_06_list_projects()
    test_07_get_project()
    test_08_generate_todos()
    test_09_list_todos()
    test_10_save_chat()
    test_11_list_chats()
    test_12_notifications()
    test_13_unread_count()
    test_14_update_project()
    test_15_delete_project()

    # ── Summary ───────────────────────────────────────────────────────────
    total  = len(_results)
    passed = sum(1 for _, ok, _ in _results if ok)
    failed = [(name, err) for name, ok, err in _results if not ok]

    print()
    print("=" * 60)
    print(f"  Results: {passed}/{total} passed")
    print("=" * 60)

    if failed:
        print("\nFailed tests:")
        for name, err in failed:
            print(f"  {name}")
            print(f"    → {err}")
    else:
        print("\n  All tests passed!")

    print()
    sys.exit(0 if not failed else 1)


if __name__ == "__main__":
    main()
