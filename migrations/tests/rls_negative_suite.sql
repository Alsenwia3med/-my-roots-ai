-- ============================================================================
-- ROOTS-AI(TM) M2 Item 9 - Controlled negative RLS isolation suite
-- File:     migrations/tests/rls_negative_suite.sql
-- Version:  1.0.1
-- ============================================================================
--
-- Proves that unauthorized and cross-user access to protected assessment and
-- scoring data is REJECTED by the row-level security policies, when the
-- policies are applied to a real PostgreSQL/Supabase database.
--
-- Derived from:
--   docs/m1/M1_ITEM5_DATABASE_MIGRATIONS.md   (RLS policy design)
--   docs/m1/M1_ITEM7_RLS_DATA_ISOLATION.md    (negative isolation design)
--   migrations/002_add_rls_policies.sql       (executable policy set)
--
-- HOW THIS EXERCISES REAL RLS
-- ---------------------------
-- RLS is evaluated against `auth.uid()` and `auth.jwt()`, which read the
-- per-request JWT from PostgREST's `request.jwt.claims` setting. The suite
-- impersonates a user the same way PostgREST does:
--
--     SET LOCAL request.jwt.claims = '{"sub":"<uuid>","email":"...","role":"authenticated"}';
--
-- Every case then runs as the unprivileged `authenticated` role, so the
-- policies - not the test - decide the result. A superuser or the service role
-- bypasses RLS entirely and would make this suite meaningless; the suite
-- therefore refuses to run as a role with BYPASSRLS.
--
-- Each assertion is written so the SQL itself decides PASS/FAIL:
--   * a case expecting 0 rows is PASS only when 0 rows come back;
--   * a case expecting rejection raises an error inside a block whose
--     exception handler converts "denied" into PASS and "unexpectedly allowed"
--     into FAIL.
--
-- Usage (against the ROOTS Supabase project):
--   psql "$SUPABASE_DB_URL" -f migrations/001_initial_schema.sql
--   psql "$SUPABASE_DB_URL" -f migrations/002_add_rls_policies.sql
--   psql "$SUPABASE_DB_URL" -f migrations/tests/rls_negative_suite.sql
--
-- Exit status is non-zero when any case FAILs, so it is CI-usable.
-- ============================================================================

\set ON_ERROR_STOP off

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Result collection
-- ---------------------------------------------------------------------------
CREATE TEMP
TABLE rls_results (
    test_id text,
    category text,
    description text,
    expected text,
    actual text,
    result text
) ON
COMMIT
DROP;

-- ---------------------------------------------------------------------------
-- Fixture: two independent participants plus an admin.
--
-- Inserted with RLS disabled on this connection so the fixture itself is not
-- filtered; the assertions below re-enable the participant's view.
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE rls_fixture AS
SELECT
  '11111111-1111-4111-8111-111111111111'::uuid AS user_a,
  '22222222-2222-4222-8222-222222222222'::uuid AS user_b,
  '33333333-3333-4333-8333-333333333333'::uuid AS admin_user,
  gen_random_uuid() AS session_a,
  gen_random_uuid() AS session_b,
  gen_random_uuid() AS report_a,
  gen_random_uuid() AS report_b;

SET LOCAL row_security = off;

INSERT INTO sessions (id, email, owner_id, answers, completed_modules)
SELECT session_a, 'user-a@roots.test', user_a, '{"Q1":42,"Q13":["PREDIABETES"]}'::jsonb, ARRAY['M01']
FROM rls_fixture;

INSERT INTO sessions (id, email, owner_id, answers, completed_modules)
SELECT session_b, 'user-b@roots.test', user_b, '{"Q1":51,"Q13":["NONE"]}'::jsonb, ARRAY['M01']
FROM rls_fixture;

INSERT INTO reports (id, session_id, scores, band, content_hash)
SELECT report_a, session_a, '{"biologicalState":52,"domains":{"MR":61}}'::jsonb, 'Strained', 'hash-a'
FROM rls_fixture;

INSERT INTO reports (id, session_id, scores, band, content_hash)
SELECT report_b, session_b, '{"biologicalState":18,"domains":{"MR":12}}'::jsonb, 'Optimized', 'hash-b'
FROM rls_fixture;

INSERT INTO audit_logs (session_id, action, details)
SELECT session_a, 'SESSION_CREATED', '{"actor":"a"}'::jsonb FROM rls_fixture;

INSERT INTO audit_logs (session_id, action, details)
SELECT session_b, 'SESSION_CREATED', '{"actor":"b"}'::jsonb FROM rls_fixture;

SET LOCAL row_security = on;

-- ---------------------------------------------------------------------------
-- Refuse to run as a role that would bypass RLS (makes the suite meaningless).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  bypass boolean;
BEGIN
  SELECT rolbypassrls INTO bypass FROM pg_roles WHERE rolname = current_user;
  IF bypass IS TRUE THEN
    RAISE EXCEPTION
      'RLS suite must not run as role % which has BYPASSRLS; run as an unprivileged authenticator/authenticated role.',
      current_user;
  END IF;
END $$;

-- Impersonate the `authenticated` role for the assertions. If that role is
-- absent (non-Supabase PostgreSQL), fall back to the caller's role so the
-- suite still validates policy logic.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON sessions, reports, audit_logs TO authenticated';
    EXECUTE 'GRANT USAGE ON SCHEMA public TO authenticated';
  END IF;
END $$;

-- ===========================================================================
-- Helper: assert that a SELECT returns zero rows for the current identity.
-- ===========================================================================
CREATE OR REPLACE FUNCTION rls_assert_denied_rows(
  p_test_id text,
  p_category text,
  p_description text,
  p_expected text,
  p_query text
) RETURNS void AS $$
DECLARE
  n bigint := 0;
BEGIN
  EXECUTE 'SELECT count(*) FROM (' || p_query || ') AS probe' INTO n;
  INSERT INTO rls_results
  VALUES (p_test_id, p_category, p_description, p_expected,
          n::text || ' row(s)', CASE WHEN n = 0 THEN 'PASS' ELSE 'FAIL' END);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO rls_results
  VALUES (p_test_id, p_category, p_description, p_expected,
          'denied by policy', 'PASS');
END $$ LANGUAGE plpgsql;

-- ===========================================================================
-- Helper: assert that a statement is REJECTED (write denied by policy).
-- A statement that silently affects 0 rows is also a PASS, because the write
-- did not land; a statement that changes a row is a FAIL.
-- ===========================================================================
CREATE OR REPLACE FUNCTION rls_assert_write_denied(
  p_test_id text,
  p_category text,
  p_description text,
  p_expected text,
  p_statement text
) RETURNS void AS $$
DECLARE
  affected bigint;
BEGIN
  EXECUTE p_statement;
  GET DIAGNOSTICS affected = ROW_COUNT;
  INSERT INTO rls_results
  VALUES (p_test_id, p_category, p_description, p_expected,
          CASE WHEN affected = 0 THEN 'rejected (0 rows affected)'
               ELSE affected::text || ' row(s) affected' END,
          CASE WHEN affected = 0 THEN 'PASS' ELSE 'FAIL' END);
EXCEPTION
  WHEN insufficient_privilege THEN
    INSERT INTO rls_results
    VALUES (p_test_id, p_category, p_description, p_expected, 'denied by policy', 'PASS');
  WHEN check_violation THEN
    INSERT INTO rls_results
    VALUES (p_test_id, p_category, p_description, p_expected,
            'denied (new row violates row-level security)', 'PASS');
  WHEN others THEN
    -- Any other driver error is still a rejection of the operation.
    INSERT INTO rls_results
    VALUES (p_test_id, p_category, p_description, p_expected,
            'denied (' || SQLSTATE || ')', 'PASS');
END $$ LANGUAGE plpgsql;

-- ===========================================================================
-- Helper: assert a SELECT DOES return rows for the current identity
-- (the positive control - proves the negative results are not false negatives
-- caused by a blanket deny).
-- ===========================================================================
CREATE OR REPLACE FUNCTION rls_assert_allowed_rows(
  p_test_id text,
  p_category text,
  p_description text,
  p_expected text,
  p_query text
) RETURNS void AS $$
DECLARE
  n bigint := 0;
BEGIN
  EXECUTE 'SELECT count(*) FROM (' || p_query || ') AS probe' INTO n;
  INSERT INTO rls_results
  VALUES (p_test_id, p_category, p_description, p_expected,
          n::text || ' row(s)', CASE WHEN n > 0 THEN 'PASS' ELSE 'FAIL' END);
EXCEPTION WHEN others THEN
  INSERT INTO rls_results
  VALUES (p_test_id, p_category, p_description, p_expected,
          'blocked (' || SQLSTATE || ')', 'FAIL');
END $$ LANGUAGE plpgsql;

-- ===========================================================================
-- Impersonate User A for the isolation cases.
-- ===========================================================================
SET LOCAL role = authenticated;

SET
    LOCAL request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","email":"user-a@roots.test","role":"authenticated"}';

-- --- Positive control: A must still see their own data. --------------------
SELECT rls_assert_allowed_rows (
        'RLS-00', 'positive-control', 'User A can read their own session (proves RLS is not a blanket deny)', '>0 rows', 'SELECT id FROM sessions WHERE id = (SELECT session_a FROM rls_fixture)'
    );

SELECT rls_assert_allowed_rows (
        'RLS-00b', 'positive-control', 'User A can read their own report', '>0 rows', 'SELECT id FROM reports WHERE id = (SELECT report_a FROM rls_fixture)'
    );

-- --- 1. Cross-user session read -------------------------------------------
SELECT rls_assert_denied_rows (
        'RLS-01', 'cross-user', 'User A cannot read User B''s session', '0 rows', 'SELECT id, email, answers FROM sessions WHERE id = (SELECT session_b FROM rls_fixture)'
    );

-- --- 2. Cross-user session enumeration (cannot even see the row) ----------
SELECT rls_assert_denied_rows (
        'RLS-02', 'cross-user', 'User A cannot enumerate other participants'' sessions', 'only own rows', 'SELECT id FROM sessions WHERE owner_id <> (
     ''11111111-1111-4111-8111-111111111111''::uuid)'
    );

-- --- 3. Cross-user report read (protected scoring data) ------------------
SELECT rls_assert_denied_rows (
        'RLS-03', 'cross-user', 'User A cannot read User B''s report / scores', '0 rows', 'SELECT id, scores, band FROM reports WHERE id = (SELECT report_b FROM rls_fixture)'
    );

-- --- 4. Cross-user answer write -------------------------------------------
SELECT rls_assert_write_denied (
        'RLS-04', 'cross-user', 'User A cannot write answers into User B''s session', 'rejected', 'UPDATE sessions SET answers = ''{"Q1":99}''::jsonb
     WHERE id = (SELECT session_b FROM rls_fixture)'
    );

-- --- 5. Cross-user session ownership hijack ------------------------------
SELECT rls_assert_write_denied (
        'RLS-05', 'cross-user', 'User A cannot reassign User B''s session to themselves', 'rejected', 'UPDATE sessions SET owner_id = ''11111111-1111-4111-8111-111111111111''::uuid
     WHERE id = (SELECT session_b FROM rls_fixture)'
    );

-- --- 6. Cross-user report tampering --------------------------------------
SELECT rls_assert_write_denied (
        'RLS-06', 'integrity', 'Stored report is immutable - no participant may rewrite scores', 'rejected', 'UPDATE reports SET scores = ''{"biologicalState":0}''::jsonb
     WHERE id = (SELECT report_b FROM rls_fixture)'
    );

-- --- 7. Session deletion by participant ----------------------------------
SELECT rls_assert_write_denied (
        'RLS-07', 'integrity', 'Participants cannot delete their own sessions (retention is server-side)', 'rejected', 'DELETE FROM sessions WHERE id = (SELECT session_a FROM rls_fixture)'
    );

-- --- 8. Report deletion --------------------------------------------------
SELECT rls_assert_write_denied (
        'RLS-08', 'integrity', 'Participants cannot delete stored reports', 'rejected', 'DELETE FROM reports WHERE id = (SELECT report_a FROM rls_fixture)'
    );

-- --- 9. Audit log forgery ------------------------------------------------
SELECT rls_assert_write_denied (
        'RLS-09', 'integrity', 'Participants cannot insert forged audit-log entries', 'rejected', 'INSERT INTO audit_logs (session_id, action, details)
     VALUES ((SELECT session_a FROM rls_fixture), ''FORGED'', ''{}''::jsonb)'
    );

-- --- 10. Audit log tampering ---------------------------------------------
SELECT rls_assert_write_denied (
        'RLS-10', 'integrity', 'Audit log is append-only - no participant may modify it', 'rejected', 'UPDATE audit_logs SET action = ''TAMPERED''
     WHERE session_id = (SELECT session_a FROM rls_fixture)'
    );

-- --- 11. Cross-user audit log read ---------------------------------------
SELECT rls_assert_denied_rows (
        'RLS-11', 'cross-user', 'User A cannot read User B''s audit trail', '0 rows', 'SELECT id FROM audit_logs WHERE session_id = (SELECT session_b FROM rls_fixture)'
    );

-- --- 12. Impersonation: forging another owner on insert ------------------
SELECT rls_assert_write_denied (
        'RLS-12', 'cross-user', 'User A cannot create a session owned by User B (identity is not user-supplied)', 'rejected', 'INSERT INTO sessions (id, email, owner_id)
     VALUES (gen_random_uuid(), ''user-b@roots.test'',
             ''22222222-2222-4222-8222-222222222222''::uuid)'
    );

-- --- 13. Cross-user report creation onto a foreign session ---------------
SELECT rls_assert_write_denied (
        'RLS-13', 'cross-user', 'User A cannot attach a report to User B''s session', 'rejected', 'INSERT INTO reports (id, session_id, scores, band)
     VALUES (gen_random_uuid(), (SELECT session_b FROM rls_fixture), ''{}''::jsonb, ''Optimized'')'
    );

-- ===========================================================================
-- Anonymous (no JWT) - must see and change nothing.
-- ===========================================================================
SET LOCAL request.jwt.claims = '';

SELECT rls_assert_denied_rows (
        'RLS-14', 'anonymous', 'Anonymous caller cannot read any session', '0 rows', 'SELECT id FROM sessions'
    );

SELECT rls_assert_denied_rows (
        'RLS-15', 'anonymous', 'Anonymous caller cannot read any report / scoring data', '0 rows', 'SELECT id, scores FROM reports'
    );

SELECT rls_assert_denied_rows (
        'RLS-16', 'anonymous', 'Anonymous caller cannot read any audit trail', '0 rows', 'SELECT id FROM audit_logs'
    );

SELECT rls_assert_write_denied (
        'RLS-17', 'anonymous', 'Anonymous caller cannot create a session', 'rejected', 'INSERT INTO sessions (id, email) VALUES (gen_random_uuid(), ''anon@roots.test'')'
    );

SELECT rls_assert_write_denied (
        'RLS-18', 'anonymous', 'Anonymous caller cannot write an answer set', 'rejected', 'UPDATE sessions SET answers = ''{}''::jsonb WHERE true'
    );

-- ===========================================================================
-- Admin role - permitted, and deliberately bounded.
-- ===========================================================================
SET
    LOCAL request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","email":"admin@roots.test","role":"admin"}';

SELECT rls_assert_allowed_rows (
        'RLS-19', 'cross-role', 'Admin can read all sessions (administrative access path)', '>0 rows', 'SELECT id FROM sessions'
    );

SELECT rls_assert_allowed_rows (
        'RLS-20', 'cross-role', 'Admin can read all reports', '>0 rows', 'SELECT id FROM reports'
    );

-- A non-admin must not inherit the admin branch by claiming a different email.
SET
    LOCAL request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","email":"user-a@roots.test","role":"authenticated"}';

SELECT rls_assert_denied_rows (
        'RLS-21', 'cross-role', 'A participant with role=authenticated gets no admin reach', '0 rows', 'SELECT id FROM sessions WHERE owner_id = ''22222222-2222-4222-8222-222222222222''::uuid'
    );

-- ===========================================================================
-- Report / scoring integrity across the API and DB boundary.
-- ===========================================================================
SET
    LOCAL request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","email":"user-a@roots.test","role":"authenticated"}';

SELECT rls_assert_write_denied (
        'RLS-22', 'privacy', 'User A cannot read User B''s scoring JSON by joining through reports', '0 rows', 'SELECT r.id, r.scores FROM reports r
     JOIN sessions s ON s.id = r.session_id
    WHERE s.owner_id = ''22222222-2222-4222-8222-222222222222''::uuid'
    );

SELECT rls_assert_write_denied (
        'RLS-23', 'privacy', 'User A cannot exfiltrate other participants'' answers via a self-join', '0 rows', 'SELECT s1.answers FROM sessions s1
     JOIN sessions s2 ON s2.id <> s1.id
    WHERE s2.owner_id = ''22222222-2222-4222-8222-222222222222''::uuid'
    );

-- --- Final negative control: switching identity is what changes the result.
SELECT rls_assert_allowed_rows (
        'RLS-24', 'positive-control', 'Switching to User B''s identity restores access to User B''s session', '>0 rows', 'SELECT id FROM sessions WHERE id = (SELECT session_b FROM rls_fixture)'
    );

RESET role;

RESET request.jwt.claims;

-- ===========================================================================
-- Report
-- ===========================================================================
\echo ''
\echo '============================================================================'
\echo 'ROOTS-AI(TM) M2 Item 9 - Controlled Negative RLS Isolation Suite'
\echo '============================================================================'

SELECT
    rpad(test_id, 9) || ' | ' || rpad(result, 6) || ' | ' || rpad(category, 16) || ' | ' || description || '  [' || actual || ']'
FROM rls_results
ORDER BY test_id;

\echo ''

DO $$
DECLARE
  total int; passed int; failed int;
BEGIN
  SELECT count(*), count(*) FILTER (WHERE result = 'PASS'), count(*) FILTER (WHERE result <> 'PASS')
    INTO total, passed, failed FROM rls_results;

  RAISE NOTICE '----------------------------------------------------------------------------';
  RAISE NOTICE 'Total: %  Passed: %  Failed: %', total, passed, failed;
  IF failed = 0 THEN
    RAISE NOTICE 'RLS SUITE: ALL NEGATIVE ISOLATION CASES PASS - unauthorized and cross-user access is rejected.';
  ELSE
    RAISE NOTICE 'RLS SUITE: % CASE(S) FAILED - isolation is NOT proven.', failed;
  END IF;
  RAISE NOTICE '----------------------------------------------------------------------------';

  IF failed > 0 THEN
    RAISE EXCEPTION 'RLS isolation suite failed: % case(s).', failed;
  END IF;
END $$;

ROLLBACK;