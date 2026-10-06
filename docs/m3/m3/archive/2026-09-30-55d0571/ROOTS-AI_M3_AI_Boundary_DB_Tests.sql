-- ============================================================================
-- ROOTS-AI™ · M3 CONTROLLED AI BOUNDARY — database evidence
--
-- Regulatory Readiness Annex §8.1 requires "database grant/policy evidence proving that the
-- narrative path cannot modify authoritative results". This file is that evidence, produced by
-- running the probes rather than by describing them.
--
-- For ROOTS to run independently in: Supabase dashboard > SQL Editor > Run.
-- Run AFTER supabase/roots_ai_complete.sql, which creates the roots_ai_narrative role.
--
-- SELF-CONTAINED — no set-up and no editing needed:
--   1. creates one temporary participant with a submitted assessment, a score row and a report;
--   2. runs every probe AS roots_ai_narrative, the least-privilege role the narrative path may
--      ever hold, and as service_role for the positive controls;
--   3. rolls back every probe — a write that is wrongly allowed is undone too;
--   4. removes the test account and all its data;
--   5. prints one row per test. Every row must read PASS.
--
-- It leaves no data behind. Real participants' data is never read or changed: every probe is
-- scoped to the test account, whose IDs start with 0000000f-.
--
-- Coverage:
--   AI-01  the narrative can reach no answers, identity, free text or audit trail
--   AI-03  the narrative has no INSERT, UPDATE or DELETE on any authoritative record
--   GR     catalogue evidence: what the role is actually granted, from the system tables
--   PC     positive controls — a write the harness CAN see, so no PASS is vacuous
--
-- Note on the application: this role is defence in depth. The narrative path in lib/ai/* holds
-- no database client at all — its only I/O is one outbound HTTPS request — and that separation
-- is evidenced independently by tests/ai/boundary.test.ts.
-- ============================================================================

-- ---- 0. clean up any leftovers from an interrupted earlier run ----------------------------
DELETE FROM auth.users WHERE id = '0000000f-0000-4000-8000-00000000000a';

-- ---- 1. one test participant with a finished, scored, reported assessment -----------------
INSERT INTO auth.users (id, email, aud, role)
VALUES ('0000000f-0000-4000-8000-00000000000a', 'm3-ai-boundary@roots-ai.invalid', 'authenticated', 'authenticated');

INSERT INTO public.profiles (id, email)
VALUES ('0000000f-0000-4000-8000-00000000000a', 'm3-ai-boundary@roots-ai.invalid')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.assessments (id, profile_id)
VALUES ('0000000f-0000-4000-8000-0000000000a1', '0000000f-0000-4000-8000-00000000000a');

INSERT INTO public.responses (assessment_id, question_id, raw_value) VALUES
  ('0000000f-0000-4000-8000-0000000000a1', 'Q1', '40'),
  ('0000000f-0000-4000-8000-0000000000a1', 'Q73', '"I have been very tired lately."');

UPDATE public.assessments
   SET status = 'submitted', submitted_at = now(), submission_reference = 'RS-M3AI-A1'
 WHERE id = '0000000f-0000-4000-8000-0000000000a1';

INSERT INTO public.scores (assessment_id, mr_score, biological_state, confidence_label, scoring_version, calculation_trace)
VALUES ('0000000f-0000-4000-8000-0000000000a1', 62, 61, 'High', '1.0.1', '{"probe":"trace with per-question points"}');

INSERT INTO public.reports (assessment_id, status, report_reference, canonical_json, generation_metadata)
VALUES ('0000000f-0000-4000-8000-0000000000a1', 'completed', 'RPT-M3AI-A1',
        '{"sections":[{"number":16,"title":"Participant Answers"}]}', '{"probe":"meta"}');

-- ---- 2. the probe ---------------------------------------------------------------------------
DROP TABLE IF EXISTS m3_ai_results;
CREATE TEMP TABLE m3_ai_results (
  seq SERIAL PRIMARY KEY, test_id TEXT, area TEXT, test TEXT, expected TEXT, actual TEXT, outcome TEXT
);

-- Runs p_sql as p_role inside a sub-transaction that is always rolled back, and records the
-- outcome. A missing table, column or function is a broken install, never a security refusal.
--   p_expect 'denied'  must be refused outright                (privilege)
--   p_expect 'none'    read: 0 rows, or refused                (isolation)
--   p_expect 'blocked' write: refused, or 0 rows affected      (write isolation)
--   p_expect 'allowed' write: at least 1 row affected          (positive control)
CREATE OR REPLACE FUNCTION pg_temp.ai_probe(p_id TEXT, p_area TEXT, p_test TEXT, p_role TEXT, p_sql TEXT, p_expect TEXT)
RETURNS void LANGUAGE plpgsql AS $probe$
DECLARE
  n BIGINT := NULL;
  refused TEXT := NULL;
  missing TEXT := NULL;
  pass BOOLEAN;
BEGIN
  BEGIN
    EXECUTE format('SET LOCAL ROLE %I', p_role);
    IF p_expect IN ('none', 'denied') AND p_sql ~* '^\s*select' THEN
      EXECUTE 'SELECT count(*) FROM (' || p_sql || ') q' INTO n;
    ELSE
      EXECUTE p_sql;
      GET DIAGNOSTICS n = ROW_COUNT;
    END IF;
    RAISE EXCEPTION 'm3_probe_rollback';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'm3_probe_rollback' THEN
      n := NULL;
      IF SQLSTATE IN ('42P01', '42703', '42883') THEN missing := SQLERRM; ELSE refused := SQLERRM; END IF;
    END IF;
  END;

  pass := missing IS NULL AND CASE p_expect
    WHEN 'denied'  THEN refused IS NOT NULL
    WHEN 'none'    THEN refused IS NOT NULL OR n = 0
    WHEN 'blocked' THEN refused IS NOT NULL OR n = 0
    WHEN 'allowed' THEN refused IS NULL AND n >= 1
  END;

  INSERT INTO m3_ai_results (test_id, area, test, expected, actual, outcome) VALUES (
    p_id, p_area, p_test,
    CASE p_expect WHEN 'denied' THEN 'refused' WHEN 'none' THEN '0 rows (or refused)'
                  WHEN 'blocked' THEN 'refused (or 0 rows)' ELSE 'at least 1 row changed (rolled back)' END,
    COALESCE('SCHEMA MISSING — run roots_ai_complete.sql first: ' || missing,
             'refused: ' || refused,
             n::TEXT || CASE WHEN p_sql ~* '^\s*select' THEN ' rows' ELSE ' rows changed (rolled back)' END),
    CASE WHEN pass THEN 'PASS' ELSE 'FAIL' END);
END
$probe$;

-- ---- 3. the tests ---------------------------------------------------------------------------
DO $tests$
DECLARE
  a_done CONSTANT TEXT := '''0000000f-0000-4000-8000-0000000000a1''';
  a_q    CONSTANT TEXT := '''0000000f-0000-4000-8000-00000000000a''';
BEGIN
  -- PC — positive controls. The server itself CAN write these records, so a refusal below is a
  -- real privilege boundary and not an artefact of an empty table or a broken probe.
  -- Note: no positive control updates a score, because none can. A stored score row is frozen
  -- for every role including service_role (integrity rule IN-01, evidenced in the M2 suite), so
  -- AI-03-01 below is refused twice over: by privilege and by the integrity trigger.
  PERFORM pg_temp.ai_probe('PC-01', 'Positive control', 'service_role writes an audit record',
    'service_role', 'INSERT INTO public.audit_logs (action, result) VALUES (''m3.probe'', ''success'')', 'allowed');
  PERFORM pg_temp.ai_probe('PC-02', 'Positive control', 'service_role updates a report row',
    'service_role', 'UPDATE public.reports SET status = ''failed'' WHERE assessment_id = ' || a_done, 'allowed');

  -- AI-03 — the narrative path cannot modify any authoritative record.
  PERFORM pg_temp.ai_probe('AI-03-01', 'AI write prevention', 'narrative updates a score',
    'roots_ai_narrative', 'UPDATE public.scores SET biological_state = 99 WHERE assessment_id = ' || a_done, 'denied');
  PERFORM pg_temp.ai_probe('AI-03-02', 'AI write prevention', 'narrative updates a driver',
    'roots_ai_narrative', 'UPDATE public.scores SET primary_driver = ''MR'' WHERE assessment_id = ' || a_done, 'denied');
  PERFORM pg_temp.ai_probe('AI-03-03', 'AI write prevention', 'narrative inserts a score row',
    'roots_ai_narrative', 'INSERT INTO public.scores (assessment_id, biological_state, scoring_version) VALUES (' || a_done || ', 10, ''1.0.1'')', 'denied');
  PERFORM pg_temp.ai_probe('AI-03-04', 'AI write prevention', 'narrative deletes a score row',
    'roots_ai_narrative', 'DELETE FROM public.scores WHERE assessment_id = ' || a_done, 'denied');
  PERFORM pg_temp.ai_probe('AI-03-05', 'AI write prevention', 'narrative rewrites the canonical report',
    'roots_ai_narrative', 'UPDATE public.reports SET canonical_json = ''{"tampered":true}'' WHERE assessment_id = ' || a_done, 'denied');
  PERFORM pg_temp.ai_probe('AI-03-06', 'AI write prevention', 'narrative inserts a report',
    'roots_ai_narrative', 'INSERT INTO public.reports (assessment_id, status) VALUES (' || a_done || ', ''completed'')', 'denied');
  PERFORM pg_temp.ai_probe('AI-03-07', 'AI write prevention', 'narrative changes an answer',
    'roots_ai_narrative', 'UPDATE public.responses SET raw_value = ''99'' WHERE assessment_id = ' || a_done, 'denied');
  PERFORM pg_temp.ai_probe('AI-03-08', 'AI write prevention', 'narrative changes assessment status',
    'roots_ai_narrative', 'UPDATE public.assessments SET status = ''in_progress'' WHERE id = ' || a_done, 'denied');
  PERFORM pg_temp.ai_probe('AI-03-09', 'AI write prevention', 'narrative writes an audit record',
    'roots_ai_narrative', 'INSERT INTO public.audit_logs (action, result) VALUES (''ai.tamper'', ''success'')', 'denied');

  -- AI-01 — the narrative can reach nothing but pre-calculated values.
  PERFORM pg_temp.ai_probe('AI-01-01', 'AI read boundary', 'narrative reads raw answers',
    'roots_ai_narrative', 'SELECT raw_value FROM public.responses WHERE assessment_id = ' || a_done, 'denied');
  PERFORM pg_temp.ai_probe('AI-01-02', 'AI read boundary', 'narrative reads the scoring trace (per-question points)',
    'roots_ai_narrative', 'SELECT calculation_trace FROM public.scores WHERE assessment_id = ' || a_done, 'denied');
  PERFORM pg_temp.ai_probe('AI-01-03', 'AI read boundary', 'narrative reads the canonical report (answer snapshot)',
    'roots_ai_narrative', 'SELECT canonical_json FROM public.reports WHERE assessment_id = ' || a_done, 'denied');
  PERFORM pg_temp.ai_probe('AI-01-04', 'AI read boundary', 'narrative reads participant identity',
    'roots_ai_narrative', 'SELECT email FROM public.profiles WHERE id = ' || a_q, 'denied');
  PERFORM pg_temp.ai_probe('AI-01-05', 'AI read boundary', 'narrative reads the audit trail',
    'roots_ai_narrative', 'SELECT id FROM public.audit_logs', 'denied');
  PERFORM pg_temp.ai_probe('AI-01-06', 'AI read boundary', 'narrative reads assessments',
    'roots_ai_narrative', 'SELECT id FROM public.assessments WHERE id = ' || a_done, 'denied');
  PERFORM pg_temp.ai_probe('AI-01-07', 'AI read boundary', 'narrative reads consents',
    'roots_ai_narrative', 'SELECT id FROM public.consents WHERE profile_id = ' || a_q, 'denied');
  PERFORM pg_temp.ai_probe('AI-01-08', 'AI read boundary', 'narrative reads research exports',
    'roots_ai_narrative', 'SELECT id FROM public.research_exports', 'denied');
  -- Even the columns it is granted return nothing: no Row Level Security policy admits this
  -- role, so the projection is built by the server and never fetched by the narrative itself.
  PERFORM pg_temp.ai_probe('AI-01-09', 'AI read boundary', 'narrative reads granted score columns (RLS admits no rows)',
    'roots_ai_narrative', 'SELECT biological_state FROM public.scores WHERE assessment_id = ' || a_done, 'none');
END
$tests$;

-- ---- 3b. catalogue evidence: the grants themselves --------------------------------------------
INSERT INTO m3_ai_results (test_id, area, test, expected, actual, outcome)
SELECT * FROM (
  SELECT 'GR-01' AS test_id, 'Grants' AS area, 'roots_ai_narrative role exists and cannot log in' AS test,
         'true' AS expected,
         COALESCE((SELECT (NOT rolcanlogin)::TEXT FROM pg_roles WHERE rolname = 'roots_ai_narrative'), 'role missing') AS actual
  UNION ALL SELECT 'GR-02', 'Grants', 'no INSERT/UPDATE/DELETE granted anywhere', 'true',
         (NOT EXISTS (SELECT 1 FROM information_schema.role_table_grants
                       WHERE grantee = 'roots_ai_narrative' AND privilege_type <> 'SELECT'))::TEXT
  UNION ALL SELECT 'GR-03', 'Grants', 'no answer-bearing column is readable', 'true',
         (NOT EXISTS (SELECT 1 FROM information_schema.column_privileges
                       WHERE grantee = 'roots_ai_narrative'
                         AND ((table_name = 'scores' AND column_name = 'calculation_trace')
                           OR (table_name = 'reports' AND column_name = 'canonical_json'))))::TEXT
  UNION ALL SELECT 'GR-04', 'Grants', 'only public.scores is reachable at all', 'true',
         (NOT EXISTS (SELECT table_name FROM information_schema.column_privileges
                       WHERE grantee = 'roots_ai_narrative' AND table_name <> 'scores'
                      UNION
                      SELECT table_name FROM information_schema.role_table_grants
                       WHERE grantee = 'roots_ai_narrative' AND table_name <> 'scores'))::TEXT
) g, LATERAL (SELECT CASE WHEN g.actual = 'true' THEN 'PASS' ELSE 'FAIL' END AS outcome) o;

-- ---- 4. remove the test account and all its data ----------------------------------------------
DELETE FROM auth.users WHERE id = '0000000f-0000-4000-8000-00000000000a';

INSERT INTO m3_ai_results (test_id, area, test, expected, actual, outcome)
SELECT 'CLEANUP', 'Housekeeping', 'test account and its data removed', '0 rows left',
       (SELECT count(*) FROM public.assessments WHERE profile_id::TEXT LIKE '0000000f-%')::TEXT || ' rows left',
       CASE WHEN NOT EXISTS (SELECT 1 FROM public.assessments WHERE profile_id::TEXT LIKE '0000000f-%') THEN 'PASS' ELSE 'FAIL' END;

-- ---- 5. RESULT — every row must read PASS ------------------------------------------------------
SELECT test_id, area, test, expected, actual, outcome,
       (SELECT count(*) FILTER (WHERE outcome = 'PASS') || ' / ' || count(*) FROM m3_ai_results) AS summary
FROM m3_ai_results
ORDER BY seq;
