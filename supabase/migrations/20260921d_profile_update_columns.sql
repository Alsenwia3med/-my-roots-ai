-- ============================================================================
-- ROOTS-AI · 2026-09-21 (d) · participants may edit only their name on their profile
--
-- Run once in: Supabase dashboard > SQL Editor > Run.
-- A fresh install from the current roots_ai_setup.sql already includes it. Harmless to re-run.
--
-- Why: participants set the name printed on their report cover (profiles.display_name). Row
-- Level Security already limits them to their own row, but the table-wide UPDATE grant also let
-- them change other columns of it — including the email copy the admin "Resend link" action
-- reads, and the account status. Column privileges narrow it to display_name and locale.
-- ============================================================================

BEGIN;

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, locale) ON public.profiles TO authenticated;

COMMIT;

-- Check: expect exactly display_name and locale.
SELECT column_name
FROM information_schema.column_privileges
WHERE table_schema = 'public' AND table_name = 'profiles'
  AND grantee = 'authenticated' AND privilege_type = 'UPDATE'
ORDER BY column_name;
