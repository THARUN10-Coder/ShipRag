-- 002_projects_table.sql
-- Creates the projects table for multi-tenant project management.

CREATE TABLE IF NOT EXISTS projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      TEXT UNIQUE NOT NULL,      -- user-facing slug / UUID
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    docs_dir        TEXT NOT NULL DEFAULT './docs',
    config          JSONB NOT NULL DEFAULT '{}',
    chunk_count     INT NOT NULL DEFAULT 0,
    last_synced_at  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_user ON projects (user_id);
CREATE INDEX idx_projects_project_id ON projects (project_id);
