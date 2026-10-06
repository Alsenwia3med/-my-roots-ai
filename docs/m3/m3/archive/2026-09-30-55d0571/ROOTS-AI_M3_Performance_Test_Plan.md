# ROOTS-AI™ — performance test plan (Master Requirements §12)

Prepared in response to the ROOTS review of 29 September 2026, item 11.

## Why this exists

Seven of the §12 budgets are not evidenced, and the reason is the same for all of them: §12
conditions them on *"mutually agreed production-like conditions"*, *"agreed representative load"*,
*"agreed filters/indexes"* and a staging dataset. None of those has been agreed, so there is
nothing to measure against.

That has been stated as a dependency. A dependency with no plan behind it does not clear, so this
is the plan: the method for each metric, and — more usefully — **a specific proposal for each of
the conditions**, so that ROOTS can accept or amend rather than compose them.

Nothing here asks ROOTS to run anything. What is needed from ROOTS is agreement.

## What is already evidenced, and is not in scope here

| §12 metric | Status |
|---|---|
| Report generation ≤15 s for ≥95% of cases | **Evidenced.** 30 of 30 controlled Golden Tests, slowest 1.2 s, in `ROOTS-AI_M3_Performance_Evidence.md`. Not conditioned on agreement: the cases are the controlled ones. |
| Governed fallback on provider timeout | **Evidenced.** `tests/ai/outcomes.test.ts`, the timeout case. |

Everything below is one of the seven that cannot be.

---

## 1. The conditions we propose ROOTS agree

Each is a proposal. Amend any of them and the plan stands; what it cannot do is proceed without
them.

### 1.1 Environment

| | Proposed |
|---|---|
| Application | The delivered build, deployed exactly as production is deployed — Cloudflare Workers, same runtime, same configuration, same region routing. |
| Database | A Supabase project of the same plan and region as production, seeded per §1.4. **Not the production project**, and not a project holding real participant data. |
| Distinctness | Separate project, separate credentials, no shared secrets with production. |
| Warm | Measurements taken after a warm-up pass that is discarded, because a Worker's first request after idle includes start-up that a participant in a session does not meet. Cold-start is reported separately rather than folded into the budget. |
| Client | A machine on a fixed broadband connection, not a developer laptop on Wi-Fi. Network conditions outside the service boundary are excluded, as §12 permits for save response. |

**Why a separate project.** We do not query the client's database, and a load test writes. Running
this against production would put synthetic assessments in the real dataset.

### 1.2 Load profile

§12 says *"agreed representative load"* without naming a number. Pilot scale is what should decide
it, so this is proposed from the pilot rather than from a round figure:

| | Proposed |
|---|---|
| Concurrent participants | **25**, each in an assessment, answering at a human pace (one answer every 4–8 seconds with jitter). |
| Duration | 20 minutes at steady state, which is longer than one assessment takes, so every participant completes at least one full journey. |
| Ramp | 2 minutes to reach 25, to avoid measuring a thundering herd that will not happen. |
| Concurrent admins | 2, running the heaviest console queries continuously. |
| Report generations | 1 every 30 seconds throughout, so PDF rendering overlaps the interactive load rather than being measured in isolation. |

**If ROOTS expects a different pilot size, this number should change and nothing else does.** We
would rather measure the right load than a large one.

### 1.3 Percentiles and runs

| | Proposed |
|---|---|
| Percentile | p95 over the steady-state window only; ramp-up and ramp-down discarded. |
| Runs | Three complete runs. The reported figure is the **worst** of the three, not the mean. |
| Failure | Any run with an error rate above 0.5% is void and reported as void, not averaged away. |
| Timing points | Server-side timing for API metrics; browser Navigation Timing for page load. Both recorded, because a gap between them is itself a finding. |

### 1.4 Dataset

§12 conditions the admin-query metric on 100,000 records.

| | Proposed |
|---|---|
| Volume | 100,000 assessments with their responses, scores and reports, plus 100,000 profiles. |
| Composition | Distributed across the states the Golden Tests cover, not 100,000 copies of one case, so index behaviour is realistic. |
| Source | Generated synthetically by us. **No real participant data, and no data derived from any real person.** |
| Filters | The console's own filters, exercised at their heaviest — unbounded date range, no status filter, sorted by the column the schema does not index by default. |

The generator is a separate deliverable: `ROOTS-AI_M3_Synthetic_Test_Data.md`. It is written so
the dataset can be rebuilt from a seed, which is what makes a run repeatable.

---

## 2. Method, metric by metric

### 2.1 Public and assessment page load ≤2 s

| | |
|---|---|
| Measured | Navigation Timing `loadEventEnd - startTime`, in a real browser, on a cold cache and again on a warm one. |
| Where | The five public routes, `/assessment`, and the assessment shell at a mid-questionnaire module. |
| Under | The §1.2 load, concurrently. A page-load figure taken on an idle system is not the one that matters. |
| Passes if | p95 ≤ 2 s for every route, cold cache. |
| Produces | A row per route per condition, plus the full timing breakdown so a failure can be attributed to server time, transfer or render. |

### 2.2 Save response p95 ≤500 ms

| | |
|---|---|
| Measured | Server-side, from request received to response written, on `PATCH /api/v1/assessments/{id}/responses`. Recorded client-side too. |
| Under | The §1.2 load, which is what generates the saves. |
| Passes if | p95 ≤ 500 ms server-side across the steady-state window. |
| Note | §12 permits network conditions outside the service boundary to be excluded, so the server-side figure is the acceptance one and the client-side figure is reported beside it. |

### 2.3 Next-question interaction ≤300 ms

| | |
|---|---|
| Measured | From the click that answers a question to the next question being interactive, in the browser. Local validation runs before the save, so this is not the save round trip. |
| Under | The §1.2 load. |
| Passes if | p95 ≤ 300 ms. |
| Note | Autosave is asynchronous by design; if that changes, this metric and 2.2 stop being independent and both must be re-run. |

### 2.4 Non-AI API endpoints p95 ≤500 ms

| | |
|---|---|
| Measured | Server-side, every non-AI route the journey touches: session, assessment create/resume, responses, submit, score, report retrieval, health. |
| Under | The §1.2 load. |
| Passes if | p95 ≤ 500 ms **per route**, not aggregated. An aggregate hides a slow route behind a fast one called more often. |
| Produces | A row per route with call count, p50, p95, p99 and max. |

### 2.5 Admin queries ≤3 s at 100,000 records

| | |
|---|---|
| Measured | Server-side, per console query, against the §1.4 dataset. |
| Which | Participants list, reports list, audit log — each at its first page, a deep page, and with the heaviest filter combination. |
| Under | The §1.2 admin load, concurrent with participant load. |
| Passes if | ≤3 s for every query, at every page tested. Not a percentile: §12 states a ceiling. |
| Produces | The query plan alongside the timing, so a failure says whether an index is missing rather than only that it was slow. |

### 2.6 Report display ≤2 s after authorized retrieval

| | |
|---|---|
| Measured | From authenticated request to the report being readable in the browser, for a participant with a stored report. |
| Excludes | Report *generation*, which is a separate budget and is already evidenced. This measures retrieval and display of an existing report. |
| Passes if | p95 ≤ 2 s. |

### 2.7 Availability 99.9% monthly

Not a build-time measurement, and no plan can make it one. It needs a production month with
uptime monitoring in place.

| | |
|---|---|
| Needs | An agreed monitoring service, an agreed probe (which endpoint, from where, how often), and an agreed definition of downtime. |
| Proposed probe | `GET /api/v1/health` from three regions, every 60 seconds; a check fails on non-200 or >5 s. |
| Proposed definition | Downtime is any minute with a majority of failed probes. 99.9% monthly allows 43 minutes. |
| Reported | Monthly, during warranty and support. |

---

## 3. Who supplies what

| | ROOTS | Vendor |
|---|---|---|
| Agreement to the §1 conditions, or amendments | ✔ | |
| Expected pilot concurrency, if not 25 | ✔ | |
| A non-production Supabase project of production spec | ✔ | |
| Monitoring service for availability | ✔ | |
| Synthetic dataset generator and the dataset | | ✔ |
| Load scripts, measurement harness, evidence documents | | ✔ |
| Running the tests and reporting failures | | ✔ |

## 4. Sequence

1. ROOTS accepts or amends §1. **Everything else is blocked on this, and only this.**
2. Staging project provisioned and the delivered build deployed to it.
3. Dataset generated and verified for volume and distribution.
4. Dry run at low concurrency to prove the harness measures what it claims.
5. Three full runs. Worst result reported.
6. Evidence regenerated into `ROOTS-AI_M3_Performance_Evidence.md`, replacing the *Metrics that
   cannot yet be evidenced* section with measurements.
7. Any breach investigated and re-run after the fix; the original and the re-run are both kept.

## 5. What would make a run invalid

Stated in advance, so that a failing run cannot be explained away afterwards:

- error rate above 0.5%;
- the dataset not at the agreed volume or distribution;
- a build other than the delivered commit;
- the staging environment differing from production in runtime, plan or region;
- cold-start included in a steady-state figure;
- fewer than three completed runs.

## 6. Honest limits of this plan

**Staging is not production.** Same runtime, same plan, same region, different traffic and
different data. It is the closest thing that can be measured without testing against real
participants, and the gap should be read as real.

**Synthetic load is not human load.** Participants pause, re-read, go back and abandon. The 4–8
second pacing approximates this; it does not reproduce it.

**Three runs is a small sample.** Enough to catch a systematic breach, not enough to characterise
a tail. Where a metric passes narrowly, the plan is to say so rather than to report a pass.
