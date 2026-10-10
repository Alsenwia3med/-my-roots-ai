-- ============================================================================
-- ROOTS-AI™ — keep reports.generation_metadata private
--
-- Only needed if the FIRST version of 20260922_admin_ops.sql was run: it granted signed-in
-- users read access to reports.generation_metadata. The final design keeps that column
-- server-only (ADM-05 reads just the failure code, with the service role). Safe to re-run.
-- ============================================================================

REVOKE SELECT (generation_metadata) ON public.reports FROM authenticated;

-- Verification: every row must return true.
SELECT 'reports.generation_metadata stays private' AS item,
       NOT has_column_privilege('authenticated', 'public.reports', 'generation_metadata', 'SELECT') AS ok
UNION ALL
-- Signed-in users must have column grants only on reports, never a table-wide SELECT.
SELECT 'no table-wide SELECT on reports',
       NOT has_table_privilege('authenticated', 'public.reports', 'SELECT')
UNION ALL
SELECT 'reports.canonical_json stays private',
       NOT has_column_privilege('authenticated', 'public.reports', 'canonical_json', 'SELECT');
