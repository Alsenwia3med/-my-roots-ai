"""
Builds supabase/roots_ai_complete.sql — ONE file that brings any ROOTS-AI Supabase project to
the current schema, whether it is empty or already running with data.

    python scripts/db/build_complete_sql.py

Source of truth: supabase/roots_ai_setup.sql (the clean-install script). This turns it into an
upgrade-safe script:

  - section 0 (DROP TABLE ...) is removed: no table or row is ever dropped
  - CREATE TABLE / CREATE INDEX become IF NOT EXISTS
  - the columns added since the first M1 install are added with ADD COLUMN IF NOT EXISTS, so
    a project installed from an older version gains them (scores C-02 columns, reports
    report_reference / canonical_json, role_assignments.expires_at)
  - policies and triggers are dropped-if-present and recreated, so they match exactly
  - privileges are reset for anon/authenticated and granted again (column-level where needed)

Then it appends the first-Super-Admin bootstrap, an opt-in test-data reset, and checks.
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SETUP = ROOT / "supabase" / "roots_ai_setup.sql"
OUT = ROOT / "supabase" / "roots_ai_complete.sql"

TABLES = ["profiles", "role_assignments", "assessments", "responses", "consents", "scores",
          "reports", "scoring_config", "audit_logs", "research_exports", "data_requests"]


def body(setup: str) -> str:
    start = setup.index("-- ============================================================================\n-- 1. PREREQUISITES")
    end = setup.index("\nCOMMIT;\n")
    return setup[start:end]


# Columns added after the first M1 install. A project installed from an older script has the
# tables but not these columns; a new install already has them (IF NOT EXISTS makes this a no-op).
# Listed explicitly rather than derived: re-adding columns that carry UNIQUE / REFERENCES
# clauses on a live database is not something to automate.
COLUMN_UPGRADES = """ALTER TABLE public.role_assignments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS dataset_id           TEXT;
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS protective_count     SMALLINT;
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS coverage_json        JSONB;
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS classifications_json JSONB;
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS evidence_json        JSONB;
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS limitations          TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS source_versions JSONB;
ALTER TABLE public.scores      ADD COLUMN IF NOT EXISTS source_versions JSONB;
ALTER TABLE public.scores      ALTER COLUMN scoring_version SET DEFAULT '1.0.1';

ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS report_reference TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS canonical_json   JSONB;
"""


# Every foreign key in the schema. If one table is dropped on its own (DROP ... CASCADE), Postgres
# also removes the foreign keys other tables had to it; re-creating the dropped table does not
# bring those back, because the other tables already exist. This puts back any that are missing.
# NOT VALID: enforced for every new or changed row, without failing on rows left over from before.
FOREIGN_KEYS = [
    ("profiles", "id", "auth.users(id)", "ON DELETE CASCADE"),
    ("role_assignments", "profile_id", "public.profiles(id)", "ON DELETE CASCADE"),
    ("role_assignments", "granted_by", "public.profiles(id)", ""),
    ("assessments", "profile_id", "auth.users(id)", "ON DELETE CASCADE"),
    ("responses", "assessment_id", "public.assessments(id)", "ON DELETE CASCADE"),
    ("consents", "profile_id", "auth.users(id)", "ON DELETE CASCADE"),
    ("scores", "assessment_id", "public.assessments(id)", "ON DELETE CASCADE"),
    ("reports", "assessment_id", "public.assessments(id)", "ON DELETE CASCADE"),
    ("scoring_config", "published_by", "public.profiles(id)", ""),
    ("research_exports", "requested_by", "public.profiles(id)", ""),
]


def fk_repair() -> str:
    rows = (",\n" + " " * 4).join(f"('{t}', '{c}', '{ref}', '{rule}')" for t, c, ref, rule in FOREIGN_KEYS)
    return f"""-- ============================================================================
-- 8c. REPAIR — put back any foreign key lost when a single table was dropped
-- (no effect when every foreign key is already present)
-- ============================================================================
DO $fk$
DECLARE
  fk RECORD;
BEGIN
  FOR fk IN SELECT * FROM (VALUES
    {rows}
  ) AS v(tbl, col, ref, on_delete)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
      WHERE c.contype = 'f' AND c.conrelid = ('public.' || fk.tbl)::regclass AND a.attname = fk.col
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %s %s NOT VALID',
                     fk.tbl, fk.tbl || '_' || fk.col || '_fkey', fk.col, fk.ref, fk.on_delete);
      RAISE NOTICE 'repaired foreign key %.%', fk.tbl, fk.col;
    END IF;
  END LOOP;
END
$fk$;
"""


def transform(sql: str) -> str:
    sql = sql.replace("CREATE TABLE public.", "CREATE TABLE IF NOT EXISTS public.")
    sql = re.sub(r"CREATE (UNIQUE )?INDEX (?!IF NOT EXISTS)(\w+)", r"CREATE \1INDEX IF NOT EXISTS \2", sql)
    sql = re.sub(r"CREATE POLICY (\w+) ON (public\.\w+)", r"DROP POLICY IF EXISTS \1 ON \2;\nCREATE POLICY \1 ON \2", sql)

    def trig(m):
        name, rest = m.group(1), m.group(2)
        table = re.search(r"\bON (\S+)", rest).group(1)
        return f"DROP TRIGGER IF EXISTS {name} ON {table};\nCREATE TRIGGER {name}{rest}"
    sql = re.sub(r"(?<!DROP TRIGGER IF EXISTS on_auth_user_created ON auth\.users;\n)CREATE TRIGGER (\w+)(\s+(?:BEFORE|AFTER)[^;]*?\bON \S+)", trig, sql)
    # on_auth_user_created already has its own DROP in the source; avoid doubling it.
    sql = sql.replace("DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;\nDROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;",
                      "DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;")

    # Column upgrades go right after the last table is created (before indexes).
    marker = "-- ============================================================================\n-- 6. INDEXES"
    upgrades = (
        "-- ============================================================================\n"
        "-- 5b. UPGRADE — columns added since earlier versions (no effect on a new install)\n"
        "-- ============================================================================\n"
        + COLUMN_UPGRADES
        + "\n\n-- C-02 confidence labels (an earlier version allowed only low/moderate/high).\n"
        "ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_confidence_label_check;\n"
        "ALTER TABLE public.scores ADD CONSTRAINT scores_confidence_label_check\n"
        "  CHECK (confidence_label IN ('High', 'Moderate-High', 'Moderate', 'Low'));\n\n"
    )
    sql = sql.replace(marker, upgrades + marker)

    # Privileges: start from nothing for the API roles, then grant exactly what the app needs.
    reset = ("-- Reset API-role privileges first, so grants from any earlier version (e.g. table-wide\n"
             "-- SELECT on reports/scores, table-wide UPDATE on profiles) cannot survive.\n"
             "REVOKE ALL ON " + ", ".join(f"public.{t}" for t in TABLES[:9]) + "\n  FROM anon, authenticated;\n")
    sql = sql.replace("REVOKE ALL ON public.profiles, public.role_assignments,", reset + "REVOKE ALL ON public.profiles, public.role_assignments,", 1)
    return sql


HEADER = """-- ============================================================================
-- ROOTS-AI™ · COMPLETE DATABASE SCRIPT (single file, safe on a live project)
--
-- GENERATED by scripts/db/build_complete_sql.py from supabase/roots_ai_setup.sql.
-- Do not edit by hand: change roots_ai_setup.sql and regenerate.
--
-- Paste the whole file into: Supabase dashboard > SQL Editor > Run.
--
-- WHAT IT DOES
--   Brings the database to the current ROOTS-AI schema, whether the project is empty or has
--   been running an earlier version. It never drops a table or deletes a row (unless you
--   switch on PART 3 yourself). It is safe to run more than once.
--
--   PART 1  Schema: 11 tables, Row Level Security, policies, privileges, integrity triggers.
--           Includes every change made so far:
--             · C-02 score columns and immutable score rows
--             · C-03 canonical report storage and report immutability
--             · answer-bearing columns hidden from the browser (reports.canonical_json,
--               reports.generation_metadata, scores.calculation_trace)
--             · participants may edit only display_name / locale on their profile
--             · time-limited staff access (role_assignments.expires_at)
--             · research_exports and data_requests (server-only tables)
--             · controlled source versions on every assessment and score (M2 item 7)
--   PART 2  First Super Admin (edit the email in PART 2 before running).
--   PART 3  OPTIONAL — delete all assessments/answers/scores/reports (test data). OFF by default.
--   PART 4  Checks — every row must say OK / true.
--
-- RECOVERY: if some or all ROOTS-AI tables were deleted by mistake, run this file. It re-creates
-- whatever is missing (tables, columns, indexes, policies, triggers, privileges, foreign keys)
-- and leaves what still exists untouched. Rows that were in deleted tables cannot be recovered
-- by any script. Login accounts (auth.users) are never affected.
--
-- ALSO SET IN THE DASHBOARD (not settable from SQL)
--   Authentication > Email > Email OTP Expiration = 900 seconds
--   Authentication > URL Configuration > Site URL = the deployment's APP_URL
-- ============================================================================

-- ############################################################################
-- PART 1 — SCHEMA
-- ############################################################################
BEGIN;

"""

BOOTSTRAP = """
COMMIT;

-- ############################################################################
-- PART 2 — FIRST SUPER ADMIN
--
-- The account must have signed in once at /admin (Continue with Google) so it exists.
-- Replace the email if a different account should be the first Super Admin. Nothing happens
-- if the account does not exist yet, or already holds the role.
-- ############################################################################
BEGIN;

WITH granted AS (
  INSERT INTO public.role_assignments (profile_id, role, note)
  SELECT u.id, 'super_admin', 'Bootstrap: first Super Admin, granted directly in the database'
  FROM auth.users u
  WHERE lower(u.email) = lower('manageratbaseline@gmail.com')
  ON CONFLICT (profile_id, role) WHERE revoked_at IS NULL DO NOTHING
  RETURNING profile_id
)
INSERT INTO public.audit_logs (action, result, actor_type, object_type, object_id, details)
SELECT 'admin.role.granted', 'success', 'system', 'profile', profile_id::text,
       jsonb_build_object('role', 'super_admin', 'reason', 'bootstrap first Super Admin')
FROM granted;

COMMIT;

-- ############################################################################
-- PART 3 — OPTIONAL: CLEAR TEST SUBMISSIONS  (OFF by default)
--
-- Deletes EVERY assessment, with its answers, scores and reports. Accounts, consents, roles
-- and the audit trail are kept. Use it once before collecting M2 evidence, so every stored
-- score is calculated with the current scoring version (C-02 v1.0.1).
--
-- To run it: change  false  to  true  on the line below, run, then change it back.
-- The integrity triggers that normally forbid deleting submitted records are paused for this
-- statement only; if anything fails, the whole block rolls back and they stay on.
-- ############################################################################
DO $reset$
DECLARE
  clear_test_data CONSTANT BOOLEAN := false;   -- <<< set to true to delete all test submissions
  removed INTEGER;
BEGIN
  IF NOT clear_test_data THEN
    RAISE NOTICE 'PART 3 skipped: test data kept.';
    RETURN;
  END IF;
  ALTER TABLE public.assessments DISABLE TRIGGER assessments_guard_immutable;
  ALTER TABLE public.responses   DISABLE TRIGGER responses_guard_in_progress;
  DELETE FROM public.assessments;              -- cascades to responses, scores and reports
  GET DIAGNOSTICS removed = ROW_COUNT;
  ALTER TABLE public.responses   ENABLE TRIGGER responses_guard_in_progress;
  ALTER TABLE public.assessments ENABLE TRIGGER assessments_guard_immutable;
  INSERT INTO public.audit_logs (action, result, actor_type, details)
  VALUES ('system.test_data.cleared', 'success', 'system', jsonb_build_object('assessments_removed', removed));
  RAISE NOTICE 'PART 3: % assessments removed with their answers, scores and reports.', removed;
END
$reset$;

-- ############################################################################
-- PART 4 — CHECKS
-- ############################################################################

-- 4a. Tables, RLS, policies, triggers — every row must say OK.
WITH expected(table_name, policies) AS (
  VALUES ('profiles', 3), ('role_assignments', 2), ('assessments', 4), ('responses', 4),
         ('consents', 3), ('scores', 2), ('reports', 2), ('scoring_config', 1), ('audit_logs', 1),
         ('research_exports', 0), ('data_requests', 0)
)
SELECT
  e.table_name,
  cls.relrowsecurity                                              AS rls_enabled,
  (SELECT count(*) FROM pg_policy p WHERE p.polrelid = cls.oid)   AS policies,
  e.policies                                                      AS policies_expected,
  (SELECT count(*) FROM pg_trigger t WHERE t.tgrelid = cls.oid AND NOT t.tgisinternal) AS triggers,
  CASE
    WHEN cls.oid IS NULL                THEN 'CHECK: table missing'
    WHEN NOT cls.relrowsecurity         THEN 'CHECK: RLS is off'
    WHEN (SELECT count(*) FROM pg_policy p WHERE p.polrelid = cls.oid) <> e.policies THEN 'CHECK: policy count'
    ELSE 'OK'
  END                                                             AS status
FROM expected e
LEFT JOIN pg_class cls ON cls.relname = e.table_name AND cls.relnamespace = 'public'::regnamespace
ORDER BY e.table_name;

-- 4b. Privacy and access rules — every row must be true.
SELECT 'canonical_json hidden from signed-in users' AS item,
       NOT has_column_privilege('authenticated', 'public.reports', 'canonical_json', 'SELECT') AS ok
UNION ALL SELECT 'generation_metadata hidden from signed-in users',
       NOT has_column_privilege('authenticated', 'public.reports', 'generation_metadata', 'SELECT')
UNION ALL SELECT 'calculation_trace hidden from signed-in users',
       NOT has_column_privilege('authenticated', 'public.scores', 'calculation_trace', 'SELECT')
UNION ALL SELECT 'no table-wide SELECT on reports',
       NOT has_table_privilege('authenticated', 'public.reports', 'SELECT')
UNION ALL SELECT 'no table-wide SELECT on scores',
       NOT has_table_privilege('authenticated', 'public.scores', 'SELECT')
UNION ALL SELECT 'profiles: participants cannot change email',
       NOT has_column_privilege('authenticated', 'public.profiles', 'email', 'UPDATE')
UNION ALL SELECT 'profiles: participants can change display_name',
       has_column_privilege('authenticated', 'public.profiles', 'display_name', 'UPDATE')
UNION ALL SELECT 'anon has no access to assessments',
       NOT has_table_privilege('anon', 'public.assessments', 'SELECT')
UNION ALL SELECT 'research_exports is server-only',
       NOT has_table_privilege('authenticated', 'public.research_exports', 'SELECT')
UNION ALL SELECT 'data_requests is server-only',
       NOT has_table_privilege('authenticated', 'public.data_requests', 'SELECT')
UNION ALL SELECT 'role expiry column present',
       EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'role_assignments' AND column_name = 'expires_at')
UNION ALL SELECT 'is_staff() honours expiry',
       pg_get_functiondef('public.is_staff()'::regprocedure) LIKE '%expires_at%'
UNION ALL SELECT 'all 10 foreign keys present',
       (SELECT count(*) FROM pg_constraint
        WHERE contype = 'f' AND connamespace = 'public'::regnamespace
          AND conrelid::regclass::text IN ('profiles','role_assignments','assessments','responses','consents',
                                            'scores','reports','scoring_config','research_exports')) >= 10
UNION ALL SELECT 'source_versions recorded on assessments and scores (M2 item 7)',
       (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public'
          AND column_name = 'source_versions' AND table_name IN ('assessments', 'scores')) = 2
UNION ALL SELECT 'a Super Admin exists',
       EXISTS (SELECT 1 FROM public.role_assignments WHERE role = 'super_admin' AND revoked_at IS NULL);

-- 4c. What is stored now (after PART 3 with true, expect 0 / 0).
SELECT (SELECT count(*) FROM public.assessments) AS assessments,
       (SELECT count(*) FROM public.scores)      AS scores,
       (SELECT string_agg(DISTINCT scoring_version, ', ') FROM public.scores) AS scoring_versions;
"""


def main():
    setup = SETUP.read_text(encoding="utf-8")
    sql = HEADER + transform(body(setup)) + "\n" + fk_repair() + "\n" + BOOTSTRAP
    OUT.write_text(sql, encoding="utf-8", newline="\n")
    print(f"wrote {OUT.relative_to(ROOT).as_posix()} ({sql.count(chr(10))} lines)")


if __name__ == "__main__":
    main()
