/**
 * The parts of a Supabase project that an empty PostgreSQL instance does not have.
 *
 * Shared by `db:verify` and `db:probes` so the two cannot drift apart, and kept deliberately
 * small: the closer this is to what Supabase actually provides, the more a local result means.
 *
 * An earlier version defined `auth.uid()` to read only `request.jwt.claim.sub`. The probe suites
 * set identity through `request.jwt.claims` — the JSON form — so every policy saw a null user and
 * ten probes failed against a schema that was in fact correct. The definition below is
 * Supabase's own: it reads either form. That mistake is worth remembering, because a
 * wrong stub produces confident, wrong conclusions about the schema under test.
 */

/** Applied to an empty instance before the schema. */
export const SUPABASE_PREREQUISITES = `
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE SCHEMA IF NOT EXISTS extensions;

  DO $$ BEGIN CREATE ROLE anon NOLOGIN NOINHERIT; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE ROLE authenticated NOLOGIN NOINHERIT; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

  CREATE TABLE IF NOT EXISTS auth.users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT,
    aud         TEXT,
    role        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- Supabase's own definition: the subject may arrive as a discrete GUC or inside the claims JSON.
  CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$
    SELECT COALESCE(
      NULLIF(current_setting('request.jwt.claim.sub', true), ''),
      (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::UUID;
  $$;

  CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
    SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
  $$;

  CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT LANGUAGE sql STABLE AS $$
    SELECT COALESCE(
      NULLIF(current_setting('request.jwt.claim.role', true), ''),
      (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
    );
  $$;
`;

/**
 * Applied after the schema. Supabase grants the service role full table access on `public`; the
 * application schema then narrows what the browser roles may reach, and Row Level Security does
 * the rest. Granting before the tables exist would do nothing, which is why this is separate.
 */
export const SUPABASE_SERVICE_ROLE_GRANTS = `
  GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
  GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
`;
