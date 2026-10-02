-- ============================================================================
-- ROOTS-AI™ Database Schema
-- ============================================================================
-- This schema implements the complete ROOTS-AI assessment platform
-- with Row Level Security (RLS) and integrity constraints
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. ROLE ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.role_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('participant', 'admin', 'super_admin')),
  note TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, role)
);

-- ============================================================================
-- 3. ASSESSMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted')),
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  submission_reference TEXT UNIQUE,
  questionnaire_version JSONB NOT NULL DEFAULT '{"c01":{"label":"C-01 v1.0.1 CORRECTED","questionnaire_version":"1.0.0"}}',
  source_versions JSONB NOT NULL DEFAULT '{"c01":{"label":"C-01 v1.0.1 CORRECTED"},"c02":{"label":"C-02 v1.0.1 CORRECTED"}}',
  CHECK (
    CASE
      WHEN status = 'submitted' THEN submitted_at IS NOT NULL AND submission_reference IS NOT NULL
      ELSE true
    END
  )
);

-- Ensure one in-progress assessment per profile
CREATE UNIQUE INDEX assessments_profile_in_progress_idx ON public.assessments(profile_id)
WHERE status = 'in_progress';

-- ============================================================================
-- 4. RESPONSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  raw_value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(assessment_id, question_id)
);

-- ============================================================================
-- 5. SCORES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL UNIQUE REFERENCES public.assessments(id) ON DELETE CASCADE,
  mr_score INTEGER CHECK (mr_score >= 0 AND mr_score <= 100),
  biological_state INTEGER CHECK (biological_state >= 0 AND biological_state <= 100),
  confidence_label TEXT CHECK (confidence_label IN ('Low', 'Moderate', 'High')),
  scoring_version TEXT NOT NULL DEFAULT '1.0.1',
  source_versions JSONB NOT NULL DEFAULT '{"c01":{"label":"C-01 v1.0.1 CORRECTED"},"c02":{"label":"C-02 v1.0.1 CORRECTED"}}',
  calculation_trace JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL UNIQUE REFERENCES public.assessments(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  report_reference TEXT UNIQUE,
  canonical_json JSONB NOT NULL DEFAULT '{}',
  generation_metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. CONSENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('service', 'research', 'marketing')),
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, consent_type)
);

-- ============================================================================
-- 8. AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  result TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('system', 'user', 'admin')),
  actor_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 9. SCORING CONFIG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.scoring_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT NOT NULL UNIQUE,
  config JSONB NOT NULL,
  active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 10. RESEARCH EXPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.research_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================================
-- 11. DATA REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.data_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'delete')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  processed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES RLS POLICIES
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own display_name only
CREATE POLICY "Users can update own display_name"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND email IS NOT DISTINCT FROM (SELECT email FROM public.profiles WHERE id = auth.uid())
    AND created_at IS NOT DISTINCT FROM (SELECT created_at FROM public.profiles WHERE id = auth.uid())
  );

-- System/Service role can insert profiles (trigger handles this)
CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- ROLE ASSIGNMENTS RLS POLICIES
-- ============================================================================

-- No read access through API for regular users
CREATE POLICY "No direct read access"
  ON public.role_assignments FOR SELECT
  USING (false);

-- No write access through API
CREATE POLICY "No direct write access"
  ON public.role_assignments FOR ALL
  USING (false);

-- ============================================================================
-- ASSESSMENTS RLS POLICIES
-- ============================================================================

-- Users can read their own assessments
CREATE POLICY "Users can read own assessments"
  ON public.assessments FOR SELECT
  USING (auth.uid() = profile_id);

-- Users can insert their own assessments
CREATE POLICY "Users can insert own assessments"
  ON public.assessments FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Users can update their own in-progress assessments (progress, but not status)
CREATE POLICY "Users can update own in-progress assessments"
  ON public.assessments FOR UPDATE
  USING (auth.uid() = profile_id AND status = 'in_progress')
  WITH CHECK (
    auth.uid() = profile_id
    AND status = 'in_progress'
    AND submission_reference IS NULL
    AND source_versions IS NOT DISTINCT FROM (SELECT source_versions FROM public.assessments WHERE id = assessment_id)
    AND questionnaire_version IS NOT DISTINCT FROM (SELECT questionnaire_version FROM public.assessments WHERE id = assessment_id)
  );

-- Admins can read all assessments
CREATE POLICY "Admins can read all assessments"
  ON public.assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.role_assignments
      WHERE profile_id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

-- ============================================================================
-- RESPONSES RLS POLICIES
-- ============================================================================

-- Users can read their own responses
CREATE POLICY "Users can read own responses"
  ON public.responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments
      WHERE assessments.id = responses.assessment_id
      AND assessments.profile_id = auth.uid()
    )
  );

-- Users can insert responses for their own in-progress assessments
CREATE POLICY "Users can insert own responses"
  ON public.responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessments
      WHERE assessments.id = responses.assessment_id
      AND assessments.profile_id = auth.uid()
      AND assessments.status = 'in_progress'
    )
  );

-- Users can update responses for their own in-progress assessments
CREATE POLICY "Users can update own responses"
  ON public.responses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments
      WHERE assessments.id = responses.assessment_id
      AND assessments.profile_id = auth.uid()
      AND assessments.status = 'in_progress'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessments
      WHERE assessments.id = responses.assessment_id
      AND assessments.profile_id = auth.uid()
      AND assessments.status = 'in_progress'
    )
  );

-- No delete access for responses
CREATE POLICY "No delete responses"
  ON public.responses FOR DELETE
  USING (false);

-- Integrity: responses cannot be updated after submission
CREATE POLICY "Cannot update responses after submission"
  ON public.responses FOR UPDATE
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.assessments
      WHERE assessments.id = responses.assessment_id
      AND assessments.status = 'submitted'
    )
  );

-- ============================================================================
-- SCORES RLS POLICIES
-- ============================================================================

-- Users can read their own score values (but not calculation_trace)
CREATE POLICY "Users can read own score values"
  ON public.scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments
      WHERE assessments.id = scores.assessment_id
      AND assessments.profile_id = auth.uid()
    )
  );

-- Hide calculation_trace from everyone
CREATE POLICY "Hide calculation_trace"
  ON public.scores FOR SELECT
  USING (false);

-- Allow reading specific columns only via view or API logic
-- This is handled at application level - RLS blocks full row access

-- No write access for users
CREATE POLICY "No write access to scores"
  ON public.scores FOR ALL
  USING (false);

-- ============================================================================
-- REPORTS RLS POLICIES
-- ============================================================================

-- Users can read their own report status
CREATE POLICY "Users can read own report status"
  ON public.reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments
      WHERE assessments.id = reports.assessment_id
      AND assessments.profile_id = auth.uid()
    )
  );

-- Hide canonical_json and generation_metadata from everyone
CREATE POLICY "Hide report details"
  ON public.reports FOR SELECT
  USING (false);

-- No write access for users
CREATE POLICY "No write access to reports"
  ON public.reports FOR ALL
  USING (false);

-- ============================================================================
-- CONSENTS RLS POLICIES
-- ============================================================================

-- Users can read their own consents
CREATE POLICY "Users can read own consents"
  ON public.consents FOR SELECT
  USING (auth.uid() = profile_id);

-- Users can insert/update their own consents
CREATE POLICY "Users can manage own consents"
  ON public.consents FOR ALL
  WITH CHECK (auth.uid() = profile_id);

-- ============================================================================
-- AUDIT LOGS RLS POLICIES
-- ============================================================================

-- No read access through API
CREATE POLICY "No read access to audit logs"
  ON public.audit_logs FOR SELECT
  USING (false);

-- No write access through API
CREATE POLICY "No write access to audit logs"
  ON public.audit_logs FOR ALL
  USING (false);

-- ============================================================================
-- SCORING CONFIG RLS POLICIES
-- ============================================================================

-- Service role can read config
CREATE POLICY "Service role can read config"
  ON public.scoring_config FOR SELECT
  USING (auth.role() = 'service_role');

-- Service role can write config
CREATE POLICY "Service role can write config"
  ON public.scoring_config FOR ALL
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- RESEARCH EXPORTS RLS POLICIES
-- ============================================================================

-- No read access through API
CREATE POLICY "No read access to research exports"
  ON public.research_exports FOR SELECT
  USING (false);

-- No write access through API
CREATE POLICY "No write access to research exports"
  ON public.research_exports FOR ALL
  USING (false);

-- ============================================================================
-- DATA REQUESTS RLS POLICIES
-- ============================================================================

-- Users can read their own data requests
CREATE POLICY "Users can read own data requests"
  ON public.data_requests FOR SELECT
  USING (auth.uid() = profile_id);

-- Users can insert their own data requests
CREATE POLICY "Users can insert own data requests"
  ON public.data_requests FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_responses_updated_at BEFORE UPDATE ON public.responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- INTEGRITY CONSTRAINTS
-- ============================================================================

-- Prevent updating submitted answers
CREATE OR REPLACE FUNCTION public.prevent_submitted_answer_update()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.assessments
    WHERE id = NEW.assessment_id AND status = 'submitted'
  ) THEN
    RAISE EXCEPTION 'Cannot update responses for submitted assessment';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_submitted_answer_changes
  BEFORE UPDATE ON public.responses
  FOR EACH ROW EXECUTE FUNCTION public.prevent_submitted_answer_update();

-- Prevent re-opening submitted assessments
CREATE OR REPLACE FUNCTION public.prevent_assessment_reopen()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'submitted' AND NEW.status = 'in_progress' THEN
    RAISE EXCEPTION 'Cannot re-open a submitted assessment';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_assessment_reopen
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.prevent_assessment_reopen();

-- Prevent score modifications after creation
CREATE OR REPLACE FUNCTION public.prevent_score_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Scores cannot be modified after creation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_score_changes
  BEFORE UPDATE ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.prevent_score_modification();

-- Prevent report modifications after creation
CREATE OR REPLACE FUNCTION public.prevent_report_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Reports cannot be modified after creation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_report_changes
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.prevent_report_modification();

-- ============================================================================
-- VIEWS FOR API ACCESS
-- ============================================================================

-- View for user-friendly score access (hides calculation_trace)
CREATE OR REPLACE VIEW public.user_scores AS
SELECT
  id,
  assessment_id,
  mr_score,
  biological_state,
  confidence_label,
  scoring_version,
  created_at
FROM public.scores;

-- View for user-friendly report access (hides canonical_json and generation_metadata)
CREATE OR REPLACE VIEW public.user_reports AS
SELECT
  id,
  assessment_id,
  status,
  report_reference,
  created_at,
  updated_at
FROM public.reports;

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant necessary permissions to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT, UPDATE ON public.assessments TO authenticated;
GRANT INSERT, UPDATE ON public.responses TO authenticated;
GRANT INSERT, UPDATE ON public.consents TO authenticated;
GRANT INSERT ON public.data_requests TO authenticated;
GRANT SELECT ON public.user_scores TO authenticated;
GRANT SELECT ON public.user_reports TO authenticated;

-- Grant sequence usage
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
