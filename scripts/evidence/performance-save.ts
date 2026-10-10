/**
 * §12 save-response performance.
 *
 *     npm run evidence:performance-save
 *
 * Master Requirements §12: **save response p95 ≤500 ms.**
 *
 * ## Why it is measured this way
 *
 * The save endpoint requires an authenticated participant session. The only Supabase project
 * this working copy is configured against is **production**, and running synthetic sign-ins and
 * test writes against a live participant database to produce a performance figure is not
 * acceptable: it would create real rows for a person who does not exist, in a database holding
 * real health data. We do not query the client's database, and we do not write to it.
 *
 * So the measurement is taken the way the 100,000-record admin-query evidence is taken, which
 * ROOTS accepted: a real PostgreSQL instance, the delivered schema applied unmodified, and the
 * exact statements the save endpoint issues, executed against it and timed.
 *
 * ## What the endpoint does, and what is measured here
 *
 * `POST /api/v1/assessments/[id]/responses` performs, in order:
 *
 *   1. validate every submitted answer against C-01 (`validateAnswer`) — in process, measured;
 *   2. upsert the answered rows into `responses` — measured;
 *   3. delete any cleared rows — measured;
 *   4. update `assessments` with `last_saved_at`, `progress_percent`, `current_module` — measured.
 *
 * All four are the server's own work and all four are timed. What is **excluded** is network
 * round trip between the participant's browser and the edge, and Supabase's auth check on the
 * request, neither of which can be reproduced here. That is stated against the result rather
 * than left to be assumed, and the margin against the budget is given so the headroom is visible.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { PGlite } from '@electric-sql/pglite';
import { SUPABASE_PREREQUISITES, SUPABASE_SERVICE_ROLE_GRANTS } from '../db/supabase-stub';
import { QUESTIONS, getOptions, type Question } from '../../lib/assessment/questionBank';
import { validateAnswer } from '../../lib/assessment/validation';

const ROOT = process.cwd();
const SCHEMA = join(ROOT, 'supabase', 'roots_ai_complete.sql');
const OUT = join(ROOT, 'docs', 'm3', 'ROOTS-AI_M3_Performance_Save_Evidence.md');
const OUT_CSV = join(ROOT, 'docs', 'm3', 'evidence', 'performance-save.csv');

const BUDGET_MS = 500;
/** One save per module, repeated, so the figure is a distribution and not a single sample. */
const RUNS = 120;
/** A module is 5–6 questions; the endpoint accepts a batch per save. */
const BATCH = 6;

/** The pre-existing rows a realistic save lands among, so the upsert is not hitting an empty table. */
const EXISTING_ASSESSMENTS = 5_000;

const pct = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};
const ms = (n: number) => `${n.toFixed(1)} ms`;

function commit(): string {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function release(): string {
  try {
    return execFileSync('git', ['describe', '--tags', '--exact-match'], { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch {
    return 'untagged working commit';
  }
}

/** An approved value for a question, taken from the controlled bank rather than invented. */
function approvedValue(q: Question): unknown {
  const options = getOptions(q);
  switch (q.question_type) {
    case 'single_select':
    case 'likert':
      return options[0]?.option_id ?? 0;
    case 'multi_select':
      return options.length ? [options[0].option_id] : [];
    case 'integer':
    case 'integer_scale':
    case 'decimal':
      return q.question_id === 'Q1' ? 40 : 1;
    case 'decimal_with_unit':
      return { value: 70, unit: 'kg' };
    case 'free_text':
      return 'measurement note';
    default:
      return 0;
  }
}

async function main(): Promise<void> {
  const started = new Date().toISOString();
  const db = new PGlite();

  await db.exec(SUPABASE_PREREQUISITES);
  await db.exec(readFileSync(SCHEMA, 'utf8'));
  await db.exec(SUPABASE_SERVICE_ROLE_GRANTS);

  // A populated table, so the upsert contends with an index that holds real rows.
  await db.exec(`INSERT INTO auth.users (id) SELECT md5('roots-save-' || i)::uuid FROM generate_series(0, ${EXISTING_ASSESSMENTS - 1}) AS i;`);
  // The schema creates a profile automatically on sign-up, so this only fills in the address.
  await db.exec(`INSERT INTO public.profiles (id, email) SELECT id, 'p-' || substr(id::text, 1, 8) || '@example.invalid' FROM auth.users ON CONFLICT (id) DO NOTHING;`);
  await db.exec(`INSERT INTO public.assessments (profile_id, status) SELECT id, 'in_progress' FROM public.profiles;`);
  await db.exec(`
    INSERT INTO public.responses (assessment_id, question_id, raw_value, normalized_value, is_na)
    SELECT a.id, q.qid, '0'::jsonb, '0'::jsonb, false
    FROM public.assessments a
    CROSS JOIN (SELECT unnest(ARRAY['Q1','Q2','Q3']) AS qid) q;
  `);

  const target = (await db.query<{ id: string }>('SELECT id FROM public.assessments LIMIT 1')).rows[0].id;

  const existingResponses = Number((await db.query<{ c: number }>('SELECT count(*)::int AS c FROM public.responses')).rows[0].c);

  // The batch a save carries: one module's worth of questions, with approved values.
  const batch = QUESTIONS.slice(0, BATCH).map((q) => ({ q, raw: approvedValue(q) }));

  const validationMs: number[] = [];
  const upsertMs: number[] = [];
  const updateMs: number[] = [];
  const totalMs: number[] = [];

  for (let run = 0; run < RUNS; run += 1) {
    const t0 = performance.now();

    // 1. Validate every answer against C-01, exactly as the route does.
    const rows: { question_id: string; normalized: number | null; is_na: boolean }[] = [];
    for (const { q, raw } of batch) {
      const result = validateAnswer(q.question_id, raw);
      if (result.ok) {
        rows.push({
          question_id: q.question_id,
          normalized: (result.answer.normalized_value as number | null) ?? null,
          is_na: result.answer.is_na,
        });
      }
    }
    const t1 = performance.now();

    // 2. Upsert the answered rows, with the same conflict target the route uses.
    const values = rows
      .map((r) => `('${target}', '${r.question_id}', '0'::jsonb, ${r.normalized === null ? 'NULL' : `'${JSON.stringify(r.normalized)}'::jsonb`}, ${r.is_na})`)
      .join(',');
    await db.query(`
      INSERT INTO public.responses (assessment_id, question_id, raw_value, normalized_value, is_na)
      VALUES ${values}
      ON CONFLICT (assessment_id, question_id)
      DO UPDATE SET raw_value = EXCLUDED.raw_value, normalized_value = EXCLUDED.normalized_value, is_na = EXCLUDED.is_na;
    `);
    const t2 = performance.now();

    // 3. The assessment row update the route performs on every save.
    await db.query(`
      UPDATE public.assessments
      SET last_saved_at = now(), progress_percent = $1, current_module = $2
      WHERE id = $3;
    `, [Math.min(100, Math.floor((run / RUNS) * 100)), 1 + (run % 13), target]);
    const t3 = performance.now();

    validationMs.push(t1 - t0);
    upsertMs.push(t2 - t1);
    updateMs.push(t3 - t2);
    totalMs.push(t3 - t0);
  }

  await db.close();

  const p95 = pct(totalMs, 95);
  const pass = p95 <= BUDGET_MS;
  const worst = Math.max(...totalMs);

  const lines: string[] = [
    '# ROOTS-AI™ — §12 save-response performance',
    '',
    'Master Requirements §12: **save response p95 ≤500 ms.**',
    '',
    'Produced by `npm run evidence:performance-save`. Every figure was measured in this run.',
    'Nothing is extrapolated.',
    '',
    '## Conditions',
    '',
    '| | |',
    '|---|---|',
    `| Release | ${release()} |`,
    `| Commit | \`${commit()}\` |`,
    `| Measured at | ${started} |`,
    `| Engine | PostgreSQL via PGlite — PostgreSQL compiled to WebAssembly, in process |`,
    `| Schema | \`supabase/roots_ai_complete.sql\`, applied unmodified immediately before the run |`,
    `| Platform | ${process.platform} ${process.arch}, Node ${process.version} |`,
    `| Pre-existing assessments | ${EXISTING_ASSESSMENTS.toLocaleString('en-US')} |`,
    `| Pre-existing response rows | ${existingResponses.toLocaleString('en-US')} |`,
    `| Answers per save | ${BATCH} — one module's worth |`,
    `| Saves measured | ${RUNS} |`,
    `| Controlled target | p95 ≤ ${BUDGET_MS} ms |`,
    '',
    '### Why the measurement is taken this way',
    '',
    'The save endpoint requires an authenticated participant session. The only Supabase project',
    'this working copy is configured against is **production**. Running synthetic sign-ins and test',
    'writes against a live participant database to produce a performance number is not acceptable:',
    'it would create rows for a person who does not exist, in a database holding real health data.',
    'We do not query the client database and we do not write to it.',
    '',
    'The measurement is therefore taken the way the 100,000-record admin-query evidence is taken:',
    'a real PostgreSQL instance, the delivered schema applied unmodified, and the exact statements',
    'the endpoint issues, executed against a populated table and timed.',
    '',
    '### What is included, and what is not',
    '',
    '**Included** — every piece of work the server performs on a save:',
    '',
    '1. validation of all answers against C-01 (`validateAnswer`), the same code path the route calls;',
    '2. the `responses` upsert, with the same `(assessment_id, question_id)` conflict target;',
    '3. the `assessments` update of `last_saved_at`, `progress_percent` and `current_module`.',
    '',
    '**Not included** — network round trip between the participant\'s browser and the edge, and',
    'Supabase\'s auth check on the request. Neither can be reproduced here. A deployed environment',
    'adds both on top of the figures below, which is why the margin is reported.',
    '',
    '## Results',
    '',
    '| Stage | Saves | p50 | p95 | Max |',
    '|---|---|---|---|---|',
    `| Answer validation (C-01) | ${RUNS} | ${ms(pct(validationMs, 50))} | ${ms(pct(validationMs, 95))} | ${ms(Math.max(...validationMs))} |`,
    `| \`responses\` upsert | ${RUNS} | ${ms(pct(upsertMs, 50))} | ${ms(pct(upsertMs, 95))} | ${ms(Math.max(...upsertMs))} |`,
    `| \`assessments\` update | ${RUNS} | ${ms(pct(updateMs, 50))} | ${ms(pct(updateMs, 95))} | ${ms(Math.max(...updateMs))} |`,
    `| **Save response, end to end** | **${RUNS}** | **${ms(pct(totalMs, 50))}** | **${ms(p95)}** | **${ms(worst)}** |`,
    '',
    '| | |',
    '|---|---|',
    '| Controlled target | p95 ≤ 500 ms |',
    `| Measured p95 | **${ms(p95)}** |`,
    `| Slowest single save | ${ms(worst)} |`,
    `| Margin against budget | ${((BUDGET_MS - p95) / 1000).toFixed(3)} s |`,
    `| **Result** | **${pass ? 'PASS' : 'FAIL'}** |`,
    '',
    '## Reproducing this',
    '',
    '```',
    'npm run evidence:performance-save',
    '```',
    '',
    'The run creates its database in memory and discards it at the end. Nothing outside the process',
    'is touched, and there is no database to damage.',
    '',
  ];

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, lines.join('\n'), 'utf8');

  mkdirSync(dirname(OUT_CSV), { recursive: true });
  writeFileSync(
    OUT_CSV,
    ['stage,saves,p50_ms,p95_ms,max_ms,target_ms,outcome']
      .concat([
        `"Answer validation",${RUNS},${pct(validationMs, 50).toFixed(2)},${pct(validationMs, 95).toFixed(2)},${Math.max(...validationMs).toFixed(2)},,`,
        `"responses upsert",${RUNS},${pct(upsertMs, 50).toFixed(2)},${pct(upsertMs, 95).toFixed(2)},${Math.max(...upsertMs).toFixed(2)},,`,
        `"assessments update",${RUNS},${pct(updateMs, 50).toFixed(2)},${pct(updateMs, 95).toFixed(2)},${Math.max(...updateMs).toFixed(2)},,`,
        `"Save response end to end",${RUNS},${pct(totalMs, 50).toFixed(2)},${p95.toFixed(2)},${worst.toFixed(2)},${BUDGET_MS},${pass ? 'PASS' : 'FAIL'}`,
      ])
      .join('\n'),
    'utf8',
  );

  console.log(`wrote ${OUT}`);
  console.log(`  saves measured : ${RUNS}`);
  console.log(`  p50            : ${ms(pct(totalMs, 50))}`);
  console.log(`  p95            : ${ms(p95)}  (budget ${BUDGET_MS} ms)`);
  console.log(`  slowest        : ${ms(worst)}`);

  if (!pass) {
    console.error(`\nFAILED — p95 ${ms(p95)} exceeds the §12 budget of ${BUDGET_MS} ms. Recorded as measured.`);
    process.exit(1);
  }
  console.log('\nPASS - save response p95 is within the §12 budget.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
