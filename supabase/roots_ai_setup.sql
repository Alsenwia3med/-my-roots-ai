-- ============================================================================
-- ROOTS-AI™ · COMPLETE DATABASE SETUP (single file)
--
-- Paste this whole file into: Supabase dashboard > SQL Editor > Run.
--
-- ⚠ THIS SCRIPT STARTS BY DROPPING THE APPLICATION TABLES (section 0).
--   It is written for a clean install. Everything in public schema listed there is removed and
--   rebuilt. Supabase Auth users (auth.users) are NOT touched by this script.
--   If you ever need to keep existing rows, delete section 0 before running — but then read the
--   note at the end of that section first.
--
-- WHAT IT CREATES — nine tables in two groups.
--
--   Live now (M1 — used by the code in this repository):
--     profiles           one row per signed-in person, created automatically at sign-up
--     role_assignments   who is a participant, admin, research admin or super admin
--     assessments        one per started assessment          app/api/v1/assessments/**
--     responses          one per saved answer                autosave route, lib/assessment/**
--     consents           append-only consent decisions       app/api/v1/consents
--     audit_logs         append-only security events         lib/audit.ts
--
--   Ready for G3 (scoring and reports — no code writes to these yet):
--     scores             seven domain scores per assessment
--     reports            generated report per assessment
--     scoring_config     versioned weights, thresholds and formulas
--
-- IDENTITY MODEL
--   Supabase Auth (auth.users) is the only place an email address is stored for sign-in.
--   profiles.id IS auth.users.id — the same UUID, so profiles joins to everything by id, and
--   assessments.profile_id / consents.profile_id are that same id. A profile row is created
--   automatically by a trigger when someone signs up, so nothing in the app has to create it.
--
-- AFTER RUNNING
--   The last statement prints an installation summary; every row must say OK.
--   Then: supabase/tests/rls_negative_tests.sql for the access-isolation evidence.
--
-- ALSO SET IN THE DASHBOARD (not settable from SQL)
--   Authentication > Email > Email OTP Expiration = 900 seconds (matches MAGIC_LINK_EXPIRY_MINUTES=15)
--   Authentication > URL Configuration > Site URL   = the environment's APP_URL
-- ============================================================================

BEGIN;

-- ============================================================================
-- 0. RESET — remove previous versions of these tables
--
-- Both generations are listed: the M1 tables, and the older prototype tables whose columns
-- conflict with the current code (participant_id vs profile_id, is_accepted vs granted,
-- event_type vs action, raw_value TEXT vs JSONB). CASCADE also removes their policies,
-- triggers, indexes and foreign keys.
-- ============================================================================
DROP TABLE IF EXISTS public.scores               CASCADE;
DROP TABLE IF EXISTS public.reports              CASCADE;
DROP TABLE IF EXISTS public.scoring_config       CASCADE;
DROP TABLE IF EXISTS public.responses            CASCADE;
DROP TABLE IF EXISTS public.consents             CASCADE;
DROP TABLE IF EXISTS public.assessments          CASCADE;
DROP TABLE IF EXISTS public.role_assignments     CASCADE;
DROP TABLE IF EXISTS public.profiles             CASCADE;
DROP TABLE IF EXISTS public.audit_logs           CASCADE;
DROP TABLE IF EXISTS public.research_exports     CASCADE;
DROP TABLE IF EXISTS public.data_requests        CASCADE;

-- Pre-M1 prototype tables (supabase/schema.sql), unused by this code.
DROP TABLE IF EXISTS public.assessment_responses CASCADE;
DROP TABLE IF EXISTS public.assessment_sessions  CASCADE;
DROP TABLE IF EXISTS public.auth_tokens          CASCADE;
DROP TABLE IF EXISTS public.admin_users          CASCADE;
DROP TABLE IF EXISTS public.users                CASCADE;

-- Functions from earlier schema versions.
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at()        CASCADE;
DROP FUNCTION IF EXISTS public.audit_trigger_func()       CASCADE;

-- NOTE if you removed this section to preserve data: the tables below differ from the older
-- schema in column names, types and CHECK constraints, so CREATE TABLE IF NOT EXISTS would
-- leave the old shape in place and the application would fail at runtime. Preserving rows
-- requires a conversion migration, not this script.

-- ============================================================================
-- 1. PREREQUISITES
-- ============================================================================
-- gen_random_uuid() is built into PostgreSQL 13+, which every current Supabase project runs, so
-- nothing below depends on this. A failure here is ignored rather than failing the install.
DO $do$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pgcrypto not created (%); continuing — gen_random_uuid() is built in', SQLERRM;
END
$do$;

-- ============================================================================
-- 2. IDENTITY — profiles and roles
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles — one row per Supabase Auth user. id IS auth.users.id.
-- Holds no health data and no credentials.
-- ----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT,                                    -- convenience copy for admin screens
  display_name TEXT,
  status       TEXT NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'inactive', 'archived')),
  locale       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Application record of a signed-in person. id equals auth.users.id. Created automatically at sign-up.';

-- ----------------------------------------------------------------------------
-- role_assignments — who may do what. A person with no row here is a participant.
-- Roles are granted and revoked server-side only; revoking keeps the history.
-- ----------------------------------------------------------------------------
CREATE TABLE public.role_assignments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL
             CHECK (role IN ('participant', 'clinician', 'admin', 'research_admin', 'super_admin')),
  granted_by UUID REFERENCES public.profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,            -- time-limited access (ADM-10); NULL = until revoked
  note       TEXT
);

-- One active grant per role per person; a revoked grant stays as a record.
CREATE UNIQUE INDEX role_assignments_active_key
  ON public.role_assignments (profile_id, role) WHERE revoked_at IS NULL;
CREATE INDEX role_assignments_profile_idx ON public.role_assignments (profile_id);

COMMENT ON TABLE public.role_assignments IS 'Role grants. Absence of a row means participant.';

-- ----------------------------------------------------------------------------
-- A profile appears automatically when someone signs up, so no application code has to
-- create one and a participant can never be missing their profile row.
-- SECURITY DEFINER because the inserting session is the auth service, not the table owner.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill for anyone who signed up before this script ran.
INSERT INTO public.profiles (id, email)
SELECT u.id, u.email FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Role test used by the staff policies below. SECURITY DEFINER so that reading
-- role_assignments inside a policy does not re-enter that table's own policies.
-- ----------------------------------------------------------------------------
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

-- ============================================================================
-- 3. ASSESSMENT — the M1 tables the application reads and writes
-- ============================================================================

-- ----------------------------------------------------------------------------
-- assessments — one row per started assessment; one in progress per participant.
-- profile_id references auth.users directly: sign-in must never depend on a second table.
-- It holds the same UUID as profiles.id, so joins to profiles work by id.
-- ----------------------------------------------------------------------------
CREATE TABLE public.assessments (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  questionnaire_version  TEXT NOT NULL DEFAULT '1.0.0',   -- C-01 question bank version
  source_versions        JSONB,                           -- controlled source (C-01 v1.0.1 CORRECTED + SHA-256); server-set
  status                 TEXT NOT NULL DEFAULT 'in_progress'
                         CHECK (status IN ('in_progress', 'submitted', 'archived')),
  current_module         SMALLINT NOT NULL DEFAULT 1 CHECK (current_module BETWEEN 1 AND 13),
  progress_percent       SMALLINT NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  device_metadata        JSONB NOT NULL DEFAULT '{}',     -- device class only, no fingerprinting
  started_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_saved_at          TIMESTAMPTZ,
  submitted_at           TIMESTAMPTZ,
  submission_reference   TEXT,                            -- RS-YYYYMMDD-XXXXXXXX
  submit_idempotency_key UUID,
  archived_at            TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.assessments IS 'One ROOTS Biological Assessment per row (13 modules, 73 questions).';

-- ----------------------------------------------------------------------------
-- responses — one row per saved answer
-- ----------------------------------------------------------------------------
CREATE TABLE public.responses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id    UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_id      TEXT NOT NULL,                  -- C-01 question id, e.g. Q1
  raw_value        JSONB,                          -- exactly as the participant entered it
  normalized_value JSONB,                          -- canonical value; null when N/A
  is_na            BOOLEAN NOT NULL DEFAULT FALSE,
  validation_state TEXT NOT NULL DEFAULT 'valid',
  source_version   TEXT,                           -- question bank version at save time
  answered_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.responses IS 'Saved answers. The (assessment_id, question_id) unique key is what autosave upserts on.';

-- ----------------------------------------------------------------------------
-- consents — append-only record of each consent decision
-- ----------------------------------------------------------------------------
CREATE TABLE public.consents (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type            TEXT NOT NULL CHECK (consent_type IN ('service', 'research', 'privacy')),
  granted                 BOOLEAN NOT NULL DEFAULT FALSE,
  purpose                 TEXT,
  document_version        TEXT NOT NULL DEFAULT '1.0',
  document_effective_date DATE,
  consent_text_sha256     TEXT,                    -- SHA-256 of the exact text shown
  withdrawn_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.consents IS 'Append-only consent decisions with document version, effective date and a hash of the text shown.';

-- ============================================================================
-- 4. SCORING AND REPORTS — created now, used from G3
-- ============================================================================

-- ----------------------------------------------------------------------------
-- scores — one row per assessment: the seven domain scores and derived measures
-- ----------------------------------------------------------------------------
CREATE TABLE public.scores (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id      UUID NOT NULL UNIQUE REFERENCES public.assessments(id) ON DELETE CASCADE,

  mr_score           NUMERIC(5,2),   -- Metabolic Resistance
  hs_score           NUMERIC(5,2),   -- Hunger & Satiety Signals
  sr_score           NUMERIC(5,2),   -- Sleep Recovery Index
  ch_score           NUMERIC(5,2),   -- Circadian Health
  sl_score           NUMERIC(5,2),   -- Stress Load
  ib_score           NUMERIC(5,2),   -- Inflammation Burden
  bs_score           NUMERIC(5,2),   -- Biological Safety Signals

  biological_state   NUMERIC(5,2),
  opportunity_score  NUMERIC(5,2),
  recovery_potential NUMERIC(5,2),
  confidence         NUMERIC(5,2),
  -- C-02 p.14 confidence labels.
  confidence_label   TEXT CONSTRAINT scores_confidence_label_check
                     CHECK (confidence_label IN ('High', 'Moderate-High', 'Moderate', 'Low')),
  protective_count   SMALLINT,

  primary_driver     TEXT,           -- domain code, or "A+B co-primary"
  secondary_driver   TEXT,
  tertiary_driver    TEXT,
  drivers_json       JSONB,
  -- Unused: C-02 evidence is per domain and is stored in evidence_json.
  evidence_strength  TEXT CHECK (evidence_strength IN ('low', 'moderate', 'high')),

  coverage_json        JSONB,        -- answered / eligible per domain
  classifications_json JSONB,        -- C-02 p.14 labels for domains, confidence and recovery
  evidence_json        JSONB,        -- EVD-001/002 per domain
  limitations          TEXT[] NOT NULL DEFAULT '{}',

  dataset_id         TEXT,           -- ROOTS-C02-SCORING-001
  scoring_version    TEXT NOT NULL DEFAULT '1.0.1',
  source_versions    JSONB,          -- controlled sources used (C-01 / C-02 v1.0.1 CORRECTED + SHA-256)
  calculation_trace  JSONB,          -- how each score was reached, for review
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.scores IS 'G3. Seven domain scores and derived measures for one assessment.';

-- ----------------------------------------------------------------------------
-- reports — one generated report per assessment
-- ----------------------------------------------------------------------------
CREATE TABLE public.reports (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id           UUID NOT NULL UNIQUE REFERENCES public.assessments(id) ON DELETE CASCADE,
  report_version          TEXT NOT NULL DEFAULT '1.0.0',
  status                  TEXT NOT NULL DEFAULT 'generating'
                          CHECK (status IN ('generating', 'completed', 'failed')),
  report_reference        TEXT,      -- participant-facing ID, e.g. RPT-20260921-XXXXXXXX
  canonical_json          JSONB,     -- C-03 §9 canonical report; web and PDF render from it
  storage_reference       TEXT,      -- path in Supabase Storage
  generation_metadata     JSONB,
  canonical_json_checksum TEXT,      -- SHA-256 of the canonical JSON (sorted keys)
  generated_at            TIMESTAMPTZ,
  first_viewed_at         TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.reports IS 'G3. One report per assessment; the file itself lives in Storage.';

-- ----------------------------------------------------------------------------
-- scoring_config — versioned scoring rules. A published version is never edited.
-- ----------------------------------------------------------------------------
CREATE TABLE public.scoring_config (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version         TEXT NOT NULL UNIQUE,
  state           TEXT NOT NULL DEFAULT 'draft'
                  CHECK (state IN ('draft', 'reviewed', 'published', 'retired')),
  domain_mappings JSONB NOT NULL DEFAULT '{}',   -- question -> domain
  weights         JSONB NOT NULL DEFAULT '{}',
  thresholds      JSONB NOT NULL DEFAULT '{}',
  formulas        JSONB NOT NULL DEFAULT '{}',
  classifications JSONB NOT NULL DEFAULT '{}',
  effective_date  TIMESTAMPTZ,
  published_by    UUID REFERENCES public.profiles(id),
  published_at    TIMESTAMPTZ,
  retired_at      TIMESTAMPTZ,
  rollback_target TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT scoring_config_published_has_date CHECK (state <> 'published' OR published_at IS NOT NULL)
);

COMMENT ON TABLE public.scoring_config IS 'G3. Versioned weights, thresholds and formulas. Published versions are immutable.';

-- ============================================================================
-- 5. AUDIT
-- ============================================================================

-- No foreign key to auth.users on purpose: security events must survive account erasure.
CREATE TABLE public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action      TEXT NOT NULL,                     -- e.g. auth.secure_link.requested
  result      TEXT NOT NULL CHECK (result IN ('success', 'denied', 'failure')),
  actor_type  TEXT NOT NULL DEFAULT 'anonymous'
              CHECK (actor_type IN ('anonymous', 'participant', 'admin', 'system')),
  actor_id    UUID,
  object_type TEXT,
  object_id   TEXT,
  details     JSONB NOT NULL DEFAULT '{}',       -- HMAC digests only: never an email, answer or token
  ip_address  INET,
  user_agent  TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.audit_logs IS 'Append-only audit trail. Written with the service role only.';

-- ============================================================================
-- 6. INDEXES
-- ============================================================================

CREATE INDEX profiles_email_idx ON public.profiles (email);

CREATE INDEX assessments_profile_status_idx ON public.assessments (profile_id, status);

-- One in-progress assessment per participant: store.ts reads it with maybeSingle(), so more
-- than one would break resume. This is what makes that impossible.
CREATE UNIQUE INDEX assessments_one_in_progress_per_profile
  ON public.assessments (profile_id) WHERE status = 'in_progress';

CREATE UNIQUE INDEX assessments_submission_reference_key
  ON public.assessments (submission_reference) WHERE submission_reference IS NOT NULL;

-- Required by the autosave upsert: onConflict 'assessment_id,question_id'.
CREATE UNIQUE INDEX responses_assessment_question_key
  ON public.responses (assessment_id, question_id);

CREATE INDEX consents_lookup_idx
  ON public.consents (profile_id, consent_type, document_version, created_at DESC);

CREATE INDEX reports_status_idx ON public.reports (status, created_at DESC);
CREATE UNIQUE INDEX reports_report_reference_key
  ON public.reports (report_reference) WHERE report_reference IS NOT NULL;
CREATE INDEX scoring_config_state_idx ON public.scoring_config (state, version);

-- The secure-link rate limit counts recent rows by action, result and occurred_at, filtered by
-- a digest inside details, so details needs a containment index.
CREATE INDEX audit_logs_action_time_idx ON public.audit_logs (action, result, occurred_at DESC);
CREATE INDEX audit_logs_actor_idx       ON public.audit_logs (actor_id, occurred_at DESC);
CREATE INDEX audit_logs_details_idx     ON public.audit_logs USING GIN (details jsonb_path_ops);

-- ============================================================================
-- 7. ROW LEVEL SECURITY
--
-- anon           not signed in — no access to anything
-- authenticated  a signed-in person — their own rows, plus staff reads via is_staff()
-- service_role   server-only key; bypasses RLS by design (audit writes, submit, archive,
--                scoring, report generation). Never exposed to the browser.
--
-- auth.uid() is wrapped as (SELECT auth.uid()) so it is evaluated once per statement and the
-- profile_id indexes can still be used.
--
-- FORCE ROW LEVEL SECURITY is deliberately not used: it would also apply these policies to the
-- table owner, which is the role behind the dashboard's table and SQL editors, and you would
-- stop seeing your own rows there.
-- ============================================================================

ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_config   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs       ENABLE ROW LEVEL SECURITY;

-- ---- profiles ---------------------------------------------------------------
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY profiles_select_staff ON public.profiles
  FOR SELECT TO authenticated USING (public.is_staff());
-- No INSERT policy: profiles are created by the sign-up trigger, not by the browser.

-- ---- role_assignments -------------------------------------------------------
CREATE POLICY role_assignments_select_own ON public.role_assignments
  FOR SELECT TO authenticated USING (profile_id = (SELECT auth.uid()));

CREATE POLICY role_assignments_select_staff ON public.role_assignments
  FOR SELECT TO authenticated USING (public.is_staff());
-- Granting and revoking is server-side only (service role): nobody can promote themselves.

-- ---- assessments ------------------------------------------------------------
CREATE POLICY assessments_select_own ON public.assessments
  FOR SELECT TO authenticated USING (profile_id = (SELECT auth.uid()));

CREATE POLICY assessments_insert_own ON public.assessments
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = (SELECT auth.uid()) AND status = 'in_progress');

-- Autosave updates last_saved_at, progress_percent and current_module. A participant can never
-- move an assessment out of in_progress: submit and archive run with the service role.
CREATE POLICY assessments_update_own_in_progress ON public.assessments
  FOR UPDATE TO authenticated
  USING (profile_id = (SELECT auth.uid()) AND status = 'in_progress')
  WITH CHECK (profile_id = (SELECT auth.uid()) AND status = 'in_progress');

CREATE POLICY assessments_select_staff ON public.assessments
  FOR SELECT TO authenticated USING (public.is_staff());
-- No DELETE policy: assessments are retained, never removed by a participant.

-- ---- responses --------------------------------------------------------------
CREATE POLICY responses_select_own ON public.responses
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assessments a
    WHERE a.id = responses.assessment_id AND a.profile_id = (SELECT auth.uid())
  ));

CREATE POLICY responses_insert_own ON public.responses
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.assessments a
    WHERE a.id = responses.assessment_id
      AND a.profile_id = (SELECT auth.uid()) AND a.status = 'in_progress'
  ));

CREATE POLICY responses_update_own ON public.responses
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assessments a
    WHERE a.id = responses.assessment_id
      AND a.profile_id = (SELECT auth.uid()) AND a.status = 'in_progress'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.assessments a
    WHERE a.id = responses.assessment_id
      AND a.profile_id = (SELECT auth.uid()) AND a.status = 'in_progress'
  ));

-- Clearing an answer deletes the row, so DELETE is allowed while in progress.
CREATE POLICY responses_delete_own ON public.responses
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assessments a
    WHERE a.id = responses.assessment_id
      AND a.profile_id = (SELECT auth.uid()) AND a.status = 'in_progress'
  ));

-- Health answers are readable by research and admin staff only through the service role, not
-- from a browser session: there is deliberately no staff SELECT policy here.

-- ---- consents ---------------------------------------------------------------
CREATE POLICY consents_select_own ON public.consents
  FOR SELECT TO authenticated USING (profile_id = (SELECT auth.uid()));

CREATE POLICY consents_insert_own ON public.consents
  FOR INSERT TO authenticated WITH CHECK (profile_id = (SELECT auth.uid()));

CREATE POLICY consents_select_staff ON public.consents
  FOR SELECT TO authenticated USING (public.is_staff());
-- No UPDATE or DELETE policy: a recorded decision is never edited. A change of mind is a new
-- row, and the latest row for the current document version is what counts.

-- ---- scores -----------------------------------------------------------------
CREATE POLICY scores_select_own ON public.scores
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assessments a
    WHERE a.id = scores.assessment_id AND a.profile_id = (SELECT auth.uid())
  ));

CREATE POLICY scores_select_staff ON public.scores
  FOR SELECT TO authenticated USING (public.is_staff());
-- Written by the scoring service only (service role).

-- ---- reports ----------------------------------------------------------------
CREATE POLICY reports_select_own ON public.reports
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assessments a
    WHERE a.id = reports.assessment_id AND a.profile_id = (SELECT auth.uid())
  ));

CREATE POLICY reports_select_staff ON public.reports
  FOR SELECT TO authenticated USING (public.is_staff());
-- Written by the report generator only (service role).

-- ---- scoring_config ---------------------------------------------------------
CREATE POLICY scoring_config_select ON public.scoring_config
  FOR SELECT TO authenticated
  USING (state = 'published' OR public.is_staff());
-- Publishing and retiring are server-side only.

-- ---- audit_logs -------------------------------------------------------------
CREATE POLICY audit_logs_select_staff ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_staff());
-- Participants have no access at all; writes are service-role only.

-- ---- table privileges (defence in depth behind the policies) ----------------
REVOKE ALL ON public.profiles, public.role_assignments, public.assessments, public.responses,
              public.consents, public.scores, public.reports, public.scoring_config,
              public.audit_logs
  FROM anon;

-- Participants edit only the name on their report cover (and locale) — never the email copy
-- the admin "Resend link" reads, or the account status.
GRANT SELECT                       ON public.profiles         TO authenticated;
GRANT UPDATE (display_name, locale) ON public.profiles        TO authenticated;
GRANT SELECT                       ON public.role_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE       ON public.assessments      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.responses      TO authenticated;
GRANT SELECT, INSERT               ON public.consents         TO authenticated;
-- scores and reports: every column except those that carry answers. responses has no staff
-- read policy, so raw answers must not be reachable through their copies either:
-- scores.calculation_trace (option and points per question) and reports.canonical_json
-- (section 16 is the answer snapshot) are read only on the server, after an ownership check.
GRANT SELECT (id, assessment_id, mr_score, hs_score, sr_score, ch_score, sl_score, ib_score, bs_score,
              biological_state, opportunity_score, recovery_potential, confidence, confidence_label,
              protective_count, primary_driver, secondary_driver, tertiary_driver, drivers_json,
              evidence_strength, coverage_json, classifications_json, evidence_json, limitations,
              dataset_id, scoring_version, source_versions, created_at, updated_at)
                                   ON public.scores           TO authenticated;
GRANT SELECT (id, assessment_id, report_version, status, report_reference, storage_reference,
              canonical_json_checksum, generated_at, first_viewed_at, created_at, updated_at)
                                   ON public.reports          TO authenticated;
GRANT SELECT                       ON public.scoring_config   TO authenticated;
GRANT SELECT                       ON public.audit_logs       TO authenticated;

-- ---- the AI narrative role (Regulatory Readiness Annex AI-03) ---------------
--
-- AI-03 requires database permissions to prevent the AI execution path from updating
-- assessment results or canonical score records. The application already gives that path no
-- database client at all — lib/ai/* performs exactly one outbound HTTPS request and holds no
-- credentials — and this role is the database half of the same guarantee: the least privilege
-- the narrative could ever need, so the control holds even if a future change did connect.
--
-- It can read the pre-calculated values the approved projection is built from (AI-01) and
-- nothing else. It cannot read answers in any form: not public.responses, not
-- scores.calculation_trace (option and points per question) and not reports.canonical_json
-- (section 16 is the answer snapshot). It cannot read participant identity or the audit trail.
-- It has no INSERT, UPDATE or DELETE anywhere in the schema.
--
-- NOLOGIN: nothing signs in as this role. It exists to be granted, revoked and evidenced.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'roots_ai_narrative') THEN
    CREATE ROLE roots_ai_narrative NOLOGIN NOINHERIT;
  END IF;
END
$$;

-- Membership, so the evidence probes can SET ROLE to it. Harmless if already held, and skipped
-- where the running user may not grant it.
DO $$
BEGIN
  EXECUTE format('GRANT roots_ai_narrative TO %I', current_user);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'roots_ai_narrative membership not granted to %: %', current_user, SQLERRM;
END
$$;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM roots_ai_narrative;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM roots_ai_narrative;
REVOKE ALL ON SCHEMA public FROM roots_ai_narrative;
GRANT USAGE ON SCHEMA public TO roots_ai_narrative;

-- Read-only, and only the columns C-03 §7 allows into the explanation object: pre-calculated
-- values, classifications, driver IDs and version identifiers.
GRANT SELECT (id, assessment_id, mr_score, hs_score, sr_score, ch_score, sl_score, ib_score, bs_score,
              biological_state, opportunity_score, recovery_potential, confidence, confidence_label,
              protective_count, primary_driver, secondary_driver, tertiary_driver, drivers_json,
              evidence_strength, coverage_json, classifications_json, evidence_json, limitations,
              dataset_id, scoring_version, source_versions)
                                   ON public.scores           TO roots_ai_narrative;

-- ============================================================================
-- 8. INTEGRITY RULES
--
-- These triggers apply to every role, including service_role, so a server bug cannot rewrite a
-- submitted record either.
-- ============================================================================

-- ---- updated_at maintenance -------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $fn$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER profiles_set_updated_at       BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER assessments_set_updated_at    BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER scores_set_updated_at         BEFORE UPDATE ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER reports_set_updated_at        BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER scoring_config_set_updated_at BEFORE UPDATE ON public.scoring_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- a submitted assessment is a final record ------------------------------
CREATE OR REPLACE FUNCTION public.assessments_guard_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $fn$
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Erasure of the account cascades from auth.users and must still succeed; by then the auth
    -- user is already gone. Any other delete is refused.
    IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = OLD.profile_id) THEN
      RETURN OLD;
    END IF;
    RAISE EXCEPTION 'assessments are retained and cannot be deleted (id %)', OLD.id
      USING ERRCODE = 'restrict_violation';
  END IF;

  IF NEW.profile_id IS DISTINCT FROM OLD.profile_id
     OR NEW.started_at IS DISTINCT FROM OLD.started_at
     OR NEW.questionnaire_version IS DISTINCT FROM OLD.questionnaire_version THEN
    RAISE EXCEPTION 'profile_id, started_at and questionnaire_version are immutable (assessment %)', OLD.id
      USING ERRCODE = 'restrict_violation';
  END IF;

  -- The controlled source is recorded once, by the server (service role), and never changed.
  IF NEW.source_versions IS DISTINCT FROM OLD.source_versions
     AND (OLD.source_versions IS NOT NULL OR current_user IN ('anon', 'authenticated')) THEN
    RAISE EXCEPTION 'source_versions is recorded once by the server and cannot be changed (assessment %)', OLD.id
      USING ERRCODE = 'restrict_violation';
  END IF;

  IF OLD.status = 'submitted' THEN
    IF NEW.status IS DISTINCT FROM 'submitted'
       OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
       OR NEW.submission_reference IS DISTINCT FROM OLD.submission_reference
       OR NEW.submit_idempotency_key IS DISTINCT FROM OLD.submit_idempotency_key THEN
      RAISE EXCEPTION 'a submitted assessment is a final record and cannot be changed (assessment %)', OLD.id
        USING ERRCODE = 'restrict_violation';
    END IF;
  END IF;

  IF OLD.status = 'archived' AND NEW.status IS DISTINCT FROM 'archived' THEN
    RAISE EXCEPTION 'an archived assessment cannot be reopened (assessment %)', OLD.id
      USING ERRCODE = 'restrict_violation';
  END IF;

  RETURN NEW;
END;
$fn$;

CREATE TRIGGER assessments_guard_immutable
  BEFORE UPDATE OR DELETE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.assessments_guard_immutable();

-- ---- a browser session cannot claim a source version ------------------------
-- Participants create their own assessment row; the controlled source is stamped by the server
-- afterwards. Any value sent from a browser session is discarded.
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

CREATE TRIGGER assessments_source_server_only
  BEFORE INSERT ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.assessments_source_server_only();

-- ---- answers freeze once the assessment leaves in_progress -----------------
CREATE OR REPLACE FUNCTION public.responses_guard_in_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $fn$
DECLARE
  parent_status TEXT;
  parent_id UUID;
BEGIN
  parent_id := COALESCE(NEW.assessment_id, OLD.assessment_id);
  SELECT status INTO parent_status FROM public.assessments WHERE id = parent_id;

  -- A cascade delete removes the parent first; nothing to guard then.
  IF parent_status IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF parent_status <> 'in_progress' THEN
    RAISE EXCEPTION 'answers for a % assessment are a final record and cannot be changed (assessment %)',
      parent_status, parent_id USING ERRCODE = 'restrict_violation';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.assessment_id IS DISTINCT FROM OLD.assessment_id THEN
    RAISE EXCEPTION 'an answer cannot be moved to another assessment'
      USING ERRCODE = 'restrict_violation';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$fn$;

CREATE TRIGGER responses_guard_in_progress
  BEFORE INSERT OR UPDATE OR DELETE ON public.responses
  FOR EACH ROW EXECUTE FUNCTION public.responses_guard_in_progress();

-- ---- consents are append-only ----------------------------------------------
CREATE OR REPLACE FUNCTION public.consents_append_only_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $fn$
BEGIN
  IF TG_OP = 'DELETE' AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = OLD.profile_id) THEN
    RETURN OLD;  -- cascade from account erasure
  END IF;

  -- Withdrawing a consent is the one permitted update: it only stamps withdrawn_at.
  IF TG_OP = 'UPDATE'
     AND OLD.withdrawn_at IS NULL
     AND NEW.withdrawn_at IS NOT NULL
     AND ROW(NEW.id, NEW.profile_id, NEW.consent_type, NEW.granted, NEW.document_version,
             NEW.consent_text_sha256, NEW.created_at)
       = ROW(OLD.id, OLD.profile_id, OLD.consent_type, OLD.granted, OLD.document_version,
             OLD.consent_text_sha256, OLD.created_at) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'consent records are append-only and cannot be % (id %)', lower(TG_OP), OLD.id
    USING ERRCODE = 'restrict_violation';
END;
$fn$;

CREATE TRIGGER consents_append_only
  BEFORE UPDATE OR DELETE ON public.consents
  FOR EACH ROW EXECUTE FUNCTION public.consents_append_only_guard();

-- ---- audit rows are append-only --------------------------------------------
CREATE OR REPLACE FUNCTION public.append_only_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $fn$
BEGIN
  RAISE EXCEPTION '% records are append-only and cannot be % (id %)', TG_TABLE_NAME, lower(TG_OP), OLD.id
    USING ERRCODE = 'restrict_violation';
END;
$fn$;

CREATE TRIGGER audit_logs_append_only
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.append_only_guard();

-- ---- a score row is the record of a submitted assessment -------------------
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

CREATE TRIGGER scores_guard_immutable
  BEFORE UPDATE ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.scores_guard_immutable();

-- ---- a generated report's content is never rewritten -----------------------
-- Status and first_viewed_at may still change; what the report says may not.
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

CREATE TRIGGER reports_guard_canonical
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.reports_guard_canonical();

-- ---- a published scoring version is never edited ---------------------------
CREATE OR REPLACE FUNCTION public.scoring_config_guard_published()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $fn$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.state IN ('published', 'retired') THEN
      RAISE EXCEPTION 'a published scoring version cannot be deleted (version %)', OLD.version
        USING ERRCODE = 'restrict_violation';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.state = 'published' THEN
    -- Retiring is the only permitted change.
    IF NEW.domain_mappings IS DISTINCT FROM OLD.domain_mappings
       OR NEW.weights IS DISTINCT FROM OLD.weights
       OR NEW.thresholds IS DISTINCT FROM OLD.thresholds
       OR NEW.formulas IS DISTINCT FROM OLD.formulas
       OR NEW.classifications IS DISTINCT FROM OLD.classifications
       OR NEW.version IS DISTINCT FROM OLD.version THEN
      RAISE EXCEPTION 'scoring version % is published and its rules are immutable', OLD.version
        USING ERRCODE = 'restrict_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$fn$;

CREATE TRIGGER scoring_config_guard_published
  BEFORE UPDATE OR DELETE ON public.scoring_config
  FOR EACH ROW EXECUTE FUNCTION public.scoring_config_guard_published();

-- ============================================================================
-- 8b. ADMIN OPERATIONS — research exports and data-subject requests (server only)
-- ============================================================================
-- ---- 3. research exports ----------------------------------------------------------
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

-- ---- 4. data-subject requests ------------------------------------------------------
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


COMMIT;

-- ============================================================================
-- 9. INSTALLATION SUMMARY — every row must say OK
-- ============================================================================
WITH expected(table_name, policies) AS (
  VALUES ('profiles', 3), ('role_assignments', 2), ('assessments', 4), ('responses', 4),
         ('consents', 3), ('scores', 2), ('reports', 2), ('scoring_config', 1), ('audit_logs', 1),
         ('research_exports', 0), ('data_requests', 0)
)
SELECT
  e.table_name,
  (SELECT count(*) FROM information_schema.columns c
     WHERE c.table_schema = 'public' AND c.table_name = e.table_name)          AS columns,
  cls.relrowsecurity                                                           AS rls_enabled,
  (SELECT count(*) FROM pg_policy p WHERE p.polrelid = cls.oid)                AS policies,
  e.policies                                                                   AS policies_expected,
  (SELECT count(*) FROM pg_trigger t
     WHERE t.tgrelid = cls.oid AND NOT t.tgisinternal)                         AS triggers,
  CASE
    WHEN cls.oid IS NULL                                                  THEN 'CHECK: table missing'
    WHEN NOT cls.relrowsecurity                                           THEN 'CHECK: RLS is off'
    WHEN (SELECT count(*) FROM pg_policy p WHERE p.polrelid = cls.oid) <> e.policies
                                                                          THEN 'CHECK: policy count'
    ELSE 'OK'
  END                                                                          AS status
FROM expected e
LEFT JOIN pg_class cls ON cls.relname = e.table_name
  AND cls.relnamespace = 'public'::regnamespace
ORDER BY e.table_name;
