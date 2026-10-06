# M1 Closure Evidence

Scope: M1 only. This record reflects the current workspace implementation and does not claim production acceptance.

| M1 item | Current implementation | Evidence / remaining requirement |
| --- | --- | --- |
| G0-G2 mapping | This document plus the route/build evidence below | ROOTS written acceptance package still required |
| Repository | Current workspace builds from the checked-in app | Confirm deployed commit matches ROOTS-owned repository revision |
| Environments | Local Next.js and Vercel deployment are present | ROOTS owner/admin screenshots and environment inventory required |
| Architecture | Next.js App Router, SQLite persistence boundary, deterministic scoring | Add approved architecture/data-flow/API/auth/ERD/RLS evidence |
| Database/migrations | `lib/db.ts` creates the current local session/report tables | Reproducible staging migration and applied-state evidence required |
| Authentication | Server session creation is implemented; no provider magic-link exchange is configured | Production auth provider, expiry, cookie, sign-out and session-check evidence required |
| RLS/data isolation | No Supabase RLS policy set exists in this workspace | Policies plus negative cross-user/admin tests are still required |
| Canonical assessment shell | 73 questions across 13 modules render from `lib/canonicalAssessment.ts` | Staging screenshots and C-01 parity evidence required |
| Autosave | `PATCH /api/assessment/sessions/[sessionId]/answers` with visible save status | Staging demonstration and retry/failure evidence required |
| Resume | `GET /api/assessment/sessions/[sessionId]` and `/assessment/[sessionId]/resume` restore confirmed progress | Secure authenticated resume evidence required |
| Traceability | This map links the current implementation surfaces to the M1 obligations | C-07 requirement-to-test IDs and retained results still required |
| Test evidence | `npm run build` is the current executable check | Golden tests, RLS negatives, accessibility, responsive and staging evidence still required |
| Connected staging demonstration | Local sequence is available: create session -> module -> autosave -> resume | ROOTS-owned staging run with access isolation is required |

## Current local proof

- `npm run build` passes.
- Route inventory includes assessment entry, 13-module dynamic assessment, resume, and report routes.
- Canonical assessment constants are 73 questions and 13 modules.
- Q73 is optional free text with `allowNa: false`.
- Server-side session storage records answers, completed modules, created time, and updated time.

## Acceptance boundary

Client storage is not treated as production authentication, authorization, or RLS evidence. This workspace is ready for the M1 staging evidence run, but M1 is not marked accepted until ROOTS verifies the controlled package, environments, auth, database isolation, and named tests in a ROOTS-owned staging environment.