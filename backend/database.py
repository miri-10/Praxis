"""
database.py
-----------
Copy the SQL below and run it in your Supabase SQL Editor:
  Supabase Dashboard → SQL Editor → New Query → Paste → Run

Run each block in order. Re-running is safe — DROP IF EXISTS handles it.
"""

SCHEMA_SQL = """
-- ─────────────────────────────────────────────────────────────────────────────
-- PRAXIS  —  Nepal Startup Legal Assistant
-- Run this in Supabase SQL Editor to create all tables.
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop tables in reverse dependency order (children first)
DROP TABLE IF EXISTS notifications     CASCADE;
DROP TABLE IF EXISTS project_files     CASCADE;
DROP TABLE IF EXISTS todos             CASCADE;
DROP TABLE IF EXISTS saved_chats       CASCADE;
DROP TABLE IF EXISTS projects          CASCADE;

-- ── projects ─────────────────────────────────────────────────────────────────
-- One row per startup project. A user can have many projects.
CREATE TABLE projects (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  grant_type  TEXT,
  description TEXT,
  website     TEXT,
  status      TEXT        DEFAULT 'active'
              CHECK (status IN ('active', 'submitted', 'approved', 'rejected')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- If the projects table already exists, add the website column with:
--   ALTER TABLE projects ADD COLUMN IF NOT EXISTS website TEXT;

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── saved_chats ───────────────────────────────────────────────────────────────
-- AI question-answer pairs saved by the user inside a project.
CREATE TABLE saved_chats (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID        REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  question    TEXT        NOT NULL,
  answer      TEXT        NOT NULL,
  sources     JSONB       DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── todos ─────────────────────────────────────────────────────────────────────
-- Checklist items for a project. Can be AI-generated or manually added.
CREATE TABLE todos (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id   UUID        REFERENCES projects(id) ON DELETE CASCADE,
  task_text    TEXT        NOT NULL,
  is_completed BOOLEAN     DEFAULT FALSE,
  due_date     DATE,
  order_index  INTEGER     DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── project_files ─────────────────────────────────────────────────────────────
-- Metadata for files uploaded to Supabase Storage under a project.
CREATE TABLE project_files (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id       UUID        REFERENCES projects(id) ON DELETE CASCADE,
  user_id          UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name        TEXT        NOT NULL,
  file_type        TEXT,
  storage_path     TEXT        NOT NULL,
  file_size_bytes  INTEGER,
  uploaded_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── notifications ─────────────────────────────────────────────────────────────
-- System alerts pushed to users (grant deadlines, status changes, etc.)
-- No FK on user_id so notifications can exist before auth is fully set up.
CREATE TABLE notifications (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID,
  title       TEXT        NOT NULL,
  summary     TEXT        NOT NULL,
  source_url  TEXT,
  tags        JSONB       DEFAULT '[]',
  is_read     BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security (optional — enable after adding auth) ──────────────────
-- ALTER TABLE projects       ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE saved_chats    ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE todos          ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE project_files  ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;
"""

if __name__ == "__main__":
    # Running this file prints the SQL so you can copy it easily
    print(SCHEMA_SQL)
