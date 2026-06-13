"""
projects_router.py
------------------
All CRUD endpoints for Projects, Saved Chats, Todos, Files, and Notifications.
Included in main.py via:  app.include_router(projects_router)

Tables used (run database.py SQL in Supabase first):
  projects, saved_chats, todos, project_files, notifications
"""

import json
import logging
import os
import re
import sys
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from groq import Groq
from pydantic import BaseModel
from supabase import Client, create_client

# ── Setup ─────────────────────────────────────────────────────────────────────

# Ensure backend/ is on sys.path (same fix as main.py)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path=ENV_PATH)

logger = logging.getLogger(__name__)

# ── Supabase client ───────────────────────────────────────────────────────────

# The .env stores the full REST URL; the Python client needs the base URL only.
_raw_url = os.getenv("SUPABASE_URL", "").rstrip("/").removesuffix("/rest/v1")
_svc_key = os.getenv("SUPABASE_SERVICE_KEY", "")

# Do NOT crash the whole app at import if Supabase isn't configured — the core
# /ask chat endpoint doesn't need it. Project / saved-chat / file endpoints will
# return 503 until SUPABASE_URL and SUPABASE_SERVICE_KEY are provided (as Railway
# environment variables in production, or in backend/.env locally).
supabase: Optional[Client] = None
if _raw_url and _svc_key:
    supabase = create_client(_raw_url, _svc_key)
else:
    logger.error(
        "SUPABASE_URL / SUPABASE_SERVICE_KEY not set — project endpoints disabled."
    )

# Storage bucket where uploaded project files are stored
STORAGE_BUCKET = "praxis-files"

# ── Groq client (for AI-generated todos) ─────────────────────────────────────

_groq_key = os.getenv("GROQ_API_KEY", "")
groq_client = Groq(api_key=_groq_key) if _groq_key else None

# ── Router ────────────────────────────────────────────────────────────────────

router = APIRouter()


# ── Pydantic models ───────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str
    grant_type:  Optional[str] = None
    description: Optional[str] = None
    website:     Optional[str] = None   # the user's company website
    user_id:     Optional[str] = None   # comes from auth JWT in production


class ProjectUpdate(BaseModel):
    name:        Optional[str] = None
    status:      Optional[str] = None   # active | submitted | approved | rejected
    description: Optional[str] = None
    grant_type:  Optional[str] = None
    website:     Optional[str] = None


class ChatCreate(BaseModel):
    question: str
    answer:   str
    sources:  list[str] = []
    user_id:  Optional[str] = None


class TodoCreate(BaseModel):
    task_text:   str
    due_date:    Optional[str] = None   # ISO date string e.g. "2025-12-31"
    order_index: int = 0


class TodoUpdate(BaseModel):
    task_text:    Optional[str]  = None
    is_completed: Optional[bool] = None
    due_date:     Optional[str]  = None
    order_index:  Optional[int]  = None


# ── Helper: extract JSON list from Groq response ──────────────────────────────

def _extract_json_block(text: str) -> str:
    """
    Returns the raw JSON string from Groq's response, stripping any markdown
    code fences (```json ... ```) and leading/trailing prose.
    Raises ValueError if no JSON array is found.
    """
    text = text.strip()
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if fenced:
        text = fenced.group(1).strip()
    start = text.find("[")
    end   = text.rfind("]") + 1
    if start == -1 or end == 0:
        raise ValueError("No JSON array found in response.")
    return text[start:end]


def extract_json_list(text: str) -> list[str]:
    """
    Groq sometimes wraps JSON in markdown code blocks like ```json [...] ```.
    This function strips the wrapper and returns a clean Python list.
    Raises ValueError if the text cannot be parsed as a JSON array.
    """
    text = text.strip()

    # Remove markdown code fences if present (```json ... ``` or ``` ... ```)
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if fenced:
        text = fenced.group(1).strip()

    # Find the outermost [ ... ] array in case there is preamble text
    start = text.find("[")
    end   = text.rfind("]") + 1
    if start != -1 and end > 0:
        text = text[start:end]

    parsed = json.loads(text)
    if not isinstance(parsed, list):
        raise ValueError("Expected a JSON array")
    return [str(item) for item in parsed]


# ══════════════════════════════════════════════════════════════════════════════
#  PROJECTS
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/projects", status_code=201)
async def create_project(body: ProjectCreate):
    """
    Create a new project.
    user_id is optional during development — in production it comes from the
    decoded JWT token in the Authorization header.
    """
    try:
        data = {
            "name":        body.name,
            "grant_type":  body.grant_type,
            "description": body.description,
            "website":     body.website,
            "user_id":     body.user_id,
        }
        # Remove None values so Supabase uses column defaults
        data = {k: v for k, v in data.items() if v is not None}

        result = supabase.table("projects").insert(data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Insert returned no data.")
        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"create_project error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects")
async def list_projects(user_id: Optional[str] = Query(default=None)):
    """
    List all projects, optionally filtered by user_id.
    Returns newest first.
    """
    try:
        query = supabase.table("projects").select("*").order("created_at", desc=True)
        if user_id:
            query = query.eq("user_id", user_id)
        result = query.execute()
        return result.data

    except Exception as e:
        logger.error(f"list_projects error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}")
async def get_project(project_id: str):
    """Fetch a single project by its UUID."""
    try:
        result = (
            supabase.table("projects")
            .select("*")
            .eq("id", project_id)
            .single()
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Project not found.")
        return result.data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"get_project error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/projects/{project_id}")
async def update_project(project_id: str, body: ProjectUpdate):
    """
    Update name, status, description, or grant_type of a project.
    Only the fields you provide are changed — the rest stay the same.
    """
    try:
        # Build update dict with only the fields that were actually sent
        updates = body.model_dump(exclude_none=True)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update.")

        result = (
            supabase.table("projects")
            .update(updates)
            .eq("id", project_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Project not found.")
        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"update_project error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/projects/{project_id}", status_code=204)
async def delete_project(project_id: str):
    """
    Delete a project and all its related rows (chats, todos, files cascade).
    Returns 204 No Content on success.
    """
    try:
        supabase.table("projects").delete().eq("id", project_id).execute()
    except Exception as e:
        logger.error(f"delete_project error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════════════════
#  SAVED CHATS
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/projects/{project_id}/chats", status_code=201)
async def save_chat(project_id: str, body: ChatCreate):
    """Save an AI question-answer pair inside a project for later reference."""
    try:
        data = {
            "project_id": project_id,
            "question":   body.question,
            "answer":     body.answer,
            "sources":    body.sources,   # stored as JSONB array
        }
        if body.user_id:
            data["user_id"] = body.user_id

        result = supabase.table("saved_chats").insert(data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Insert returned no data.")
        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"save_chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}/chats")
async def list_chats(project_id: str):
    """List all saved AI answers for a project, newest first."""
    try:
        result = (
            supabase.table("saved_chats")
            .select("*")
            .eq("project_id", project_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data

    except Exception as e:
        logger.error(f"list_chats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/projects/{project_id}/chats/{chat_id}", status_code=204)
async def delete_chat(project_id: str, chat_id: str):
    """Delete a single saved chat by its UUID."""
    try:
        supabase.table("saved_chats").delete().eq("id", chat_id).execute()
    except Exception as e:
        logger.error(f"delete_chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════════════════
#  TODOS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/projects/{project_id}/todos")
async def list_todos(project_id: str):
    """List all todos for a project, ordered by order_index then created_at."""
    try:
        result = (
            supabase.table("todos")
            .select("*")
            .eq("project_id", project_id)
            .order("order_index")
            .order("created_at")
            .execute()
        )
        return result.data

    except Exception as e:
        logger.error(f"list_todos error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/projects/{project_id}/todos", status_code=201)
async def create_todo(project_id: str, body: TodoCreate):
    """Add a single todo item to a project manually."""
    try:
        data = {
            "project_id":  project_id,
            "task_text":   body.task_text,
            "order_index": body.order_index,
        }
        if body.due_date:
            data["due_date"] = body.due_date

        result = supabase.table("todos").insert(data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Insert returned no data.")
        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"create_todo error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# IMPORTANT: define /todos/generate BEFORE /todos/{todo_id} so FastAPI
# doesn't mistake the literal "generate" for a UUID path parameter.
@router.post("/projects/{project_id}/todos/generate", status_code=201)
async def generate_todos(project_id: str):
    """
    Ask Groq AI to generate a todo checklist of required documents and steps
    for the project's grant_type, then save them all to the todos table.

    Example: grant_type "iedi_startup_loan" → Groq returns a JSON list of
    10 Nepal-specific action items that are bulk-inserted as todos.
    """
    if not groq_client:
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY not configured — cannot generate todos."
        )

    # ── Fetch the project to get its grant_type ────────────────────────────
    try:
        proj_result = (
            supabase.table("projects")
            .select("grant_type, name")
            .eq("id", project_id)
            .single()
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Project not found: {e}")

    grant_type = proj_result.data.get("grant_type") or "general startup grant"

    # ── Ask Groq for the document checklist ───────────────────────────────
    prompt = (
        f'The user is applying for the {grant_type} in Nepal. '
        f'List exactly the documents they need to collect as a JSON array. '
        f'Each item has: task_text (what to collect in Nepali and English), due_date (null). '
        f'Return ONLY valid JSON array, no other text.\n\n'
        f'Example format:\n'
        f'[{{"task_text": "Company Registration Certificate / कम्पनी दर्ता प्रमाणपत्र", "due_date": null}}]'
    )

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
            temperature=0.2,   # low = more predictable JSON output
        )
        raw_text = response.choices[0].message.content
    except Exception as e:
        logger.error(f"generate_todos Groq error: {e}")
        raise HTTPException(status_code=503, detail="AI service unavailable.")

    # ── Parse the JSON list ────────────────────────────────────────────────
    # Groq may return an array of objects {task_text, due_date} or plain strings.
    # We normalise both shapes into a list of dicts ready for the todos table.
    try:
        raw_parsed = json.loads(
            _extract_json_block(raw_text)
        )
        if not isinstance(raw_parsed, list):
            raise ValueError("Expected a JSON array at top level.")

        # Normalise: accept both {"task_text": ..., "due_date": ...} and plain strings
        todo_items = []
        for item in raw_parsed:
            if isinstance(item, dict):
                todo_items.append({
                    "task_text": item.get("task_text") or item.get("task") or str(item),
                    "due_date":  item.get("due_date"),   # None/null is fine
                })
            else:
                todo_items.append({"task_text": str(item), "due_date": None})

    except (json.JSONDecodeError, ValueError) as e:
        # Log raw output so we can debug the prompt if needed
        logger.error(f"generate_todos JSON parse error: {e}\nRaw Groq output:\n{raw_text}")
        raise HTTPException(
            status_code=500,
            detail=f"AI returned invalid format — raw output logged. Try again. (Parse error: {e})"
        )

    # ── Bulk-insert all todos ──────────────────────────────────────────────
    try:
        rows = []
        for i, item in enumerate(todo_items):
            row = {
                "project_id":  project_id,
                "task_text":   item["task_text"],
                "order_index": i,
            }
            if item.get("due_date"):
                row["due_date"] = item["due_date"]
            rows.append(row)

        result = supabase.table("todos").insert(rows).execute()
        return {
            "generated":  len(result.data),
            "raw_output": raw_text,       # include so you can verify the prompt worked
            "todos":      result.data,
        }

    except Exception as e:
        logger.error(f"generate_todos insert error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/projects/{project_id}/todos/{todo_id}")
async def update_todo(project_id: str, todo_id: str, body: TodoUpdate):
    """
    Update a todo — mark complete/incomplete, change text, set due date, or
    reorder it. Only the fields you send are changed.
    """
    try:
        updates = body.model_dump(exclude_none=True)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update.")

        result = (
            supabase.table("todos")
            .update(updates)
            .eq("id", todo_id)
            .eq("project_id", project_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Todo not found.")
        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"update_todo error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/projects/{project_id}/todos/{todo_id}", status_code=204)
async def delete_todo(project_id: str, todo_id: str):
    """Delete a single todo by its UUID."""
    try:
        supabase.table("todos").delete().eq("id", todo_id).execute()
    except Exception as e:
        logger.error(f"delete_todo error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════════════════
#  FILES (Supabase Storage)
# ══════════════════════════════════════════════════════════════════════════════

def _ensure_bucket():
    """
    Creates the Supabase Storage bucket if it does not already exist.
    Called once before the first upload; safe to call repeatedly.
    """
    try:
        supabase.storage.create_bucket(STORAGE_BUCKET, options={"public": False})
    except Exception:
        pass  # bucket already exists — that's fine


@router.post("/projects/{project_id}/files", status_code=201)
async def upload_file(
    project_id: str,
    file: UploadFile = File(...),
    user_id: Optional[str] = Query(default=None),
):
    """
    Upload a file to Supabase Storage and save its metadata in project_files.
    The file is stored at: praxis-files/{project_id}/{filename}
    """
    _ensure_bucket()

    try:
        file_bytes = await file.read()
        storage_path = f"{project_id}/{file.filename}"

        # Upload binary data to Supabase Storage
        supabase.storage.from_(STORAGE_BUCKET).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": file.content_type or "application/octet-stream"},
        )

        # Save file metadata to the database
        meta = {
            "project_id":      project_id,
            "file_name":       file.filename,
            "file_type":       file.content_type,
            "storage_path":    storage_path,
            "file_size_bytes": len(file_bytes),
        }
        if user_id:
            meta["user_id"] = user_id

        result = supabase.table("project_files").insert(meta).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Metadata insert failed.")
        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"upload_file error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}/files")
async def list_files(project_id: str):
    """List all file metadata records for a project."""
    try:
        result = (
            supabase.table("project_files")
            .select("*")
            .eq("project_id", project_id)
            .order("uploaded_at", desc=True)
            .execute()
        )
        return result.data

    except Exception as e:
        logger.error(f"list_files error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/projects/{project_id}/files/{file_id}", status_code=204)
async def delete_file(project_id: str, file_id: str):
    """
    Delete a file from Supabase Storage and remove its metadata row.
    Looks up the storage_path from the database before deleting from storage.
    """
    try:
        # Get the storage path so we can delete the actual file
        meta_result = (
            supabase.table("project_files")
            .select("storage_path")
            .eq("id", file_id)
            .single()
            .execute()
        )
        if meta_result.data:
            storage_path = meta_result.data["storage_path"]
            supabase.storage.from_(STORAGE_BUCKET).remove([storage_path])

        # Delete the metadata row
        supabase.table("project_files").delete().eq("id", file_id).execute()

    except Exception as e:
        logger.error(f"delete_file error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════════════════
#  NOTIFICATIONS
# ══════════════════════════════════════════════════════════════════════════════

# NOTE: /notifications/unread-count must be defined BEFORE /notifications/{id}
# so FastAPI matches the literal path "unread-count" first.

@router.get("/notifications/unread-count")
async def unread_count(user_id: Optional[str] = Query(default=None)):
    """
    Returns the number of unread notifications for a user.
    Used to show a badge count in the UI without fetching all rows.
    """
    try:
        query = (
            supabase.table("notifications")
            .select("id", count="exact")
            .eq("is_read", False)
        )
        if user_id:
            query = query.eq("user_id", user_id)

        result = query.execute()
        return {"unread_count": result.count or 0}

    except Exception as e:
        logger.error(f"unread_count error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/notifications")
async def list_notifications(
    user_id: Optional[str] = Query(default=None),
    limit:   int           = Query(default=20, le=100),
):
    """
    List notifications for a user, newest first.
    Pass ?user_id=xxx to filter. Pass ?limit=N to cap results.
    """
    try:
        query = (
            supabase.table("notifications")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
        )
        if user_id:
            query = query.eq("user_id", user_id)

        result = query.execute()
        return result.data

    except Exception as e:
        logger.error(f"list_notifications error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/notifications/{notification_id}/read", status_code=200)
async def mark_notification_read(notification_id: str):
    """Mark a single notification as read. Returns the updated row."""
    try:
        result = (
            supabase.table("notifications")
            .update({"is_read": True})
            .eq("id", notification_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Notification not found.")
        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"mark_notification_read error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
