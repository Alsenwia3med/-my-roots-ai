-- ============================================================================
-- ROOTS-AI™ Database Schema (Simplified)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. ASSESSMENTS TABLE
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
  source_versions JSONB NOT NULL DEFAULT '{"c01":{"label":"C-01 v1.0.1 CORRECTED"},"c02":{"label":"C-02 v1.0.1 CORRECTED"}}'
);

-- ============================================================================
-- 3. RESPONSES TABLE
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
-- 4. SCORES TABLE
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
-- 5. REPORTS TABLE
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
-- Row Level Security (Basic)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Allow all access for now (will be restricted later with auth)
CREATE POLICY "Enable all access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON public.assessments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON public.responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON public.scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON public.reports FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
