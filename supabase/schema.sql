-- ############################################################################
-- SUPERSEDED — pre-M1 prototype. Do not run this against the M1 project.
--
-- This file describes the earlier prototype backend (users, auth_tokens,
-- assessment_sessions, assessment_responses, reports). The M1 application does not use any of
-- these tables: it uses assessments, responses, consents and audit_logs, with participants held
-- in Supabase Auth.
--
-- The authority for the M1 database is supabase/migrations/ (0001, 0002, 0003), described in
-- docs/m1/SCHEMA_AND_MIGRATIONS.md. The file is kept only as a record of the prototype.
-- ############################################################################

-- ============================================================================
-- ROOTS-AI · Supabase schema for my-nextjs-app
--
-- Every table the backend reads or writes (lib/**, app/api/**):
--   users, auth_tokens               magic-link sign-in       app/api/auth/*
--   assessment_sessions,
--   assessment_responses, reports    assessment, reports, admin
--                                    app/api/assessments/*, app/api/reports/[id],
--                                    app/api/admin/dashboard
--
-- How to run: Supabase dashboard > SQL Editor > paste this file > Run. Safe to re-run.
--
-- Additive only. It creates missing tables, then adds any missing column, index and
-- trigger. It never drops, renames or retypes anything, so existing rows are kept and an
-- existing column keeps its current type and constraints. That is why each table is
-- created with only its essential columns and the rest are added one by one: the same
-- script sets up a fresh project and fills the gaps in an existing one (for example the
-- live assessment_sessions table, which lacked answers_json on 11 Sep 2026).
-- Everything runs in one transaction: if any statement fails, nothing is changed.
--
-- One case it cannot fix: an existing table with an extra NOT NULL column (no default)
-- that the app never fills would still reject the app's inserts. List the live columns
-- first to rule that out:
--   select table_name, column_name, data_type, is_nullable, column_default
--   from information_schema.columns
--   where table_schema = 'public'
--     and table_name in ('users', 'auth_tokens', 'assessment_sessions',
--                        'assessment_responses', 'reports')
--   order by table_name, ordinal_position;
--
-- Access: row level security on, no policies, nothing granted to the anon or
-- authenticated roles. The app reaches these tables only from the server with the service
-- role key, which bypasses RLS; the public anon key can read nothing. This matters most
-- for auth_tokens, which holds live sign-in tokens.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- users: one row per email (created by /api/auth/send-magic-link)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE
);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- ----------------------------------------------------------------------------
-- auth_tokens: one-time magic-link tokens (15 minutes). The token is stored as generated
-- and doubles as the session cookie value once used (lib/auth/session.ts).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  token_type VARCHAR(50) NOT NULL DEFAULT 'magic_link',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
ALTER TABLE public.auth_tokens ADD COLUMN IF NOT EXISTS used_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.auth_tokens ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE public.auth_tokens ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.auth_tokens ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- ----------------------------------------------------------------------------
-- assessment_sessions: one per started assessment
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assessment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
);
ALTER TABLE public.assessment_sessions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'in_progress'; -- in_progress, submitted, abandoned
ALTER TABLE public.assessment_sessions ADD COLUMN IF NOT EXISTS current_module INTEGER DEFAULT 1;
ALTER TABLE public.assessment_sessions ADD COLUMN IF NOT EXISTS answers_json JSONB DEFAULT '{}';
ALTER TABLE public.assessment_sessions ADD COLUMN IF NOT EXISTS research_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.assessment_sessions ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.assessment_sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.assessment_sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.assessment_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- ----------------------------------------------------------------------------
-- assessment_responses: one row per saved answer (the latest also lives in answers_json)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE
);
ALTER TABLE public.assessment_responses ADD COLUMN IF NOT EXISTS module_id INTEGER;
ALTER TABLE public.assessment_responses ADD COLUMN IF NOT EXISTS question_id INTEGER;
ALTER TABLE public.assessment_responses ADD COLUMN IF NOT EXISTS answer JSONB;
ALTER TABLE public.assessment_responses ADD COLUMN IF NOT EXISTS answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.assessment_responses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- ----------------------------------------------------------------------------
-- reports: one per submitted session
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
);
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS report_data JSONB;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'generated'; -- generated, downloaded
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT '1.0.0';
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS accessed_at TIMESTAMP WITH TIME ZONE;

-- ----------------------------------------------------------------------------
-- Indexes (lookups the app makes; the unique ones back one-token-per-link and
-- one-report-per-session)
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_tokens_token ON public.auth_tokens(token);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON public.auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_user_id ON public.assessment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_status ON public.assessment_sessions(status);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_session_id ON public.assessment_responses(session_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_session_id ON public.reports(session_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);

-- ----------------------------------------------------------------------------
-- Server-only access
-- ----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.users FROM anon, authenticated;
REVOKE ALL ON public.auth_tokens FROM anon, authenticated;
REVOKE ALL ON public.assessment_sessions FROM anon, authenticated;
REVOKE ALL ON public.assessment_responses FROM anon, authenticated;
REVOKE ALL ON public.reports FROM anon, authenticated;

-- ----------------------------------------------------------------------------
-- Keep updated_at current on the rows the app updates
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_assessment_sessions_updated_at ON public.assessment_sessions;
CREATE TRIGGER update_assessment_sessions_updated_at BEFORE UPDATE ON public.assessment_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
