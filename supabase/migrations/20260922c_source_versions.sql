-- ============================================================================
-- ROOTS-AI · 2026-09-22 (c) · record the controlled source versions (M2 item 7)
--
-- Included in supabase/roots_ai_complete.sql — running that file is enough. Kept here as the
-- record of the change. Safe to re-run.
--
-- Every assessment records the controlled question bank it is answered against, and every
-- score row the question bank and scoring rules it was calculated from:
--   { "c01": { "label": "C-01 v1.0.1 CORRECTED", "questionnaire_version": "1.0.0", "sha256": … },
--     "c02": { "label": "C-02 v1.0.1 CORRECTED", "scoring_version": "1.0.1",       "sha256": … } }
-- The value is written by the server only and cannot be changed once recorded.
-- ============================================================================

BEGIN;

ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS source_versions JSONB;
ALTER TABLE public.scores      ADD COLUMN IF NOT EXISTS source_versions JSONB;
ALTER TABLE public.scores      ALTER COLUMN scoring_version SET DEFAULT '1.0.1';

GRANT SELECT (source_versions) ON public.scores TO authenticated;

CREATE OR REPLACE FUNCTION public.assessments_source_server_only()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $fn$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    NEW.source_versions := NULL;
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS assessments_source_server_only ON public.assessments;
CREATE TRIGGER assessments_source_server_only
  BEFORE INSERT ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.assessments_source_server_only();

COMMIT;

-- The UPDATE rule (set once, by the server) is part of assessments_guard_immutable in
-- roots_ai_complete.sql.
