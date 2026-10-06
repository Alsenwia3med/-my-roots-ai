# ROOTS-AI™ — synthetic test data

Prepared in response to the ROOTS review of 29 September 2026, item 12.

**Generator:** `scripts/db/generate_test_data.ts` — `npm run db:test-data`.

## Why it exists

Master Requirements §12 conditions the admin-query budget on **100,000 records**. There is no
lawful way to obtain 100,000 participant records, and no acceptable way to use real ones for load
testing, so the dataset has to be made. The
[performance test plan](ROOTS-AI_M3_Performance_Test_Plan.md) depends on it.

## Three properties that matter more than the volume

**Nothing is derived from a real person.** Every address is at `@synthetic.invalid`, a domain that
cannot receive mail and cannot be registered. Every display name reads *Synthetic Participant
000001*. Answers come from a seeded generator, not from a sample of anything. There is no
anonymisation step in the generator because there is nothing to anonymise — the data never had a
subject.

**The scores are genuine.** Answers are generated, then run through the delivered C-02 engine, and
the row is built by `toScoresRow` — the same function the application uses when it writes a real
score. So each row holds the score the engine actually produces for the answers next to it, with
the same shape, the same nulls and the same co-primary driver strings. Random numbers in the score
columns would exercise an index and tell you nothing about how the console behaves.

**It is reproducible.** The same seed produces the same dataset, byte for byte, verified by
generating twice and comparing. A load test that cannot be repeated against the same data cannot
be used to prove a fix.

## What it produces

    npm run db:test-data -- --profiles 100000 --seed 1 --out ./test-data

Six CSVs for `COPY`, and a `load.sql` that loads them.

| File | Rows at 100,000 profiles | Notes |
|---|---|---|
| `auth_users.csv` | 100,000 | ID and address only |
| `profiles.csv` | 100,000 | |
| `assessments.csv` | 100,000 | about 82% submitted, the rest in progress at a random module |
| `responses.csv` | ~6.7 million | 73 answers for a finished assessment; fewer for one in progress |
| `scores.csv` | ~82,000 | one per submitted assessment |
| `reports.csv` | ~82,000 | |

The generator writes files and prints instructions. **It connects to nothing.** Loading the data
is a separate, deliberate act by someone holding staging credentials.

## The distribution, and why it is not uniform

A dataset where every row scores the same exercises an index and reveals nothing about the
console. The generator uses five burden profiles in proportions a pilot might plausibly show, and
about one participant in twelve leaves enough unanswered to drive a domain below the C-02 coverage
floor. That produces the rows that matter most for testing: **null Biological State, null
Opportunity, co-primary drivers, no eligible driver, and assessments still in progress.**

At a 200-profile sample: 165 submitted, 11 of them with a null Biological State, and co-primary
drivers appearing in the first two rows. Those are the states the admin screens and the report
renderer have to handle, and a uniform dataset would contain none of them.

## Safety

The generator cannot write to a database. `load.sql` can, so it carries two guards:

1. It refuses unless `roots.allow_synthetic_load` is set to `yes` on the target project — a
   setting someone applies deliberately to staging and never to production.
2. It refuses if the project already holds any profile whose address is not
   `@synthetic.invalid`, which is true of every project with a real participant in it.

Neither is a permission system. They are there so that a mistyped connection string fails loudly
instead of quietly inserting 100,000 rows into the wrong database.

Removal is one statement, commented at the foot of `load.sql`: deleting the synthetic users
cascades to everything else, because every table keys back to `auth.users`.

## Limits

**Synthetic answers are not human answers.** The generator produces plausible distributions, not
real response patterns. It is adequate for measuring how the system behaves at volume; it is not
a research dataset and must never be used as one.

**Free text is not generated.** Q73 is left empty. Generating plausible free text would create
prose that reads as if a person wrote it about their health, which is not something a test fixture
should contain.

**It does not test the AI path.** No narrative is generated for synthetic reports. The governed
narrative is measured separately, against its own timeout budget.
