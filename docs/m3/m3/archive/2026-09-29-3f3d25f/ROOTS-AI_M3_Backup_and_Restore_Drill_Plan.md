# ROOTS-AI™ — backup and restore drill plan

Prepared in response to the ROOTS review of 29 September 2026, item 13. **This is a plan. Nothing
in it has been executed**, and the drill it describes cannot be run from a development machine.

## What the controlled baseline requires

| Source | Requirement |
|---|---|
| Master Requirements §7 security baseline | "Daily automated database backups, minimum 30-day retention, PITR where supported, documented quarterly restore test" |
| Master Requirements §13.1, suite 11 | "Backup/restore — Backup configuration evidence and one successful pre-launch restore test" |
| Master Requirements AC-12 | "Daily backup, 30-day retention, applicable PITR and a successful restore are evidenced" |
| Deliverables 12 / E-09 | "Backup, retention and restore evidence" |

Two separate obligations, and they are often conflated:

1. **Configuration evidence** — that backups are running, at the right frequency, with the right
   retention, with PITR where the plan supports it. Available from the provider console today.
2. **A successful restore test** — that a backup can actually be turned back into a working
   system. Only a drill produces this, and a backup nobody has restored is a hypothesis.

## Why this is a plan and not evidence

The drill restores production data into a recovered environment. Doing that requires production
credentials and a provider account, which the vendor does not hold and should not: the operator
runs it. The plan is written so that whoever runs it produces evidence that answers AC-12 without
having to decide what to capture.

**Read this alongside** `ROOTS-AI_M3_Performance_Test_Plan.md`, which provisions a staging project
for a different reason. The same project can host this drill.

---

## Part 1 — Configuration evidence

Captured once, before the drill, and re-captured whenever the plan or region changes.

| # | What to evidence | Where | Acceptance |
|---|---|---|---|
| 1.1 | Daily automated backups enabled | Supabase project → Database → Backups | Schedule shown, with the time of day and the time zone |
| 1.2 | Retention ≥ 30 days | Same page | The retention setting, and the oldest backup actually listed |
| 1.3 | PITR enabled, or not supported on this plan | Same page | Either the PITR window, or the plan's own statement that it is unavailable. **"Where supported" is a real condition; if the plan does not support PITR, evidence that and say which plan would.** |
| 1.4 | Most recent backup succeeded | Backup list | Timestamp and status of the latest, plus the last 7 days with no gaps |
| 1.5 | Region | Project settings | The region, and that it matches what the processor register records |
| 1.6 | Who can restore | Organisation members | The list of accounts with permission, and MFA on each |

Each is a screenshot with the URL and the capture date visible, filed under
`docs/m3/evidence/backup/`.

**1.3 is the one to watch.** PITR is not on every Supabase plan. If it is unavailable, the honest
statement is that the baseline's "where supported" condition is not met on the current plan, with
the upgrade that would meet it — not silence.

---

## Part 2 — The restore drill

### 2.1 Before

| | |
|---|---|
| Target | A **separate** project, never production. The performance-test staging project is suitable. |
| Source | The most recent daily backup of production. |
| Announce | The operator confirms in writing, before starting, that the restore target is not production and carries no real participant data of its own. |
| Record | The backup's timestamp and identifier, before anything is restored. |

### 2.2 The drill

| # | Step | Evidence to capture |
|---|---|---|
| 2.1 | Note the source backup's timestamp and ID | The backup list entry |
| 2.2 | Start the restore into the target project | Start time, to the second |
| 2.3 | Wait for completion | End time. **Elapsed time is the recovery time objective, measured rather than estimated** |
| 2.4 | Run `npm run db:verify` against the restored project | Its 12/12 output — the schema is intact, not merely present |
| 2.5 | Run both SQL probe suites (`npm run db:probes` equivalent, in the SQL editor) | 98/98 — RLS and grants survived the restore, which is the part most likely to be lost |
| 2.6 | Row counts for `profiles`, `assessments`, `responses`, `scores`, `reports`, `audit_logs`, `consents` | Counts from the restored project beside the same counts from production at the backup timestamp |
| 2.7 | Point the delivered build at the restored project and sign in | A working session |
| 2.8 | Open one report end to end | The report renders, its values match the stored canonical JSON, its checksum still verifies |
| 2.9 | Confirm the audit trail survived | The oldest and newest `audit_logs` rows, and the count |
| 2.10 | Destroy the restored copy | Confirmation of deletion, timestamped |

### 2.3 Acceptance

The drill passes only if **all** of these hold:

- the restore completed without manual repair;
- `db:verify` is 12/12 and the probe suites are 98/98;
- every row count matches production at the backup timestamp, exactly — **not approximately**;
- a participant can sign in and read their report from the restored copy;
- the audit trail is complete over its retention window;
- the elapsed time is recorded, whatever it was.

**Elapsed time is recorded, not judged.** Neither the Master Requirements nor the annex states a
recovery time objective. The drill's job is to produce the number; agreeing whether it is
acceptable is ROOTS'. If ROOTS wants an RTO, it should be set after the first measurement rather
than before.

### 2.4 What a failure means

A failed drill is the point of running one, and is reported as a finding with the same weight as a
defect: what failed, at which step, what was lost, and what configuration change would prevent it.
A drill that is repeated until it passes and only the passing run reported is not evidence. **Every
run is kept, including the failures.**

---

## Part 3 — Quarterly repetition

The §7 baseline requires the restore test to be *documented quarterly*, so the drill is not a
one-off.

| | |
|---|---|
| Frequency | Quarterly, and additionally after any change to the database plan, region or schema version |
| Scope | The full Part 2 procedure. A shortened check does not satisfy "restore test" |
| Record | One document per drill, dated, kept — so a trend in the elapsed time is visible |
| Owner | The operator holding production credentials |

---

## Part 4 — What is needed, and from whom

| | ROOTS / operator | Vendor |
|---|---|---|
| Provider console access and production credentials | ✔ | |
| Confirmation of the plan tier, and whether PITR is available | ✔ | |
| A non-production project to restore into | ✔ | |
| Running the drill | ✔ | |
| This plan, the verification scripts it uses, and the evidence template | | ✔ |
| Reviewing the results and investigating any failure | | ✔ |

**Vendor support on request.** We can attend the drill, interpret the probe output and write it
up. What we cannot do is hold the credentials.

## Status

| | |
|---|---|
| Configuration evidence | **Not captured.** Needs provider console access |
| Restore drill | **Not run.** Blocked on a target project and credentials |
| §13.1 suite 11 | **Outstanding**, and recorded as such rather than as complete |
| AC-12 | **Not satisfiable before the drill** |

This is the only one of the eleven §13.1 suites that cannot be satisfied from a repository. The
other ten are automated and re-runnable; this one needs someone with production access to do
something and write down what happened.
