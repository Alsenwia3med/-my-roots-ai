-- ============================================================================
-- ROOTS-AI · create the FIRST Super Admin (run once per environment)
--
-- Only a Super Admin can grant roles in the application (ADM-10), so the very first one has
-- to be granted here. After that, manage everyone from /admin/access — do not use this again.
--
-- STEPS
--   1. Sign in at /admin with "Continue with Google", using the account that should become
--      Super Admin. You will see "This account does not have administrator access" — that is
--      expected: it creates the account.
--   2. Replace the email below with that Google account's email.
--   3. Paste this whole file into Supabase dashboard > SQL Editor > Run.
--   4. Go back to /admin and sign in again: you will be asked to set up an authenticator app
--      (MFA is required for every admin), and then land on the admin console.
-- ============================================================================

BEGIN;

INSERT INTO public.role_assignments (profile_id, role, note)
SELECT u.id, 'super_admin', 'Bootstrap: first Super Admin, granted directly in the database'
FROM auth.users u
WHERE lower(u.email) = lower('REPLACE_WITH_YOUR_EMAIL@example.com')
ON CONFLICT (profile_id, role) WHERE revoked_at IS NULL DO NOTHING;

-- Record the bootstrap in the audit trail, like every other privileged change.
INSERT INTO public.audit_logs (action, result, actor_type, object_type, object_id, details)
SELECT 'admin.role.granted', 'success', 'system', 'profile', u.id::text,
       jsonb_build_object('role', 'super_admin', 'reason', 'bootstrap first Super Admin')
FROM auth.users u
WHERE lower(u.email) = lower('REPLACE_WITH_YOUR_EMAIL@example.com');

COMMIT;

-- Check: one row, role super_admin, not revoked. No row means the email did not match an
-- account — sign in at /admin once first (step 1), then run this again.
SELECT u.email, ra.role, ra.granted_at, ra.revoked_at
FROM public.role_assignments ra
JOIN auth.users u ON u.id = ra.profile_id
WHERE ra.role = 'super_admin';
