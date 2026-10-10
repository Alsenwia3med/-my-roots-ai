-- ============================================================================
-- ROOTS-AI · 2026-09-21 (c) · keep answer-derived columns off the browser
--
-- Run once in: Supabase dashboard > SQL Editor > Run (after 20260921b_reports_c03.sql).
-- A fresh install from the current roots_ai_setup.sql already includes it. Harmless to re-run.
--
-- Why: public.responses deliberately has no staff read policy — raw answers are not visible to
-- administrators without an approved purpose (ADM-04). But two other columns carry answers too:
--   reports.canonical_json     section 16 is the participant's answer snapshot
--   scores.calculation_trace   the option ID and points behind every scored question
-- and staff can read reports and scores rows for the admin screens. Column privileges close
-- that path for every signed-in user, staff and participant alike: through the API they can read
-- report status and score values, never the answer-bearing columns. The application reads those
-- only on the server, after proving the reader owns the report.
-- ============================================================================

BEGIN;

REVOKE SELECT ON public.reports FROM authenticated;
GRANT SELECT (id, assessment_id, report_version, status, report_reference, storage_reference,
              canonical_json_checksum, generated_at, first_viewed_at, created_at, updated_at)
  ON public.reports TO authenticated;

REVOKE SELECT ON public.scores FROM authenticated;
GRANT SELECT (id, assessment_id, mr_score, hs_score, sr_score, ch_score, sl_score, ib_score, bs_score,
              biological_state, opportunity_score, recovery_potential, confidence, confidence_label,
              protective_count, primary_driver, secondary_driver, tertiary_driver, drivers_json,
              evidence_strength, coverage_json, classifications_json, evidence_json, limitations,
              dataset_id, scoring_version, created_at, updated_at)
  ON public.scores TO authenticated;

COMMIT;

-- Check: canonical_json and calculation_trace must NOT appear for authenticated.
SELECT table_name, column_name
FROM information_schema.column_privileges
WHERE table_schema = 'public' AND grantee = 'authenticated' AND privilege_type = 'SELECT'
  AND table_name IN ('reports', 'scores')
  AND column_name IN ('canonical_json', 'generation_metadata', 'calculation_trace');
