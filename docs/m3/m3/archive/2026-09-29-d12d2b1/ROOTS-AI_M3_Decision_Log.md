# ROOTS-AI™ — M3 decision log

Decisions issued by ROOTS and how each is implemented. Items requiring controlled-source
verification remain explicitly open until that verification is complete.

| # | Subject | Issued | State |
|---|---|---|---|
| D-01 | Cookie table columns (LEG-03) | 25 Sep 2026 | Applied; inventory below **open for ROOTS confirmation** |
| D-02 | Effective dates and versions (LEG-03/04/05) | 25 Sep 2026 | Applied; controlling provision identified |
| D-03 | Footer version line | 25 Sep 2026 | Applied and confirmed |
| D-04 | Driver and Triad wording | 25 Sep 2026 | Applied; **open** pending C-03 state verification |
| D-05 | Anonymous visitor consent (OPS-03) | 25 Sep 2026 | Structure and mapping below; **open** with gaps identified |

---

## D-01 — Cookie table (LEG-03)

**Decision.** Retain C-04 §6 content and its three columns. Do not invent provider or duration
values. Remove the added statement that no third-party provider or storage duration exists —
that conclusion does not follow merely from C-04 not listing those values. Provide the actual
Phase 1 cookie and browser-storage inventory for confirmation against the controlled legal copy.
Publish nothing unsupported in the meantime.

**Applied.** The statement is removed from `lib/content/c04-legal.ts`. The published table shows
only C-04's three columns. Nothing about providers or durations is published.

**The point was well made.** The removed statement would have been false. The inventory below
shows a third-party technology in use — a Cloudflare cookie — that the earlier wording would
have denied.

### Phase 1 cookie and browser-storage inventory — verified

Verified 25 September 2026 against the deployed release candidate at `roots-ai.health`, not
against the source alone. Two findings below were **not** in the first inventory, which is why
the verification was necessary.

**Method.** Anonymous browse of a public page and of `/admin`; `document.cookie`, `localStorage`
and `sessionStorage` read in the page; network requests observed; application cookie code read.
`document.cookie` cannot see `httpOnly` cookies, which is stated per row below.

#### Cookies

| Name | Purpose | Provider | Category | Duration | Applies to |
|---|---|---|---|---|---|
| `sb-<project-ref>-auth-token` (chunked `.0`, `.1`) | Authenticated session | Supabase, first-party on our domain | Strictly necessary | **Service-configured, not application-defined.** Set by `@supabase/ssr` from the project's JWT expiry and refresh-token lifetime. **Not yet confirmed against the ROOTS-owned Supabase project settings — open.** | Authenticated users only |
| `roots_oauth_next` | Carries the post-sign-in destination across the Google redirect | ROOTS-AI, first-party | Strictly necessary | **Application-defined: 600 seconds.** `httpOnly`, `SameSite=Lax`, `Secure` on HTTPS, `Path=/auth/callback`. Actively cleared on return (`maxAge: 0`) | Only a visitor starting Google sign-in |
| `cf_clearance` | Cloudflare challenge clearance | Cloudflare | Strictly necessary | Service-configured by Cloudflare | **Conditional — not every visitor.** Not present on the verified anonymous visits; observed earlier only after a challenge was issued |

#### Browser storage

| Key | Store | Purpose | Provider | Duration | Applies to |
|---|---|---|---|---|---|
| `_cfPre_tabId` | sessionStorage | Tab identifier for Cloudflare bot detection | **Cloudflare** | Browser tab session | **All visitors, public and protected** |
| `roots-ai.cookie-consent` | localStorage | Records the analytics consent decision | ROOTS-AI | Until cleared, or until the consent version changes | Anonymous and authenticated |
| `roots-secure-link-email` | sessionStorage | Shows which address a secure link was sent to | ROOTS-AI | Browser tab session | Visitor requesting a secure link |
| `roots-submit-key-<assessmentId>` | sessionStorage | Idempotency key preventing a duplicate submission | ROOTS-AI | Browser tab session | Authenticated participant submitting |

#### Corrections to the first inventory

1. **`cf_clearance` is not present for every visitor.** The first inventory listed it without
   qualification. On the verified anonymous visits no challenge was issued and no clearance
   cookie was set. It is conditional on Cloudflare's bot-management decision.
2. **`_cfPre_tabId` was missing entirely.** Cloudflare's "Precursor" bot-detection script writes
   a tab identifier to `sessionStorage`. It is a Cloudflare technology that the first inventory
   did not record.

#### Finding requiring a ROOTS decision

**Cloudflare Precursor runs on protected routes.** Verified on `/admin`:
`/cdn-cgi/challenge-platform/scripts/precursor/main.js` loads and POSTs telemetry to
`/cdn-cgi/challenge-platform/h/b/precursor/...`, and `_cfPre_tabId` is written.

Cloudflare describes Precursor as detecting automation by analysing behaviour over time. It is a
security control rather than marketing analytics, and it is enabled in the ROOTS-owned Cloudflare
account rather than by application code. But it is a third-party behavioural script executing on
authentication and administration routes, and C-04 §6 records that session replay is "Prohibited
on assessment, report, authentication and admin routes".

**Decision required from ROOTS:**

1. Is Precursor treated as strictly necessary security — and therefore permitted on protected
   routes without consent — or must it be disabled there?
2. If it remains, does it require disclosure in the Cookie Notice, and in what controlled
   wording?
3. Should `_cfPre_tabId` be disclosed as a browser-storage technology?

No wording is proposed or published.

**Execution is not the constraint.** We hold administrator access to the ROOTS Cloudflare
account, so if Precursor is to be restricted on protected routes we can apply that
configuration directly and immediately. What remains with ROOTS is the decision itself:
question 1 is whether a third-party behavioural script is permissible on authentication and
administration routes given that C-04 §6 records session replay as "Prohibited on assessment,
report, authentication and admin routes", and questions 2 and 3 concern controlled legal copy.
Neither is ours to settle, and we will not change a production security control on the client's
account without instruction.

#### Confirmed absent

No analytics, advertising or session-replay technology of our own is active in the deployed
build. No analytics provider is configured, `analyticsAllowed()` returns false with no consent
record, and no advertising or replay script is loaded by the application. The only third-party
browser activity observed is Cloudflare's, described above.

#### Still open

- Supabase session and cookie expiry behaviour, to be confirmed against the ROOTS-owned project
  settings rather than inferred from JWT expiry.
- The three Precursor decisions above.
- Any disclosure requirement these findings create that C-04 and C-05 do not already resolve.

---

## D-02 — Effective dates and versions (LEG-03, LEG-04, LEG-05)

**Decision.** Do not assign a separate date or version to these notices unless the controlled
source specifies one. The shared line may be used across the five notices only where C-04
expressly establishes that metadata for the complete legal pack. Identify the controlling
provision.

**Controlling provision.** C-04 document header, page 1:

> ROOTS-AI™ C-04 Website Content & Legal Copy Pack — **Version 1.0.1 CORRECTED**
> Document ID: ROOTS-C04-WEB-001
> Status: APPROVED EXECUTABLE CONTENT RELEASE — CONTROLLED CORRECTION
> **Effective date: 21 July 2026**

The header states one version and one effective date for the pack as a whole. The five notices
are sections of that pack (C-04 §§4–8), so the line describes them without a separate date or
version being assigned to any of them.

**Applied.** `Effective date: 21 July 2026 • Version: 1.0.1.` appears on all five notices. The
provision is recorded in `lib/content/c04-legal.ts` beside the constant, so the basis travels
with the code.

---

## D-03 — Footer

**Decision.** Confirmed. Keep `Educational — Not a Diagnosis · Version 1.0.0` removed. Retain
the approved C-04 footer, copyright and educational/medical boundary statement. Do not replace
the obsolete version with another unreferenced version.

**Applied.** The line is removed from `components/Footer.tsx`. The C-04 §2 boundary statement
and copyright remain. **No version number is displayed in the footer.**

---

## D-04 — Driver and Triad wording

**Decision.** "Strongest area(s)" is not approved: it may suggest the participant's healthiest
areas. Use the supplied wording. Preserve the actual deterministic driver outputs, including
eligibility, ranking, ties and co-primary behaviour. Do not assume a co-primary pair represents
two separate output entries. Follow the controlled null-state rules where no driver is eligible.
Reduced Triad states must reflect only available elements, must not imply causation, and must
not treat biological domains and contextual or protective factors as equivalent.

**Applied** in `lib/report/c03-content.ts`:

| State | Approved wording |
|---|---|
| One driver | "The highest-ranked driver in this assessment is {primary_driver}." |
| Two or three | "The highest-ranked drivers in this assessment are {driver_list}." |
| Triad, two elements | "The available information brings together {first} and {second}." |
| Triad, one element | "Only {first} is available for this view." |
| Triad, none | "Not enough information is available to display this view." |

**Co-primary correction.** The Triad previously expanded a co-primary pair into two separate
elements. It no longer does: each C-02 driver **output entry** contributes one element, so a
co-primary pair appears once, naming both domains. A test asserts this across every golden case
that produces a co-primary output (18 of the 30).

**Unchanged:** eligibility ≥ 25, ranking, the fixed tie order, the no-driver null state, and the
approved relationship note "The diagram shows possible relationships between these areas, not
causes."

### Verification across the whole report

ROOTS direction of 25 September 2026 required the correction to be verified throughout the
report, not only in the Triad, with a state-by-state matrix.

**Audit result.** Every representation derives from the C-02 output entries:

| Component | Source of drivers |
|---|---|
| Canonical report object | `scoring.drivers` — the C-02 output, unchanged |
| Executive Summary (§2) | one label per output entry |
| Key Drivers (§6) | one ranked line per output entry |
| Biological Card (§17) | one label per output entry |
| Biological Triad (§8) | one element per output entry (**corrected**) |
| Stored score row | `primary_driver` holds a co-primary entry whole; `drivers_json` is the output array |
| Web rendering | renders `report.sections` from the stored canonical object |
| PDF rendering | renders the same sections from the same object |

The Triad was the only component that split a co-primary pair. The others already used output
entries.

**State-by-state matrix:** `docs/m3/ROOTS-AI_M3_Driver_State_Matrix.md`, generated by
`npm run evidence:drivers` from the controlled Golden Tests and the real engine and builder —
no row is written by hand. It covers five distinct states across the 30 Golden Tests: no
eligible driver, one entry, two entries, three entries and co-primary outputs.

**Tests:** `tests/report/driverStates.test.ts`, 7 tests:

| Assertion |
|---|
| The canonical object carries the C-02 output unchanged |
| A co-primary entry is never split, duplicated or re-ranked — in any section, the Triad, or the stored score row |
| Key Drivers ranks exactly the entries C-02 returned, in order |
| The no-driver state uses the approved copy and invents nothing |
| No unresolved placeholder survives in any state |
| Every driver count C-02 can produce is covered by the cases |
| Web and PDF read the same canonical sections — no second driver source |

Nothing in C-01, C-02, the engine, the Golden Test expectations or the canonical null behaviour
was changed to make these pass.

**Open.** These strings remain marked for controlled-copy verification until their applicable
C-03 states and content rules have been checked. Implementation of the wording is **not**
treated as completion of that verification.

---

## D-05 — Anonymous visitor consent (OPS-03)

**Decision.** Do not introduce a persistent identifier or server-side visitor tracking solely to
record an anonymous analytics preference. Before browser-only storage is approved as compliant,
provide the exact consent-record structure and requirement mapping, covering consent version,
categories, timestamp and region, as well as withdrawal, changes to consent, and what happens
when browser storage is cleared. Identify any gap rather than omitting it silently or creating a
new tracking mechanism.

**No identifier has been introduced.** Nothing was added in response to OPS-03.

### Consent-record structure

Stored at `localStorage` key `roots-ai.cookie-consent`, defined in
`lib/content/cookie-consent.ts`:

```json
{
  "version": "1.0.1",
  "analytics": false,
  "decidedAt": "2026-09-25T06:53:58.319Z"
}
```

Three fields, and no others. No identifier, no address, no device or network attribute.

### Requirement mapping

| OPS-03 requirement | How it is satisfied | State |
|---|---|---|
| Consent **version** | `version`, compared on every read; a decision recorded against an older notice is discarded and the choice asked again | Satisfied |
| **Categories** | `analytics` — the only optional category in Phase 1. Strictly necessary technologies are not consent-based; advertising and session replay are not used | Satisfied for the optional category |
| **Timestamp** | `decidedAt`, ISO 8601 UTC | Satisfied |
| **Region** | Not captured | **Gap — see (a)** |
| **Withdrawal** | Re-saving with the box cleared writes `analytics: false` with a new timestamp; `analyticsAllowed()` returns false immediately | Satisfied |
| **Changes to consent** | Each decision overwrites the previous one | **Gap — see (b)** |
| **Storage cleared** | The record is gone. The visitor is treated as undecided: the banner is shown again and analytics stay blocked | Conservative, but **gap (c)** |

### Gaps identified

**(a) Region is not captured.** The controlled baseline does not specify how a visitor's region
is to be determined for this purpose, nor which regional distinctions change the consent
requirement. Determining it would mean deriving a location from the request — which is closer to
the tracking the decision prohibits. **ROOTS direction requested:** should region be recorded,
and if so from what source and at what granularity?

**(b) No consent history.** Only the current decision is kept; an earlier acceptance that was
later withdrawn leaves no record. Retaining a history in browser storage would not be reliable
evidence anyway, since the visitor can clear it. **ROOTS direction requested:** is a history
required for anonymous visitors, and if so where can it live without an identifier?

**(c) No durable evidence.** Because the record is in the visitor's own browser, ROOTS cannot
produce evidence that a particular anonymous visitor consented. The conservative failure mode is
implemented — no record means no consent — but the evidential obligation is not met by browser
storage alone. **ROOTS direction requested:** is the conservative failure mode sufficient for
Phase 1, given that no analytics provider is enabled?

**Relevant context.** No analytics provider is enabled in Phase 1, so no consent is currently
acted upon: `analyticsAllowed()` gates a path that nothing uses yet. The gaps become material
when a provider is enabled, which OPS-06 requires ROOTS to approve separately.

### Evidence

`tests/content/cookieConsent.test.ts` — 8 automated tests: blocked before consent, blocked after
refusal, allowed only after explicit acceptance, the three recorded fields, no identifier stored,
a stale consent version discarded, unreadable storage treated as undecided, and analytics as the
only optional category.

---

## Q-01 — Assessment entry CTA label (ASM-01)

**Status:** referred to ROOTS. Not a ROOTS direction; raised by the build.

**The two controlled statements.** C-05 ASM-01 zone 5 names the zone "CTA — Send Secure Link".
C-04 §3 "/assessment — Assessment" gives the page CTA label as "Begin Assessment".

**How it is implemented.** The button reads **Begin Assessment**, from
`ASSESSMENT_ENTRY.cta` in `lib/assessment/copy.ts`, and the action it performs is sending the
secure link. C-04 is the controlled source for participant-facing wording, and C-05 describes
screen structure and behaviour; the C-05 zone name is read as the action, not as the label. The
in-flight state uses `PENDING.sendingLink`.

**Why it is not changed unilaterally.** Substituting "Send Secure Link" would put a string on a
participant-facing screen that does not appear in C-04, which the zero-discretion rule forbids.

**ROOTS decision requested:** confirm that C-04 governs the visible label and that the C-05 zone
name describes the action, or issue the replacement label as a C-04 change.

---

## Q-02 — Report-review wording not yet in C-03

**Status:** implemented as directed; C-03 incorporation referred to ROOTS.

The final report review of 24 September 2026 supplies participant-facing wording that C-03
v1.0.1 does not contain. It has been implemented because the review is a ROOTS instruction, but
C-03 remains the controlled content source, so the strings are listed here for incorporation.

| Review point | String | Source | Where it appears |
|---|---|---|---|
| 3 | "Confidence reflects data completeness, self-reported answer confidence and internal response consistency—not diagnostic certainty." | Supplied verbatim by ROOTS | §5, paragraph |
| 3 | Composite explanation ("…combines these components with fixed weightings. It is not a simple average…") | Drafted to the review's instruction | §5, beneath the component values |
| 4 | "Higher scores indicate greater reported burden within this assessment." | Supplied verbatim by ROOTS | §7, above the bars |
| 5 | "Drivers identify the highest-ranked eligible questionnaire domains; they do not establish biological causation." | Supplied verbatim by ROOTS | §6 |
| 20 | "Scoring input" / "Context only" / "Participant response" | Labels drafted to the review's instruction | §16, per answer |
| 23 | `WHY.*` — six "Why this appeared" strings | Drafted to the review's instruction | §§3, 4, 5, 6 |

**Verification carried out before the wording was used.**

- *Point 3, the classification.* The review asks that 68/100 be confirmed as Moderate-High.
  C-02 "Classifications" gives CONFIDENCE 60-79 = Moderate-High, so it is. The label is derived
  by `band(CLASSIFICATIONS.CONFIDENCE, …)` and is never selected by hand, as the review requires.
- *Point 3, the composite.* C-02 SC-008 weights the three components 0.50 / 0.30 / 0.20, so the
  statement that it is not a simple average is accurate. The weights are not disclosed.
- *Point 4, the direction.* C-02 "Domains" states "Higher scores mean greater self-reported
  burden" and all seven domains share formula SC-001, so the direction is uniform across the
  displayed domains and there is **no conflict to flag**. The review's condition is met.
- *Point 20, the distinction.* "Scoring input" versus "Context only" is taken from the
  controlled C-01 `scoring_eligible` field, not invented by the renderer, so it is "supported by
  the controlled report specification" as the review requires. No weighting or formula is shown.
- *Point 23, the boundary.* Each explanation states only what the controlled rules already
  determine and names no weighting, constant or threshold. The eligible-domain list is read from
  the engine's own `trace.drivers.eligible`, so it cannot drift from DRV-001/002.
- *Point 27, the disclaimer.* The four groups are slices of the approved C-03 §4.19 text.
  `disclaimerGroups()` throws unless re-joining them reproduces that text character for
  character, so the disclaimer is still shown in full and untruncated. No word is rewritten,
  which is why `DISCLAIMER_VERSION` stays at 1.0.0 — only the layout changed.

**ROOTS decision requested:** confirm these strings for incorporation into C-03 at its next
revision, or supply replacements.

### Point 26 — AI wording

The architecture sentence the review supplies ("AI may assist with governed narrative wording
from approved inputs; all authoritative scores, classifications and drivers are produced by the
deterministic engine.") is implemented as `AI_DISCLOSURE` and attached to any section a governed
narrative touches. It has **not** been substituted into the C-03 §4.19 disclaimer, which still
carries the approved sentence "AI may assist with wording, but all scores and classifications
are calculated by deterministic rules." Replacing approved legal copy would require a disclaimer
version change. **ROOTS decision requested:** leave the disclaimer as approved, or replace that
sentence and issue a new disclaimer version.

### Evidence

`tests/report/reviewPoints.test.ts` — 16 automated tests covering points 3, 4, 20 and 23;
points 5 and 27 are asserted in `tests/report/build.test.ts`. Rendered output for both web and
PDF: `npm run evidence:review-render`, which prints the web section objects and writes
`docs/m3/evidence/review-points.pdf`; every added string was confirmed present in the extracted
PDF text, so web and PDF remain at parity (review point 30).

---

## Q-03 — Repetitive domain interpretation language (review point 21)

**Status:** gap flagged to ROOTS, as review point 21 directs.

**What the review asks.** "Please use the approved domain-specific interpretation library so
that each domain has genuinely relevant explanatory language… Do not solve repetition by
allowing unrestricted AI rewriting. If domain-specific approved copy is not available, flag the
gap to ROOTS."

**What is implemented.** Each of the seven domains already carries its own approved meaning
sentence from C-03 (for example "Hunger, craving, fullness and post-meal response patterns"),
so the domains are not interchangeable. The sentence that follows it is the approved
explanation for the *classification* — one of four strings, keyed to Optimized, Compensating,
Strained or Dysregulated — and it is therefore identical across every domain sharing that
classification. That is the repetition the review describes.

**Why it has not been resolved in the build.** C-03 v1.0.1 supplies a per-domain meaning
library and a per-classification explanation library, but no library keyed to domain *and*
classification, which is what non-repeating interpretation copy would require: 7 x 4 = 28
approved strings. Writing them here would be inventing participant-facing clinical-adjacent
content, and the review forbids solving this with AI rewriting. Both routes are closed to the
vendor, so the gap is flagged rather than filled.

**ROOTS decision requested:** supply the 28 domain-by-classification interpretation strings as a
C-03 addition, or confirm that the current meaning-plus-classification pairing is accepted for
Phase 1.

---

## Q-04 — Text-safe variants of the teal and gold accents

**Status:** implemented to meet a binding requirement; token approval referred to ROOTS.

C-05 §13 requires normal text to reach 4.5:1. On a light surface the approved accents reach only
**3.75:1** (teal `#4f8f86`) and **2.36:1** (gold `#c7a45b`), so every place they carried small
text was non-compliant — eleven declarations across the inner pages, the five legal notices, the
contact page, the system screen and the PDF section numbers.

Two variants were derived rather than invented. Each keeps the approved colour's **exact hue and
saturation** and lowers only lightness until it clears the floor with margin:

| Token | Approved | Variant | Hue | Saturation | On white |
|---|---|---|---|---|---|
| `--zd-teal-ink` | `#4f8f86` (3.75:1) | `#437971` | 171.6° unchanged | 0.288 unchanged | 5.01:1 |
| `--zd-gold-ink` | `#c7a45b` (2.36:1) | `#886b2e` | 40.6° unchanged | 0.491 unchanged | 5.04:1 |

`--zd-teal` and `--zd-gold` are unchanged and still used for rules, borders, icons and large
display text, where they already pass. **The home screen needed no change**: its gold sits on
navy at 6.03-6.21:1.

**Why this is referred.** File 14 and the approved Golden Screen govern final visual tokens, so
a new value is ROOTS's to approve even when a binding accessibility clause forces it.
**ROOTS decision requested:** approve these two derived values, or supply replacements that meet
4.5:1.

### Open item on the frozen home screen

`.pilotStatements li::marker` is teal at 3.75:1. It is a list bullet and the statement text
carries the content, so it conveys nothing on its own, and the home screen is client-approved
and frozen — so it was **flagged, not changed**. A one-line change to `--zd-teal-ink` resolves
it if ROOTS wants it resolved.

### Evidence

`docs/m3/ROOTS-AI_M3_Accessibility_Evidence.md` — clause-by-clause against C-05 §13, with the
browser reflow measurements at 320/360/640/768/1024/1440 px and the keyboard and focus results.
`npm run check:a11y` re-runs the static clauses and prints every declared exemption.

---

## Q-05 — Touch targets in the shared site chrome

**Status:** measured, corrected where it is ours to correct, flagged where it is not.

C-05 §5 sets a **44 x 44 px** minimum touch target and the v1.0.1 correction keeps the
touch-target requirement binding. Measuring all 11 public and participant routes at five widths
found five distinct controls below it, all in the shared chrome:

| Control | Size | Where |
|---|---|---|
| Brand logo link (icon only) | 37 x 48 | `components/Header.tsx` |
| Brand logo link (with wordmark) | 143 x 34 / 154 x 36 | `components/Header.tsx` |
| "More" navigation button | 35 x 44 | `components/Header.tsx` |
| "Privacy Notice" footer link | 111 x 20 | `components/Footer.tsx` |

Every one of them still satisfies **WCAG 2.2 AA**, whose clause 2.5.8 sets the minimum at
24 x 24 px; they fall short only of C-05's stricter figure.

**Why they were not changed.** They render inside the shared header and footer, which appear on
the client-approved home screen (PUB-01). Enlarging a hit area moves that approved layout, and
a compliance argument is not a mandate to alter an approved screen. Each is a one-line
`min-height` / `min-width` change once ROOTS confirms the chrome may move.

**What was corrected.** The ASM-01 legal-link row (`Privacy · Terms · Medical Disclaimer ·
AI Disclaimer`) was 26 px tall and is not part of the approved chrome; it now has a 44 px
minimum hit area with no change to its visual spacing.

**ROOTS decision requested:** confirm whether the header and footer may take the four one-line
changes, or accept WCAG 2.2 AA (24 x 24 px) as the operative floor for the shared chrome.

### A measurement artefact worth recording

The first screenshot run used Chrome's `--window-size` flag. On a display with OS scaling that
lays the page out at 484 CSS px and crops the image to 360, so correctly wrapped legal text
appeared cut off at the right edge. It looked like a serious reflow defect and was not one. The
evidence script now sets the viewport through `Emulation.setDeviceMetricsOverride` and asserts
on every row that the layout viewport really is the requested width before trusting anything
else in that row.

### Evidence

`docs/m3/ROOTS-AI_M3_Responsive_Evidence.md` — 55 route/width combinations with 55 full-page
screenshots in `docs/m3/evidence/responsive/`. Re-run with `npm run evidence:responsive`.

---

## Annex D-06 — Security evidence

**Status:** complete. No ROOTS decision outstanding.

The Regulatory Readiness Annex requires, as minimum content for D-06, an "RLS matrix and 12
negative cases, authorization tests, secret/configuration checks and logging review". All four
strands are generated from the implementation by `npm run check:security`, which fails if any
assertion breaks, so the document cannot drift from the system it describes.

| Strand | Result |
|---|---|
| RLS matrix | **77 database probes** — 69 negative and 8 positive controls, against a required minimum of 12 negative |
| Authorization | All 23 API routes mapped to guard, roles, MFA and rate limiting; asserted on every run |
| Secrets and configuration | 6 checks: security headers, clickjacking, committed credentials, Worker vars, secret placement, `.env` exclusion |
| Logging review | 30 audit actions; asserted that none records an answer, free text, classification, narrative, report body, raw email or password |

The positive controls are load-bearing: a suite made only of "must be refused" probes passes
equally well against empty tables, which would prove nothing.

### One assertion we had to correct

The first version of the checker required recent MFA on **every** `/api/v1/admin/**` route and
reported four failures. That was our rule, not the specification's. C-05 requires MFA
re-authentication for specific privileged actions — ADM-06 "Change role — Reason + MFA re-auth
+ audit" and ADM-07 "Publish/rollback with reason and MFA re-auth" — and the implementation
already satisfies it on the role-management route. The three routes reported (resend link,
report retry, export download) are staff- and role-guarded, and the baseline does not require
step-up there. The checker now asserts the requirement C-05 actually states and reports the
remaining MFA posture as evidence. `/api/v1/admin/mfa` is recorded as exempt, since the route
that enrols and verifies the factor cannot require a completed factor to reach it.

### Out of scope, stated so the gaps are not read as passes

No penetration testing of the deployed host. Cloudflare-side controls (WAF, bot management,
rate limiting) are configured in the ROOTS account, outside this repository, and are not
asserted here. The logging review covers what the code records, not a sample of production log
output.

### Evidence

`docs/m3/ROOTS-AI_M3_Security_Evidence.md`, regenerated by `npm run check:security`. The
database suites are `docs/m2/ROOTS-AI_M2_Security_Tests.sql` and
`docs/m3/ROOTS-AI_M3_AI_Boundary_DB_Tests.sql`, both runnable independently in the Supabase SQL
editor; every printed row must read PASS.

---

## Verification state

Restructured per the ROOTS decision of 29 September 2026, which requires that for every affected
item the log distinguish the ROOTS decision, the controlling source or amendment, the
implementation change, the test evidence and the remaining dependency.

An item is **not** recorded as closed merely because it is implemented or passes an internal
test. Anything awaiting ROOTS approval is shown as awaiting, not closed.

| Item | ROOTS decision | Controlling source / amendment | Implementation change | Test evidence | Remaining dependency |
|---|---|---|---|---|---|
| **D-01** Cookie table | Retain C-04 §6 columns; supply the real inventory | C-04 §6 | Unsupported statement removed; nothing about providers or durations published | Inventory verified against the deployed RC, not source alone | `cf_clearance` conditional disclosure; session-cookie duration; **Cloudflare Precursor on protected routes** |
| **D-02** Effective dates and versions | Quote the controlling provision | C-04 header | Shared date/version line cited to the C-04 header | `npm run check:c04` | — |
| **D-03** Footer | Remove the added line | C-04 footer | Line removed; C-04 footer intact | `tests/content/pages.test.ts` | — |
| **D-04** Driver and Triad wording | Apply the co-primary correction across the whole report | C-02 DRV-004; C-03 v1.0.1 §4 | Co-primary treated as one entry everywhere, incl. the Triad and the stored score row | `driverStates.test.ts` — 7 tests over 30 Golden Tests; `evidence:drivers` matrix | C-03 state and content-rule verification of the wording |
| **D-05** Anonymous consent | Record structure and gaps | Annex OPS-03 | Consent record with version, categories, timestamp; no identifier stored | `cookieConsent.test.ts` — 8 tests | Region, consent history, durable evidence — gaps (a)(b)(c) |
| **Item 1** ASM-01 CTA | "Begin Assessment" confirmed | C-04 §3 | None required | `check:c04` 227/227; six C-05 zones present | Secure-link journey evidence |
| **Item 2** Report wording, C-03 traceability, point 26 | Retain corrections; prepare a controlled amendment; retain §4.19 and its version | C-03 v1.0.1 preserved + **Amendment A1** | Points 3, 4, 5, 20, 23 implemented; point 26 in governed-narrative context only | `reviewPoints.test.ts` (16), `build.test.ts`, `check:parity` | **ROOTS approval of Amendment A1** |
| **Item 3** Accessible text colours | Authorized in principle; values are candidates | C-05 §13 | `--zd-teal-ink`, `--zd-gold-ink` applied to 14 text declarations; accents retained for non-text | `check:tokens` (before/after, all surfaces, interaction states); `check:a11y` (286 declarations) | **ROOTS contrast and visual verification** |
| **Item 4** Touch targets | Retain 44 × 44 px; correct them | C-05 §5 | Four controls corrected with a centred overlay; visible boxes unchanged; ASM-01 legal links to 44 px | `evidence:responsive` — effective bounds at 6 widths, overlap checked | One isolated case: the inline consent link |
| **Item 5** Section 7 paragraphs | Not approved; supply field-by-field evidence | C-03 §4.7, §2; C-05 §13 | No paragraph deleted; bar graphic now `aria-hidden` to remove a duplicate announcement | `evidence:section7` — 179 field comparisons | **ROOTS retains the approval decision** |
| **Item 6** Point 21 | Keep open; no waiver | C-03 §3 | **None** — approved wording retained | `evidence:point21` — 28 combinations | **ROOTS to determine which combinations need content** |
| **Annex D-06** Security | — | Regulatory Readiness Annex D-06 | RLS role grants, route guards, header policy | `check:security` — 77 probes, 23 routes, 6 config checks, 30 audit actions | Penetration testing and Cloudflare-side controls out of scope |
| **§12** Performance | — | Master Requirements §12 | No change; measured against the production build | `evidence:performance` — report generation 30/30 within 15 s, p95 1.2 s | Agreed production-like conditions, representative load, staging dataset |
| **C-07** Traceability | — | C-07 v1.0.1 editable derivative | Vendor columns completed for all 594 rows | `evidence:c07` — 558 mapped, 36 out-of-scope | Reviewer disposition column is ROOTS' |
| **Submission** | Evidence to form part of the submission | Decision of 29 Sep 2026 | 18 evidence documents indexed | `evidence:submission` | **Commit reference: the project is not yet tracked in a ROOTS-owned repository** |
