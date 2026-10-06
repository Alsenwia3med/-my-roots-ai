# M1 Architecture Evidence

This is the current repository-level architecture record for M1. It is implementation evidence, not production ownership or Supabase/RLS acceptance evidence.

## Current flow

```text
Browser
  -> Next.js App Router
     -> Assessment UI / canonicalAssessment.ts
     -> /api/assessment/sessions (server session + HttpOnly roots_session_id)
     -> /api/assessment/sessions/[id]/answers (cookie-bound autosave)
    -> lib/db.ts (server-safe session repository boundary)
     -> lib/scoring.ts (deterministic scoring)
     -> report route (rendered report)
```

## M1 security boundary

- A new assessment session receives an HttpOnly, same-site cookie bound to its session ID.
- Session retrieval and autosave reject requests whose cookie does not match the requested session ID.
- No score or report value is calculated by an LLM.
- The current repository boundary is an in-memory server-safe implementation so Vercel does not depend on a native SQLite binary. It is not durable storage and is not evidence of the required Supabase migrations, RLS policies, or production authentication provider.

## Required staging replacement/evidence

1. Replace the persistence boundary against ROOTS-owned Supabase/PostgreSQL migrations.
2. Add the named Supabase RLS policies and negative cross-user tests.
3. Connect the session entry to the approved Magic Link provider, expiry, sign-out, and session-check flow.
4. Record ROOTS ownership, environment IDs, regions, processors, and deployment revision.