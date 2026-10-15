-- ============================================================================
-- ROOTS-AI™ — LinkedIn posts shown on the Insights (blog) page
--
-- Run once, after 20260922c_source_versions.sql. Safe to re-run.
--
-- Every post published on the company LinkedIn page is sent to
-- POST /api/v1/linkedin/webhook, stored here and shown on /blog. Images are copied into the
-- private Storage bucket below and served from this site, so a LinkedIn image link that expires
-- never leaves a broken picture.
--
-- The table has Row Level Security on and no policies or grants for signed-in users or the
-- public: it is read and written only by the server (service role).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.linkedin_posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id  TEXT NOT NULL UNIQUE,            -- the LinkedIn post id (or its link)
  url          TEXT,                            -- the post on LinkedIn
  body         TEXT NOT NULL DEFAULT '',        -- plain text, as posted
  author_name  TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  image_path   TEXT,                            -- path in the linkedin-media bucket
  image_type   TEXT,                            -- image/jpeg, image/png, image/webp, image/gif
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS linkedin_posts_published_idx ON public.linkedin_posts (published_at DESC);

ALTER TABLE public.linkedin_posts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.linkedin_posts FROM PUBLIC, anon, authenticated;

-- Private bucket for the copied images (served through the site, never directly).
INSERT INTO storage.buckets (id, name, public)
VALUES ('linkedin-media', 'linkedin-media', false)
ON CONFLICT (id) DO NOTHING;
