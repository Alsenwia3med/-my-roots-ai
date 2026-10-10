-- ============================================================================
-- ROOTS-AI™ — admin operations, research export and data-subject requests
--
-- Run once, after 20260921d_profile_update_columns.sql. Safe to re-run.
--
--   1. role_assignments.expires_at — time-limited staff access (ADM-10 "Implementation
--      access: expiry mandatory"). An expired grant stops counting in is_staff() and in the
--      application guard at the same moment.
--   -  (no grant change) ADM-05 reads only the failure code, on the server, after the staff
--      check; reports.generation_metadata stays unreadable through the API.
--   2. research_exports — ADM-09 history and the encrypted, expiring export files.
--   3. data_requests — participant data-deletion requests (GDPR Art. 17) and their outcome.
--
-- Tables 2 and 3 have Row Level Security on and no policies or grants for signed-in users:
-- they are read and written only by the server (service role), after the role check.
-- ============================================================================

-- ---- 1. time-limited staff access -----------------------------------------------
ALTER TABLE public.role_assignments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.role_assignments ra
    WHERE ra.profile_id = auth.uid()
      AND ra.revoked_at IS NULL
      AND (ra.expires_at IS NULL OR ra.expires_at > now())
      AND ra.role IN ('admin', 'research_admin', 'super_admin')
  );
$fn$;

REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated, service_role;

-- ---- reports.generation_metadata stays server-only ----------------------------------
-- An earlier draft of this file granted it; this undoes that grant (no effect otherwise).
REVOKE SELECT (generation_metadata) ON public.reports FROM authenticated;

-- ---- 2. research exports ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.research_exports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by      UUID NOT NULL REFERENCES public.profiles(id),
  purpose_reference TEXT NOT NULL,          -- approved project / purpose reference
  criteria          JSONB NOT NULL,         -- cohort, date range, consent criterion
  fields            TEXT[] NOT NULL,        -- allow-listed pseudonymised fields
  row_count         INTEGER NOT NULL,
  checksum          TEXT NOT NULL,          -- SHA-256 of the CSV as generated
  payload           TEXT,                   -- AES-256-GCM encrypted CSV; cleared at expiry
  expires_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS research_exports_created_idx ON public.research_exports (created_at DESC);
ALTER TABLE public.research_exports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.research_exports FROM anon, authenticated;

-- ---- 3. data-subject requests ------------------------------------------------------
-- profile_id deliberately has no foreign key: the request outlives the erased account as
-- evidence that the erasure was carried out. It holds no email or name.
CREATE TABLE IF NOT EXISTS public.data_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   UUID NOT NULL,
  kind         TEXT NOT NULL DEFAULT 'deletion' CHECK (kind IN ('deletion')),
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'completed', 'rejected', 'cancelled')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at  TIMESTAMPTZ,
  resolved_by  UUID,
  resolution_note TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS data_requests_one_pending
  ON public.data_requests (profile_id) WHERE status = 'pending';
ALTER TABLE public.data_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.data_requests FROM anon, authenticated;

-- ---- verification -----------------------------------------------------------------
SELECT 'role_assignments.expires_at' AS item,
       EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'role_assignments' AND column_name = 'expires_at') AS ok
UNION ALL
SELECT 'research_exports', to_regclass('public.research_exports') IS NOT NULL
UNION ALL
SELECT 'data_requests', to_regclass('public.data_requests') IS NOT NULL
UNION ALL
SELECT 'reports.generation_metadata stays private',
       NOT has_column_privilege('authenticated', 'public.reports', 'generation_metadata', 'SELECT');
