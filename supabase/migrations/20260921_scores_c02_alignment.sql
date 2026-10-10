-- ============================================================================
-- ROOTS-AI · 2026-09-21 · align public.scores with C-02 v1.0.0
--
-- Run once in: Supabase dashboard > SQL Editor > Run.
-- Needed on any project installed from roots_ai_setup.sql before 2026-09-21. A fresh install
-- from the current roots_ai_setup.sql already includes these changes; running this on it is
-- harmless.
--
-- Additive only: no table, column or row is dropped. One transaction.
--
-- Why:
--   1. confidence_label only allowed 'low'/'moderate'/'high', but C-02 p.14 labels confidence
--      High / Moderate-High / Moderate / Low. Every result with confidence 60-79 is
--      "Moderate-High" and would have been rejected on insert.
--   2. C-02 produces per-domain coverage, classifications and evidence, a protective-factor
--      count and limitation flags, which had no columns.
--   3. A score row is the record of a submitted assessment and must not be rewritten, in the
--      same way the assessment itself is immutable once submitted.
-- ============================================================================

BEGIN;

-- 1. C-02 confidence labels
ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_confidence_label_check;
ALTER TABLE public.scores ADD CONSTRAINT scores_confidence_label_check
  CHECK (confidence_label IN ('High', 'Moderate-High', 'Moderate', 'Low'));

-- 2. C-02 outputs with no column before
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS dataset_id           TEXT;
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS protective_count     SMALLINT;
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS coverage_json        JSONB;
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS classifications_json JSONB;
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS evidence_json        JSONB;
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS limitations          TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.scores.evidence_strength IS
  'Unused. C-02 evidence is per domain (Strong/Moderate/Limited/Weak) and is stored in evidence_json.';

-- 3. A score row is written once and never changed
CREATE OR REPLACE FUNCTION public.scores_guard_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $fn$
BEGIN
  RAISE EXCEPTION 'scores are the record of a submitted assessment and cannot be changed (assessment %)', OLD.assessment_id
    USING ERRCODE = 'restrict_violation';
END;
$fn$;

DROP TRIGGER IF EXISTS scores_guard_immutable ON public.scores;
CREATE TRIGGER scores_guard_immutable
  BEFORE UPDATE ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.scores_guard_immutable();

COMMIT;

-- Check: expect the new columns and the trigger.
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'scores'
  AND column_name IN ('dataset_id', 'protective_count', 'coverage_json', 'classifications_json', 'evidence_json', 'limitations')
ORDER BY column_name;
