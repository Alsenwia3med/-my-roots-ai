-- ============================================================================
-- ROOTS-AI · 2026-09-21 (b) · store the canonical C-03 report
--
-- Run once in: Supabase dashboard > SQL Editor > Run.
-- Needed on any project installed from roots_ai_setup.sql before this date; a fresh install
-- from the current roots_ai_setup.sql already includes it. Harmless to run twice.
--
-- Additive only: no table, column or row is dropped. One transaction.
--
-- Why: C-03 §9 requires the web report and the PDF to render "from the same stored JSON hash".
-- public.reports had the hash column but nowhere to keep the JSON itself, and no
-- participant-facing report reference. Once written, the canonical JSON is the record of that
-- report and must not change.
-- ============================================================================

BEGIN;

ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS report_reference TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS canonical_json   JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS reports_report_reference_key
  ON public.reports (report_reference) WHERE report_reference IS NOT NULL;

-- The canonical content of a report is written once. Status and view time may still change
-- (e.g. a failed report retried, first_viewed_at stamped), but never what the report says.
CREATE OR REPLACE FUNCTION public.reports_guard_canonical()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $fn$
BEGIN
  IF OLD.canonical_json IS NOT NULL AND (
       NEW.canonical_json IS DISTINCT FROM OLD.canonical_json
    OR NEW.canonical_json_checksum IS DISTINCT FROM OLD.canonical_json_checksum
    OR NEW.report_reference IS DISTINCT FROM OLD.report_reference
    OR NEW.report_version IS DISTINCT FROM OLD.report_version
    OR NEW.assessment_id IS DISTINCT FROM OLD.assessment_id
  ) THEN
    RAISE EXCEPTION 'a generated report is a final record and its content cannot be changed (report %)', OLD.id
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS reports_guard_canonical ON public.reports;
CREATE TRIGGER reports_guard_canonical
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.reports_guard_canonical();

COMMIT;

-- Check: expect report_reference and canonical_json.
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'reports'
  AND column_name IN ('report_reference', 'canonical_json')
ORDER BY column_name;
