# ROOTS-AI™ — Project Brief

**Accompanying context, not evidence.** This document is not part of the M3 evidence set and is
not in `docs/m3`. It was written after commit `d04a324` to describe how the delivered system is
built. Nothing in the evidence set was changed to produce it.

---

## 1. What it is

A health assessment web application. A participant answers **73 questions**, a deterministic
engine calculates the scores, and a **19-section report** is produced as both a web page and a
PDF. A separate admin console serves ROOTS staff.

**The rule that shapes the whole architecture:** every score is produced by fixed mathematical
rules from the controlled C-02 document. AI never calculates anything — it may only rewrite three
sections of prose, and only after the numbers already exist.

---

## 2. The stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 18, CSS Modules and global CSS |
| Database and authentication | Supabase (PostgreSQL) |
| Hosting | Cloudflare Workers, via the OpenNext adapter |
| Validation | Zod |
| PDF generation | pdf-lib |
| AI (optional) | OpenAI `gpt-4.1`, for three sections only |

Seven runtime dependencies in total. The surface is deliberately small.

---

## 3. Deployment

    source  →  GitHub (ROOTS-AI-Health-Systems/rootai)
            →  Cloudflare Workers Build
            →  https://roots-ai.health

| Command | Purpose |
|---|---|
| `npm run dev` | Local development on port 3000 |
| `npm run build` | Production build |
| `npm run cf:deploy` | Build and deploy to Cloudflare |

**A deploy replaces the entire runtime `vars` set with the contents of `wrangler.jsonc`.** A value
edited only in the Cloudflare dashboard is removed at the next deploy. Secrets are the exception:
they are set in the console and deploys leave them untouched, which is why `OPENAI_API_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `AUDIT_HMAC_SECRET` and `RESEARCH_EXPORT_KEY` are held that way.

---

## 4. Frontend — where the pages live

Every page is under `app/`. The folder path is the URL.

### Public website — 10 pages

| Path | Route |
|---|---|
| `app/page.tsx` | `/` |
| `app/about` | `/about` |
| `app/how-it-works` | `/how-it-works` |
| `app/platform` | `/platform` |
| `app/research` | `/research` |
| `app/pilot` | `/pilot` |
| `app/healthcare-professionals` | `/healthcare-professionals` |
| `app/example-report` | `/example-report` |
| `app/blog`, `app/blog/[slug]` | `/blog` |
| `app/contact` | `/contact` |

### Legal notices — 5 pages

`/privacy` · `/terms` · `/cookies` · `/medical-disclaimer` · `/ai-disclaimer`

Their wording is held as data and verified word for word against the controlled C-04 pack.

### The assessment journey — 10 screens

| Route | Screen |
|---|---|
| `/assessment` | Enter email address |
| `/assessment/check-email` | Confirmation that a link was sent |
| `/assessment/link-error` | Invalid or expired link |
| `/assessment/consent` | Consent |
| `/assessment/start` | Introduction |
| `/assessment/[session]/module/[module]` | The 13 question modules |
| `/assessment/[session]/resume` | Returning participant |
| `/assessment/[session]/review` | Review answers before submitting |
| `/assessment/[session]/submitted` | Submitted |
| `/assessment/continue` | Routing helper after sign-in |

### Report

`/report` — the participant's latest report · `/report/[id]` — a specific report

### Admin console — 7 screens

`/admin` (sign-in) · `/admin/(console)/overview` · `/participants` · `/participants/[id]` ·
`/reports` · `/audit` · `/access` · `/research-export`

### Account

`/account/privacy` — download my data, request erasure

Shared page wrappers: `app/layout.tsx` is the root layout; the assessment and admin sections have
their own.

---

## 5. Backend — the API

All endpoints are under `app/api/v1/`. Each folder containing a `route.ts` is one endpoint.
**23 endpoints in total.**

### Authentication — 5

| Endpoint | Purpose |
|---|---|
| `POST /auth/magic-link` | Issue a secure sign-in link by email |
| `GET /auth/google` | Begin Google sign-in (admin) |
| `GET /auth/session` | Current session state |
| `POST /auth/sign-out` | End the session |
| `GET /auth/confirm` | Verify a secure link (lives in `app/auth/`) |

### Assessment — 5

| Endpoint | Purpose |
|---|---|
| `POST /assessments` | Start an assessment |
| `PATCH /assessments/[id]/responses` | Autosave one answer |
| `POST /assessments/[id]/submit` | Submit, which triggers scoring |
| `GET /assessments/[id]/report` | Retrieve the report |
| `POST /assessments/[id]/archive` | Archive and start again |

### Report, consent, contact, health — 4

`GET /reports/[id]/pdf` · `POST /consents` · `POST /contact` · `GET /health`

### Data-subject rights — 3

`GET /me/data-export` · `POST /me/deletion-request` · `PATCH /profile`

### Admin — 6

`/admin/access` · `/admin/mfa` · `/admin/participants/[id]/deletion` ·
`/admin/participants/[id]/resend-link` · `/admin/reports/[id]/retry` · `/admin/research-export`

---

## 6. Business logic — `lib/`

Pages and API routes are thin. The substance is in `lib/`.

| Folder | Contents |
|---|---|
| `lib/scoring/` | The engine. `engine.ts` implements SC-001…SC-008 and DRV-001…DRV-004; `c02-ruleset.json` holds the controlled rules; `c02-golden-tests.json` holds the 30 controlled test cases |
| `lib/report/` | `build.ts` assembles the 19 sections; `pdf.ts` renders the PDF; `c03-content.ts` holds every report string |
| `lib/assessment/` | The 73-question bank, validation (VAL-001…VAL-011), autosave, progress |
| `lib/ai/` | The governed narrative. Sandboxed — see §7 |
| `lib/supabase/` | The database clients |
| `lib/auth/` | Account provisioning for secure-link sign-in |
| `lib/admin/` | Role checks and the MFA gate |
| `lib/content/` | Website and legal copy, held as data |
| `lib/privacy/` | Data export and erasure |
| `lib/research/` | De-identified research export |
| `lib/audit.ts` | The audit trail |

Participant-facing wording lives in `lib/content/` and `lib/report/c03-content.ts` because it is
transcribed from controlled PDFs. `npm run check:c04` and `npm run check:c03` verify every string
against those sources word for word.

---

## 7. How the application connects to Supabase

Three connections with different authority. This distinction is the core of the security model.

### Participant connection — `lib/supabase/server.ts`

- Uses the public anon key together with the participant's session cookie
- Runs as the `authenticated` role, so **Row Level Security applies to every read and write**
- Used by pages and by most API routes

### Service-role connection — `lib/supabase/admin.ts`

- Uses the service-role key; bypasses Row Level Security
- Marked `server-only`, so it cannot be imported into a browser bundle
- Used only for account provisioning, server-validated state transitions and audit writes

### The AI path — no connection at all

`lib/ai/` holds **no database client and no database credential**. It performs exactly one
outbound HTTPS request, to the AI provider. The database additionally defines a
`roots_ai_narrative` role with read-only access to pre-calculated score columns and nothing else —
a second lock on a door that has no key.

### Session handling

`proxy.ts` runs before each protected request and refreshes the Supabase session, because Server
Components cannot write cookies. It is a session refresh, not an authorisation check.

**Authorisation is enforced in three independent places:**

1. Page guards — `lib/assessment/guards.ts`, `lib/admin/guard.ts`
2. The API handler
3. Row Level Security in the database — 22 policies

A defect in one does not open the data.

---

## 8. Authentication

### Participants — passwordless secure link

1. The participant enters an email address at `/assessment`
2. `POST /api/v1/auth/magic-link` **provisions the account first**, then asks Supabase Auth to
   generate a one-time link, then sends it
3. The link resolves to `/auth/confirm?token_hash=…`
4. Supabase Auth verifies the token and the session cookie is set
5. The participant continues at `/assessment/continue`

Properties: links are single-use and expire after 15 minutes; a maximum of 3 requests per address
per 15 minutes; the response is identical whether or not the address is registered, so account
existence is never revealed; cookies are httpOnly, Secure and SameSite.

**Defect B1**, recorded as a controlled correction, was that the account was not provisioned before
the link was generated, so a first-time participant's **first** link never verified. A second
request worked, which is why it survived acceptance.

### Staff — Google sign-in with MFA

1. `/admin` → `GET /api/v1/auth/google`
2. Google → Supabase → `/auth/callback`
3. The guard then checks, in order: signed in → holds an active staff role → MFA verified in this
   session → role permitted on this specific screen

Three roles: `admin`, `research_admin`, `super_admin`. Privileged operations require MFA verified
within the last 15 minutes. The Google client ID and secret are held in Supabase, never in this
application.

---

## 9. The database

Eleven tables: `profiles`, `role_assignments`, `assessments`, `responses`, `consents`, `scores`,
`reports`, `scoring_config`, `audit_logs`, `research_exports`, `data_requests`.

- Row Level Security on every table — 22 policies
- A profile is created automatically when an account is created
- Deleting an account cascades to every participant table
- 98 automated probes verify the policies and grants actually behave as stated

The entire schema is one file, `supabase/roots_ai_complete.sql`. Schema changes are made there;
migration files are not used.

---

## 10. The end-to-end flow

    participant answers a question
        │
        ▼  PATCH /assessments/[id]/responses      validated against C-01
    responses
        │
        ▼  POST /assessments/[id]/submit
    lib/scoring/engine.ts                          deterministic, no AI
        │
        ▼  scores
    lib/report/build.ts                            the 19 sections
        │
        ▼  reports.canonical_json                  immutable once written
        ├──────────▶  web page
        └──────────▶  lib/report/pdf.ts  ▶  PDF

Web and PDF cannot diverge because both render the **same stored object**, and neither recalculates
anything. Verified by 916 canonical-value comparisons across five states.

The governed narrative runs after the scores exist. It may replace sections 2, 9 and 18 only, is
given a projection of already-calculated values rather than answers, and is schema-checked and
language-checked before acceptance. On timeout, refusal or rejection the approved deterministic
copy is used and the report records the reason.

---

## 11. Running it locally

    npm install
    cp .env.example .env.local     # add the Supabase keys
    npm run dev                    # http://localhost:3000

| Command | Purpose |
|---|---|
| `npm test` | The full automated suite, 463 tests |
| `npm run db:verify` | The schema applies cleanly to an empty database |
| `npm run db:probes` | 98 database security probes |
| `npm run evidence:closure` | The state of every ROOTS review item |
| `npm run release:snapshot` | Archive the evidence set, then write the release manifest |

---

## 12. Invariants

1. `c01-question-bank.json`, `c02-ruleset.json` and `c02-golden-tests.json` are controlled science
   and are never edited to make something pass
2. `lib/ai/` is never given database access
3. No AI output ever becomes a score, classification or driver
4. Schema changes go in `roots_ai_complete.sql`; no migration files
5. Participant-facing wording is never invented — the source gap is reported instead
6. The client's live database is never queried from development
7. Web and PDF always render from the same stored canonical object
