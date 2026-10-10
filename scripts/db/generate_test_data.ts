/**
 * Synthetic test data for performance and load testing.
 *
 *     npm run db:test-data -- --profiles 100000 --out ./test-data --seed 1
 *
 * ROOTS review of 29 September 2026, item 12. The §12 admin-query budget is conditioned on
 * 100,000 records, and there is no lawful way to get 100,000 records except to make them.
 *
 * ## Three properties that matter more than the volume
 *
 * **Nothing here is derived from a real person.** Every address is `@synthetic.invalid`, a domain
 * that cannot receive mail; every display name states what it is; and the answers come from a
 * seeded generator, not from a sample. There is no anonymisation step because there is nothing to
 * anonymise.
 *
 * **The scores are real.** Answers are generated, then run through the delivered C-02 engine, so
 * every row holds a score the engine actually produces for the answers beside it. A dataset of
 * random numbers in the score columns would exercise the indexes and miss everything about how
 * the console behaves on realistic distributions — and would be useless for anything but timing.
 *
 * **It is reproducible.** Same seed, same dataset, byte for byte. A load test that cannot be
 * repeated against the same data cannot be used to prove a fix.
 *
 * ## What it writes
 *
 * CSV files for `COPY`, one per table, plus `load.sql`. It writes files and prints instructions;
 * it connects to nothing. Loading them into a staging project is a deliberate act by someone with
 * the credentials, which is the point.
 */

import { createWriteStream, mkdirSync, writeFileSync, type WriteStream } from 'node:fs';
import { join } from 'node:path';
import { computeScores, ScoringInputError, type NormalizedInput } from '../../lib/scoring/engine';
import { toScoresRow } from '../../lib/scoring/scoresRow';
import { QUESTIONS } from '../../lib/assessment/questionBank';

/** A seeded PRNG (mulberry32). Deterministic across platforms and Node versions. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A deterministic UUID v4-shaped identifier from the generator, so reruns produce the same IDs. */
function uuid(next: () => number): string {
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 32; i += 1) {
    if (i === 12) out += '4';
    else if (i === 16) out += hex[(Math.floor(next() * 16) & 0x3) | 0x8];
    else out += hex[Math.floor(next() * 16)];
    if (i === 7 || i === 11 || i === 15 || i === 19) out += '-';
  }
  return out;
}

/**
 * The scores columns written, in order. Everything but the timestamps comes from `toScoresRow`,
 * which is the mapping the application itself uses.
 */
const SCORE_COLUMNS = [
  'assessment_id',
  'mr_score', 'hs_score', 'sr_score', 'ch_score', 'sl_score', 'ib_score', 'bs_score',
  'biological_state', 'opportunity_score', 'recovery_potential', 'confidence', 'confidence_label',
  'protective_count', 'primary_driver', 'secondary_driver', 'tertiary_driver',
  'evidence_strength', 'dataset_id', 'scoring_version', 'created_at', 'updated_at',
];

const columnDefault = (column: string, at: string): unknown =>
  column === 'created_at' || column === 'updated_at' ? at : null;

interface Options {
  profiles: number;
  out: string;
  seed: number;
}

function options(): Options {
  const argv = process.argv.slice(2);
  const read = (flag: string, fallback: string) => {
    const i = argv.indexOf(flag);
    return i === -1 ? fallback : argv[i + 1];
  };
  return {
    profiles: Number(read('--profiles', '1000')),
    out: read('--out', join(process.cwd(), 'test-data')),
    seed: Number(read('--seed', '1')),
  };
}

/** CSV escaping for Postgres COPY ... WITH (FORMAT csv). */
const cell = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const s = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /["\n,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const row = (values: unknown[]) => values.map(cell).join(',') + '\n';

/** The 40 scored items the engine expects, read from C-01 rather than hard-coded. */
const SCORED = QUESTIONS.filter((q) => q.scoring_eligible).map((q) => q.question_id);
const ALL_QUESTIONS = QUESTIONS.map((q) => q.question_id);

/**
 * One participant's answers.
 *
 * The distribution is the point: a dataset where every row scores the same exercises an index but
 * tells you nothing about the console. Five profiles are used, in the proportions a pilot might
 * plausibly see, and about one in twelve leaves enough unanswered to drive a domain below the
 * C-02 coverage floor — which is what produces the null-bearing rows the admin screens must still
 * render.
 */
function answers(next: () => number): { input: NormalizedInput; missing: Set<string> } {
  const profile = next();
  const centre = profile < 0.2 ? 0.5 : profile < 0.45 ? 1.4 : profile < 0.75 ? 2.2 : profile < 0.93 ? 3.0 : 3.6;
  const sparse = next() < 0.085;
  const missing = new Set<string>();

  const input = {
    age: 18 + Math.floor(next() * 60),
    diseaseCount: next() < 0.06 ? null : Math.floor(next() * 4),
    medicationCount: next() < 0.06 ? null : Math.floor(next() * 4),
    P1: next() < 0.45,
    P2: next() < 0.5,
    P3: next() < 0.4,
    P4: next() < 0.7,
    P5: next() < 0.6,
    answerConfidence: [25, 50, 75, 100][Math.floor(next() * 4)],
  } as NormalizedInput;

  for (const id of SCORED) {
    if (sparse && next() < 0.45) {
      (input as unknown as Record<string, unknown>)[id] = null;
      missing.add(id);
      continue;
    }
    const jitter = (next() - 0.5) * 1.6;
    (input as unknown as Record<string, unknown>)[id] = Math.max(0, Math.min(4, Math.round(centre + jitter)));
  }
  return { input, missing };
}

function main(): void {
  const opts = options();
  mkdirSync(opts.out, { recursive: true });
  const next = rng(opts.seed);

  const files: Record<string, WriteStream> = {};
  const open = (name: string, header: string) => {
    const stream = createWriteStream(join(opts.out, `${name}.csv`), 'utf8');
    stream.write(header + '\n');
    files[name] = stream;
    return stream;
  };

  const users = open('auth_users', 'id,email');
  const profiles = open('profiles', 'id,email,display_name,status,locale,created_at,updated_at');
  const assessments = open(
    'assessments',
    'id,profile_id,questionnaire_version,status,current_module,progress_percent,started_at,last_saved_at,submitted_at,submission_reference,created_at,updated_at',
  );
  const responses = open('responses', 'assessment_id,question_id,raw_value,normalized_value,is_na,validation_state,source_version,answered_at');
  const scores = open('scores', SCORE_COLUMNS.join(','));
  const reports = open('reports', 'assessment_id,report_version,status,report_reference,generated_at,created_at,updated_at');

  const START = Date.UTC(2026, 6, 1);
  const DAY = 86_400_000;
  let submitted = 0;
  let withNullState = 0;
  let responseRows = 0;

  for (let i = 0; i < opts.profiles; i += 1) {
    const userId = uuid(next);
    const serial = String(i + 1).padStart(6, '0');
    const email = `synthetic.${serial}@synthetic.invalid`;
    const createdAt = new Date(START + Math.floor(next() * 120 * DAY)).toISOString();

    users.write(row([userId, email]));
    profiles.write(row([userId, email, `Synthetic Participant ${serial}`, 'active', 'en-GB', createdAt, createdAt]));

    // Most participants finish; some are still in progress, which is what the console has to show.
    const finished = next() < 0.82;
    const assessmentId = uuid(next);
    const startedAt = new Date(Date.parse(createdAt) + Math.floor(next() * DAY)).toISOString();
    const savedAt = new Date(Date.parse(startedAt) + Math.floor(next() * 3600_000)).toISOString();

    const { input, missing } = answers(next);
    let result: ReturnType<typeof computeScores> | null = null;
    if (finished) {
      try {
        result = computeScores(input);
      } catch (e) {
        if (!(e instanceof ScoringInputError)) throw e;
        // A generated input the engine refuses is a generator fault, not a dataset feature.
        throw new Error(`generated an input the C-02 engine refuses at row ${i}: ${e.message}`);
      }
    }

    const module_ = finished ? 13 : 1 + Math.floor(next() * 12);
    const progress = finished ? 100 : Math.floor((module_ / 13) * 100);
    const reference = finished ? `RS-20260701-${serial}${Math.floor(next() * 90 + 10)}` : null;

    assessments.write(
      row([
        assessmentId, userId, '1.0.1', finished ? 'submitted' : 'in_progress', module_, progress,
        startedAt, savedAt, finished ? savedAt : null, reference, startedAt, savedAt,
      ]),
    );

    // Answers. An unfinished assessment has only the modules it reached.
    const answeredQuestions = finished ? ALL_QUESTIONS : ALL_QUESTIONS.slice(0, Math.ceil((module_ / 13) * ALL_QUESTIONS.length));
    for (const qid of answeredQuestions) {
      const isNa = missing.has(qid);
      const value = isNa ? null : ((input as unknown as Record<string, unknown>)[qid] ?? Math.floor(next() * 5));
      responses.write(row([assessmentId, qid, JSON.stringify(value), JSON.stringify(value), isNa, 'valid', '1.0.1', savedAt]));
      responseRows += 1;
    }

    if (result) {
      submitted += 1;
      if (result.biological_state === null) withNullState += 1;
      // The delivered mapping, so a synthetic row is shaped exactly like one the application writes.
      const scoreRow = toScoresRow(assessmentId, result, {});
      scores.write(row(SCORE_COLUMNS.map((column) => (column in scoreRow ? scoreRow[column] : columnDefault(column, savedAt)))));
      reports.write(row([assessmentId, '1.0.1', 'completed', `RPT-20260701-${serial}`, savedAt, savedAt, savedAt]));
    }
  }

  for (const stream of Object.values(files)) stream.end();

  writeFileSync(
    join(opts.out, 'load.sql'),
    LOADER.replace('{{SEED}}', String(opts.seed)).replace('{{PROFILES}}', String(opts.profiles)),
    'utf8',
  );

  console.log(`wrote ${opts.out}`);
  console.log(`  profiles       ${opts.profiles}`);
  console.log(`  assessments    ${opts.profiles} (${submitted} submitted, ${opts.profiles - submitted} in progress)`);
  console.log(`  responses      ${responseRows}`);
  console.log(`  scores         ${submitted}, of which ${withNullState} with a null Biological State`);
  console.log(`  reports        ${submitted}`);
  console.log(`  seed           ${opts.seed} — rerun with the same seed for the same dataset`);
  console.log('\nLoad with load.sql, against a NON-PRODUCTION project. It refuses to run otherwise.');
}

const LOADER = `-- ROOTS-AI synthetic test data (seed {{SEED}}, {{PROFILES}} profiles).
-- Generated by: npm run db:test-data
--
-- This is synthetic data for performance testing. Every address is @synthetic.invalid and no
-- value is derived from a real person.
--
-- Run against a NON-PRODUCTION project only. The guard below is a guard, not a permission system:
-- set roots.allow_synthetic_load = 'yes' on the staging project deliberately, and never on
-- production.

DO $$
BEGIN
  IF current_setting('roots.allow_synthetic_load', true) IS DISTINCT FROM 'yes' THEN
    RAISE EXCEPTION 'refusing to load synthetic data: set roots.allow_synthetic_load = ''yes'' on this project first';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE email NOT LIKE '%@synthetic.invalid' LIMIT 1) THEN
    RAISE EXCEPTION 'refusing to load synthetic data: this project already holds non-synthetic profiles';
  END IF;
END
$$;

-- auth.users first: profiles reference it, and the on_auth_user_created trigger would otherwise
-- create the profile rows itself with different values.
ALTER TABLE public.profiles DISABLE TRIGGER ALL;

\\copy auth.users (id, email) FROM 'auth_users.csv' WITH (FORMAT csv, HEADER true)
\\copy public.profiles FROM 'profiles.csv' WITH (FORMAT csv, HEADER true)
\\copy public.assessments (id, profile_id, questionnaire_version, status, current_module, progress_percent, started_at, last_saved_at, submitted_at, submission_reference, created_at, updated_at) FROM 'assessments.csv' WITH (FORMAT csv, HEADER true)
\\copy public.responses (assessment_id, question_id, raw_value, normalized_value, is_na, validation_state, source_version, answered_at) FROM 'responses.csv' WITH (FORMAT csv, HEADER true)
\\copy public.scores (assessment_id, mr_score, hs_score, sr_score, ch_score, sl_score, ib_score, bs_score, biological_state, opportunity_score, recovery_potential, confidence, confidence_label, protective_count, primary_driver, secondary_driver, tertiary_driver, evidence_strength, dataset_id, scoring_version, created_at, updated_at) FROM 'scores.csv' WITH (FORMAT csv, HEADER true)
\\copy public.reports (assessment_id, report_version, status, report_reference, generated_at, created_at, updated_at) FROM 'reports.csv' WITH (FORMAT csv, HEADER true)

ALTER TABLE public.profiles ENABLE TRIGGER ALL;

ANALYZE public.profiles;
ANALYZE public.assessments;
ANALYZE public.responses;
ANALYZE public.scores;
ANALYZE public.reports;

-- Removing it again. Nothing else is touched, because nothing else should be there.
-- DELETE FROM auth.users WHERE email LIKE '%@synthetic.invalid';
`;

main();
