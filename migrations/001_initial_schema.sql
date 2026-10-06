-- ============================================================================
-- ROOTS-AI(TM) M2 Item 9 - Initial schema
-- Migration: 001_initial_schema.sql
-- Version:   1.0.1
-- ============================================================================
--
-- Executable form of the schema recorded in:
--   docs/m1/M1_ITEM5_DATABASE_MIGRATIONS.md  (Migration 001)
--
-- Applied before migrations/002_add_rls_policies.sql, which enables RLS and
-- creates the ownership policies the negative isolation suite exercises.
--
-- Run against the ROOTS Supabase project:
--   psql "$SUPABASE_DB_URL" -f migrations/001_initial_schema.sql
--   psql "$SUPABASE_DB_URL" -f migrations/002_add_rls_policies.sql
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- sessions : one row per participant assessment
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  email TEXT,
  answers JSONB NOT NULL DEFAULT '{}',
  completed_modules TEXT[] NOT NULL DEFAULT '{}',
  canonical_questionnaire_version TEXT,
  canonical_scoring_version TEXT,
  updated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes')
);

-- Owned by migration 002 (added there, after RLS prerequisites). Declared here
-- idempotently so a fresh schema and an upgraded schema converge.
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS owner_id uuid;

-- ---------------------------------------------------------------------------
-- reports : the canonical, immutable per-assessment report
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    session_id UUID NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
    scores JSONB NOT NULL DEFAULT '{}',
    band TEXT NOT NULL,
    content_hash TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP
    WITH
        TIME ZONE
);

-- ---------------------------------------------------------------------------
-- audit_logs : append-only trail, server-written
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    session_id UUID REFERENCES sessions (id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_sessions_email ON sessions (email);

CREATE INDEX IF NOT EXISTS idx_sessions_owner_id ON sessions (owner_id);

CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions (created_at);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);

CREATE INDEX IF NOT EXISTS idx_reports_session_id ON reports (session_id);

CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports (created_at);

CREATE INDEX IF NOT EXISTS idx_reports_band ON reports (band);

CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON audit_logs (session_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);

COMMIT;