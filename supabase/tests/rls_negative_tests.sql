-- ============================================================================
-- ROOTS-AI · M1 · RLS negative tests (access isolation evidence)
--
-- Proves that a signed-in participant cannot reach another participant's data, that an
-- unauthenticated caller can reach nothing, and that the audit log is closed to participants.
-- Each test impersonates a role the same way PostgREST does — SET LOCAL ROLE plus the JWT
-- claims — so what is under test is the database, not the application code.
--
-- HOW TO RUN
--   1. Sign in to the app twice with two different email addresses, so two participants exist.
--      Participant A must have started an assessment and saved at least one answer.
--   2. Find their ids:  select id, email from auth.users order by created_at desc limit 5;
--   3. Replace every AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA with participant A's id and every
--      BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB with participant B's id (find and replace).
--   4. Run the whole file in the Supabase SQL Editor and save the final result table. That
--      table is the evidence for M1 item 7.
--
-- Nothing is left behind. Read tests only read; each write test runs inside a PL/pgSQL
-- subtransaction that is always rolled back, whether the write was refused or (a failure)
-- allowed. A write that succeeds is reported as FAIL and still undone.
-- ============================================================================

DROP TABLE IF EXISTS rls_test_results;
CREATE TEMP TABLE rls_test_results (
  seq SERIAL PRIMARY KEY,
  test TEXT,
  expected TEXT,
  actual TEXT,
  outcome TEXT
);

-- ---------------------------------------------------------------------------
-- 1. Anonymous (not signed in) can read nothing
-- ---------------------------------------------------------------------------
DO $$
DECLARE assessments_visible INTEGER; responses_visible INTEGER;
BEGIN
  EXECUTE 'set local role anon';
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);

  BEGIN
    SELECT count(*) INTO assessments_visible FROM public.assessments;
  EXCEPTION WHEN OTHERS THEN assessments_visible := -1;  -- privilege revoked outright
  END;

  BEGIN
    SELECT count(*) INTO responses_visible FROM public.responses;
  EXCEPTION WHEN OTHERS THEN responses_visible := -1;
  END;

  EXECUTE 'reset role';
  INSERT INTO rls_test_results (test, expected, actual, outcome) VALUES
    ('anon reads assessments', '0 rows (or denied)', assessments_visible::TEXT,
     CASE WHEN assessments_visible <= 0 THEN 'PASS' ELSE 'FAIL' END),
    ('anon reads responses', '0 rows (or denied)', responses_visible::TEXT,
     CASE WHEN responses_visible <= 0 THEN 'PASS' ELSE 'FAIL' END);
END
$$;

-- ---------------------------------------------------------------------------
-- 2. Participant A sees their own rows, and only their own
-- ---------------------------------------------------------------------------
DO $$
DECLARE own INTEGER; others INTEGER;
BEGIN
  EXECUTE 'set local role authenticated';
  PERFORM set_config('request.jwt.claims', '{"role":"authenticated","sub":"AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA"}', true);

  SELECT count(*) INTO own FROM public.assessments
    WHERE profile_id = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA';
  SELECT count(*) INTO others FROM public.assessments
    WHERE profile_id <> 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA';

  EXECUTE 'reset role';
  INSERT INTO rls_test_results (test, expected, actual, outcome) VALUES
    ('A reads own assessments', 'at least 1', own::TEXT,
     CASE WHEN own >= 1 THEN 'PASS' ELSE 'FAIL - set participant A up first' END),
    ('A reads other participants assessments', '0 rows', others::TEXT,
     CASE WHEN others = 0 THEN 'PASS' ELSE 'FAIL' END);
END
$$;

-- ---------------------------------------------------------------------------
-- 3. Participant B cannot see A's assessment, answers or consents
-- ---------------------------------------------------------------------------
DO $$
DECLARE a_rows INTEGER; a_answers INTEGER; a_consents INTEGER;
BEGIN
  EXECUTE 'set local role authenticated';
  PERFORM set_config('request.jwt.claims', '{"role":"authenticated","sub":"BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB"}', true);

  SELECT count(*) INTO a_rows FROM public.assessments
    WHERE profile_id = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA';
  SELECT count(*) INTO a_answers FROM public.responses r
    WHERE r.assessment_id IN (
      SELECT id FROM public.assessments WHERE profile_id = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA'
    );
  SELECT count(*) INTO a_consents FROM public.consents
    WHERE profile_id = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA';

  EXECUTE 'reset role';
  INSERT INTO rls_test_results (test, expected, actual, outcome) VALUES
    ('B reads A assessment', '0 rows', a_rows::TEXT, CASE WHEN a_rows = 0 THEN 'PASS' ELSE 'FAIL' END),
    ('B reads A answers', '0 rows', a_answers::TEXT, CASE WHEN a_answers = 0 THEN 'PASS' ELSE 'FAIL' END),
    ('B reads A consents', '0 rows', a_consents::TEXT, CASE WHEN a_consents = 0 THEN 'PASS' ELSE 'FAIL' END);
END
$$;

-- ---------------------------------------------------------------------------
-- 4. Participant B cannot write to A's data
--    (each attempt is rolled back by raising 'probe_rollback' after a successful write)
-- ---------------------------------------------------------------------------
DO $$
DECLARE changed INTEGER := 0; note TEXT;
BEGIN
  EXECUTE 'set local role authenticated';
  PERFORM set_config('request.jwt.claims', '{"role":"authenticated","sub":"BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB"}', true);

  BEGIN
    UPDATE public.assessments SET current_module = 13
      WHERE profile_id = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA';
    GET DIAGNOSTICS changed = ROW_COUNT;
    IF changed > 0 THEN RAISE EXCEPTION 'probe_rollback'; END IF;
    note := '0 rows changed';
  EXCEPTION
    WHEN raise_exception THEN note := changed::TEXT || ' rows changed (rolled back)';
    WHEN OTHERS THEN changed := 0; note := 'denied: ' || SQLERRM;
  END;

  EXECUTE 'reset role';
  INSERT INTO rls_test_results (test, expected, actual, outcome)
  VALUES ('B updates A assessment', '0 rows changed', note,
          CASE WHEN changed = 0 THEN 'PASS' ELSE 'FAIL' END);
END
$$;

DO $$
DECLARE target UUID; changed INTEGER := 0; note TEXT;
BEGIN
  SELECT id INTO target FROM public.assessments
    WHERE profile_id = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA'
    ORDER BY started_at DESC LIMIT 1;

  EXECUTE 'set local role authenticated';
  PERFORM set_config('request.jwt.claims', '{"role":"authenticated","sub":"BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB"}', true);

  BEGIN
    INSERT INTO public.responses (assessment_id, question_id, raw_value, validation_state, source_version)
    VALUES (target, 'RLS-PROBE', '1'::JSONB, 'valid', '1.0.0');
    GET DIAGNOSTICS changed = ROW_COUNT;
    IF changed > 0 THEN RAISE EXCEPTION 'probe_rollback'; END IF;
    note := 'no row inserted';
  EXCEPTION
    WHEN raise_exception THEN note := changed::TEXT || ' rows inserted (rolled back)';
    WHEN OTHERS THEN changed := 0; note := 'denied: ' || SQLERRM;
  END;

  EXECUTE 'reset role';
  INSERT INTO rls_test_results (test, expected, actual, outcome)
  VALUES ('B writes an answer into A assessment', 'denied', note,
          CASE WHEN changed = 0 THEN 'PASS' ELSE 'FAIL' END);
END
$$;

DO $$
DECLARE changed INTEGER := 0; note TEXT;
BEGIN
  EXECUTE 'set local role authenticated';
  PERFORM set_config('request.jwt.claims', '{"role":"authenticated","sub":"BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB"}', true);

  BEGIN
    INSERT INTO public.assessments (profile_id, questionnaire_version)
    VALUES ('AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA', '1.0.0');
    GET DIAGNOSTICS changed = ROW_COUNT;
    IF changed > 0 THEN RAISE EXCEPTION 'probe_rollback'; END IF;
    note := 'no row inserted';
  EXCEPTION
    WHEN raise_exception THEN note := changed::TEXT || ' rows inserted (rolled back)';
    WHEN OTHERS THEN changed := 0; note := 'denied: ' || SQLERRM;
  END;

  EXECUTE 'reset role';
  INSERT INTO rls_test_results (test, expected, actual, outcome)
  VALUES ('B creates an assessment owned by A', 'denied', note,
          CASE WHEN changed = 0 THEN 'PASS' ELSE 'FAIL' END);
END
$$;

-- ---------------------------------------------------------------------------
-- 5. A participant cannot submit their own assessment directly: that transition
--    belongs to the server (service role), not to the browser session
-- ---------------------------------------------------------------------------
DO $$
DECLARE changed INTEGER := 0; note TEXT;
BEGIN
  EXECUTE 'set local role authenticated';
  PERFORM set_config('request.jwt.claims', '{"role":"authenticated","sub":"AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA"}', true);

  BEGIN
    UPDATE public.assessments SET status = 'submitted'
      WHERE profile_id = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA' AND status = 'in_progress';
    GET DIAGNOSTICS changed = ROW_COUNT;
    IF changed > 0 THEN RAISE EXCEPTION 'probe_rollback'; END IF;
    note := '0 rows changed';
  EXCEPTION
    WHEN raise_exception THEN note := changed::TEXT || ' rows changed (rolled back)';
    WHEN OTHERS THEN changed := 0; note := 'denied: ' || SQLERRM;
  END;

  EXECUTE 'reset role';
  INSERT INTO rls_test_results (test, expected, actual, outcome)
  VALUES ('A submits own assessment directly', 'denied', note,
          CASE WHEN changed = 0 THEN 'PASS' ELSE 'FAIL' END);
END
$$;

-- ---------------------------------------------------------------------------
-- 6. The audit log is closed to participants
-- ---------------------------------------------------------------------------
DO $$
DECLARE visible INTEGER; changed INTEGER := 0; note TEXT;
BEGIN
  EXECUTE 'set local role authenticated';
  PERFORM set_config('request.jwt.claims', '{"role":"authenticated","sub":"AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA"}', true);

  BEGIN
    SELECT count(*) INTO visible FROM public.audit_logs;
  EXCEPTION WHEN OTHERS THEN visible := -1;
  END;

  BEGIN
    INSERT INTO public.audit_logs (action, result) VALUES ('test.rls_probe', 'success');
    GET DIAGNOSTICS changed = ROW_COUNT;
    IF changed > 0 THEN RAISE EXCEPTION 'probe_rollback'; END IF;
    note := 'no row inserted';
  EXCEPTION
    WHEN raise_exception THEN note := changed::TEXT || ' rows inserted (rolled back)';
    WHEN OTHERS THEN changed := 0; note := 'denied: ' || SQLERRM;
  END;

  EXECUTE 'reset role';
  INSERT INTO rls_test_results (test, expected, actual, outcome) VALUES
    ('participant reads audit_logs', '0 rows (or denied)', visible::TEXT,
     CASE WHEN visible <= 0 THEN 'PASS' ELSE 'FAIL' END),
    ('participant writes audit_logs', 'denied', note,
     CASE WHEN changed = 0 THEN 'PASS' ELSE 'FAIL' END);
END
$$;

-- ---------------------------------------------------------------------------
-- 7. Every M1 table has RLS enabled, and each has the expected policy count
-- ---------------------------------------------------------------------------
INSERT INTO rls_test_results (test, expected, actual, outcome)
SELECT 'RLS enabled on ' || c.relname, 'true', c.relrowsecurity::TEXT,
       CASE WHEN c.relrowsecurity THEN 'PASS' ELSE 'FAIL' END
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('profiles', 'role_assignments', 'assessments', 'responses', 'consents',
                    'scores', 'reports', 'scoring_config', 'audit_logs')
ORDER BY c.relname;

WITH expected(table_name, policies) AS (
  VALUES ('profiles', 3), ('role_assignments', 2), ('assessments', 4), ('responses', 4),
         ('consents', 3), ('scores', 2), ('reports', 2), ('scoring_config', 1), ('audit_logs', 1)
)
INSERT INTO rls_test_results (test, expected, actual, outcome)
SELECT 'policies on ' || e.table_name,
       e.policies::TEXT,
       coalesce(count(p.polname), 0)::TEXT,
       CASE WHEN coalesce(count(p.polname), 0) = e.policies THEN 'PASS' ELSE 'FAIL' END
FROM expected e
LEFT JOIN pg_class t ON t.relname = e.table_name AND t.relnamespace = 'public'::regnamespace
LEFT JOIN pg_policy p ON p.polrelid = t.oid
GROUP BY e.table_name, e.policies
ORDER BY e.table_name;

-- ---------------------------------------------------------------------------
-- Evidence table — save this output
-- ---------------------------------------------------------------------------
SELECT seq, test, expected, actual, outcome FROM rls_test_results ORDER BY seq;
