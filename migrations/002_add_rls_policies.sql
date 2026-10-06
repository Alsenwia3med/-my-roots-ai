-- ============================================================================
-- ROOTS-AI(TM) M2 Item 9 - Controlled Row-Level Security policies
-- Migration: 002_add_rls_policies.sql
-- Version:   1.0.1
-- ============================================================================
--
-- Consumes the schema created by migrations/001_initial_schema.sql.
--
-- This migration is the executable form of the RLS policy design recorded in:
--   docs/m1/M1_ITEM5_DATABASE_MIGRATIONS.md   (Migration 002)
--   docs/m1/M1_ITEM7_RLS_DATA_ISOLATION.md    (policy design)
--
-- The policies are written against the design's `auth.jwt() ->> 'email'`
-- ownership model, with the M2 hardening applied where the design was not
-- executable as written:
--
--   * `gen_random_uuid()` returns `uuid`, but the design compared `sessions.id`
--     to `auth.uid()::text`. The cast makes that comparison impossible to index
--     and never matches. Ownership is therefore anchored on the immutable
--     `sessions.owner_id` (equal to `auth.uid()`) with the email claim retained
--     as the secondary path the design intended.
--   * `sessions` FOR DELETE and `reports`/`audit_logs` FOR UPDATE/DELETE are
--     explicitly denied, as recorded in M1_ITEM7.
--   * `audit_logs` INSERT is denied to end users so the trail cannot be forged;
--     server-side (service role) writes bypass RLS and remain the only writer.
--
-- Run against the ROOTS Supabase project:
--   psql "$SUPABASE_DB_URL" -f migrations/001_initial_schema.sql
--   psql "$SUPABASE_DB_URL" -f migrations/002_add_rls_policies.sql
-- or apply via the Supabase SQL editor.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Ownership anchor.
--
-- `auth.uid()` is the Supabase JWT subject. It is a uuid, so it is stored as
-- uuid rather than compared as text. `email` remains for the JWT-email path
-- and for the Recovery Potential factor bands (Q13/Q14 context).
-- ---------------------------------------------------------------------------
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS owner_id uuid;

COMMENT ON COLUMN sessions.owner_id IS 'Supabase auth subject (auth.uid()) that owns this assessment. Written by the server on session creation; never user-supplied.';

CREATE INDEX IF NOT EXISTS idx_sessions_owner_id ON sessions (owner_id);

-- ---------------------------------------------------------------------------
-- Enable RLS on every table carrying participant data.
-- ---------------------------------------------------------------------------
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners too, so a misconfigured connection cannot read
-- across users by virtue of owning the table.
ALTER TABLE sessions FORCE ROW LEVEL SECURITY;

ALTER TABLE reports FORCE ROW LEVEL SECURITY;

ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- sessions
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own sessions" ON sessions;

DROP POLICY IF EXISTS "Users can insert their own sessions" ON sessions;

DROP POLICY IF EXISTS "Users can update their own sessions" ON sessions;

DROP POLICY IF EXISTS "Users cannot delete sessions" ON sessions;

DROP POLICY IF EXISTS "Admins can access all data" ON sessions;

-- A participant sees only sessions they own, matched on the auth subject or,
-- where a session was created before the subject was bound, on the JWT email.
CREATE POLICY "Users can view their own sessions" ON sessions FOR
SELECT USING (
        owner_id = auth.uid ()
        OR (
            owner_id IS NULL
            AND email = auth.jwt () ->> 'email'
        )
        OR (auth.jwt () ->> 'role') = 'admin'
    );

-- A session can only be inserted against the caller's own identity. The
-- identity columns are checked, not merely referenced, so a client cannot
-- create a session that belongs to somebody else.
CREATE POLICY "Users can insert their own sessions" ON sessions FOR
INSERT
WITH
    CHECK (
        (
            owner_id = auth.uid ()
            OR owner_id IS NULL
        )
        AND email = (auth.jwt () ->> 'email')
    );

-- Update is confined to the caller's own rows. A row whose ownership the
-- caller cannot see is not updatable, so WITH CHECK repeats the USING clause.
CREATE POLICY "Users can update their own sessions" ON sessions FOR
UPDATE USING (
    owner_id = auth.uid ()
    OR (
        owner_id IS NULL
        AND email = auth.jwt () ->> 'email'
    )
)
WITH
    CHECK (
        owner_id = auth.uid ()
        OR (
            owner_id IS NULL
            AND email = auth.jwt () ->> 'email'
        )
    );

-- Participants never delete assessment records. Retention is a server concern.
CREATE POLICY "Users cannot delete sessions" ON sessions FOR DELETE USING (false);

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;

DROP POLICY IF EXISTS "Users can insert their own reports" ON reports;

DROP POLICY IF EXISTS "Users cannot update reports" ON reports;

DROP POLICY IF EXISTS "Users cannot delete reports" ON reports;

DROP POLICY IF EXISTS "Admins can access all reports" ON reports;

-- A report is reachable only through a session the caller owns. Because the
-- subquery is itself subject to `sessions` RLS, this composes: a user cannot
-- reach another user's report even by guessing the report id.
CREATE POLICY "Users can view their own reports" ON reports FOR
SELECT USING (
        session_id IN (
            SELECT id
            FROM sessions
            WHERE
                owner_id = auth.uid ()
                OR (
                    owner_id IS NULL
                    AND email = auth.jwt () ->> 'email'
                )
        )
        OR (auth.jwt () ->> 'role') = 'admin'
    );

CREATE POLICY "Users can insert their own reports" ON reports FOR
INSERT
WITH
    CHECK (
        session_id IN (
            SELECT id
            FROM sessions
            WHERE
                owner_id = auth.uid ()
                OR (
                    owner_id IS NULL
                    AND email = auth.jwt () ->> 'email'
                )
        )
    );

-- A stored canonical report is immutable once written (M2 tamper-detection
-- relies on this: the content hash must never be rewritten in place).
CREATE POLICY "Users cannot update reports" ON reports FOR
UPDATE USING (false);

CREATE POLICY "Users cannot delete reports" ON reports FOR DELETE USING (false);

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;

DROP POLICY IF EXISTS "Users cannot insert audit logs" ON audit_logs;

DROP POLICY IF EXISTS "Users cannot update audit logs" ON audit_logs;

DROP POLICY IF EXISTS "Users cannot delete audit logs" ON audit_logs;

DROP POLICY IF EXISTS "Admins can access all audit logs" ON audit_logs;

-- Read-only for participants, scoped to their own sessions.
CREATE POLICY "Users can view their own audit logs" ON audit_logs FOR
SELECT USING (
        session_id IN (
            SELECT id
            FROM sessions
            WHERE
                owner_id = auth.uid ()
                OR (
                    owner_id IS NULL
                    AND email = auth.jwt () ->> 'email'
                )
        )
        OR (auth.jwt () ->> 'role') = 'admin'
    );

-- The trail is append-only and server-written. An end user must not be able to
-- insert, because a forged entry would defeat the audit requirement.
CREATE POLICY "Users cannot insert audit logs" ON audit_logs FOR
INSERT
WITH
    CHECK (false);

CREATE POLICY "Users cannot update audit logs" ON audit_logs FOR
UPDATE USING (false);

CREATE POLICY "Users cannot delete audit logs" ON audit_logs FOR DELETE USING (false);

COMMIT;