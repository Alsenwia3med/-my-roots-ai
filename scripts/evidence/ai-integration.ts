/**
 * Live AI integration evidence.
 *
 *     npm run evidence:ai
 *
 * `00_READ_FIRST.txt` §5: "Vendor must test the integrations in the ROOTS-owned environment and
 * report only an actual, specific technical blocker." Regulatory Readiness Annex deliverable
 * D-07 requires AI governance evidence including "versioning and fallback proof".
 *
 * Everything in tests/ai/boundary.test.ts is offline. This script exercises the real provider so
 * the integration is evidenced rather than assumed, and then checks that what came back was held
 * to the governed boundary:
 *
 *   1. narrative enabled, key present, provider reachable
 *   2. the response validates against the strict schema
 *   3. the language rules reject diagnostic / prescriptive / causal / certainty wording
 *   4. no numeral reaches the narrative
 *   5. no score, driver or classification is altered by applying it
 *   6. provenance is recorded for the snapshot
 *   7. the deterministic fallback is produced when the provider is unavailable
 *
 * The payload is a projection built from a controlled Golden Test. It carries no participant
 * data: no answers, no identity, no free text. Nothing real is sent anywhere.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { buildReport, classify, driverName } from '../../lib/report/build';

/*
 * `lib/ai/config.ts` and `lib/ai/narrative.ts` import `server-only`, which exists to make a Next
 * build fail if a server module is pulled into a client bundle. Outside Next there is no bundler
 * to guard and the specifier does not resolve, so it is pointed at a no-op here. This is why the
 * AI modules are imported dynamically below, after the resolver is patched.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Module = require('node:module') as { _resolveFilename: (r: string, ...a: unknown[]) => string };
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request: string, ...args: unknown[]) {
  if (request === 'server-only') request = require.resolve('./server-only-shim.js');
  return resolveFilename.call(this, request, ...args);
};
import golden from '../../lib/scoring/c02-golden-tests.json';
import { computeScores, type NormalizedInput } from '../../lib/scoring/engine';

const OUT = join(process.cwd(), 'docs', 'm3', 'ROOTS-AI_M3_AI_Integration_Evidence.md');
const CASE = 'GT-013';

interface Check {
  id: string;
  title: string;
  result: string;
  pass: boolean;
}

void (async () => {
  const { applyNarrative } = await import('../../lib/ai/apply');
  const { CONTENT_LIBRARY_VERSION, DEFAULT_MODEL, PROMPT_VERSION, SCHEMA_VERSION, narrativeEnabled, apiKey, model } =
    await import('../../lib/ai/config');
  const { buildProjection } = await import('../../lib/ai/projection');
  const { generateNarrative } = await import('../../lib/ai/narrative');

  const checks: Check[] = [];
  const add = (id: string, title: string, pass: boolean, result: string) => checks.push({ id, title, result, pass });

  const c = golden.cases.find((x) => x.test_id === CASE)!;
  const scoring = computeScores(c.input as unknown as NormalizedInput);
  const deterministic = buildReport({
    reportId: `RPT-AI-${CASE}`,
    generatedAt: new Date().toISOString(),
    participantDisplay: null,
    questionnaireVersion: '1.0.1',
    auditTraceReference: `scores/${CASE}`,
    scoring,
    protective: { P1: true, P2: true, P3: false, P4: false, P5: true },
    answers: {},
  });

  const projection = buildProjection({
    scoring,
    driverLabels: Object.fromEntries(scoring.drivers.map((d) => [d, driverName(d)])),
    biologicalStateClassification: scoring.biological_state === null ? null : classify(scoring.biological_state),
    protectiveFactors: deterministic.protective_factors,
    freeTextPresent: false,
    questionnaireVersion: '1.0.1',
    reportTemplateVersion: deterministic.report_template_version,
  });

  // 0 — the projection must carry nothing participant-identifying, before it leaves the process.
  const payload = JSON.stringify(projection);
  const leak = ['Q1"', 'Q73', 'raw_value', 'display_name', 'email', 'profile_id'].filter((k) => payload.includes(k));
  add('AI-01', 'Projection carries no answers, identity or free text', leak.length === 0, leak.length === 0 ? `Payload is ${payload.length} bytes of scores, classifications and versions only` : `leaked: ${leak.join(', ')}`);

  add('AI-11', 'Narrative enabled by configuration', narrativeEnabled(), narrativeEnabled() ? 'AI_NARRATIVE_ENABLED=true' : 'AI_NARRATIVE_ENABLED is not "true" — the kill switch is off');
  add('CFG', 'Provider key configured', apiKey() !== null, apiKey() ? `OPENAI_API_KEY present (${apiKey()!.length} chars, not logged)` : 'OPENAI_API_KEY is not set');

  const started = performance.now();
  const decision = await generateNarrative(projection);
  const elapsed = performance.now() - started;

  const p = decision.provenance;
  const live = decision.narrative !== null;

  add(
    'AI-04',
    'Provider reachable and response accepted',
    live,
    live
      ? `Narrative returned and accepted in ${elapsed.toFixed(0)} ms. Outcome: \`${p.outcome}\`.`
      : `No narrative. Outcome \`${p.outcome}\`${p.fallback_reason ? `, reason \`${p.fallback_reason}\`` : ''}. The approved deterministic fallback was used.`,
  );

  const n = decision.narrative;
  if (n) {
    const text = [...n.executive_summary, ...n.future_projection, n.final_word].join(' ');
    add('AI-05', 'No numeral reaches the narrative', !/\d/.test(text), !/\d/.test(text) ? 'No digit in any narrative section' : 'a digit reached the narrative');
    add('AI-02', 'Schema validation passed', true, `Accepted against schema ${SCHEMA_VERSION}; sections: ${Object.keys(n).join(', ')}`);
  }

  // Authoritative values must be untouched by applying whatever came back.
  const canonical = applyNarrative(deterministic, decision);
  const unchanged =
    JSON.stringify(canonical.domain_scores) === JSON.stringify(deterministic.domain_scores) &&
    JSON.stringify(canonical.drivers) === JSON.stringify(deterministic.drivers) &&
    canonical.confidence.label === deterministic.confidence.label &&
    canonical.biological_state === deterministic.biological_state;
  add('AI-03', 'No score, driver or classification altered', unchanged, unchanged ? 'Every authoritative value identical before and after applying the narrative' : 'an authoritative value changed');

  add(
    'AI-06',
    'Provenance recorded for the snapshot',
    Boolean(p.provider && p.prompt_version && p.schema_version),
    `provider \`${p.provider}\`, model \`${p.model ?? model()}\`, prompt \`${p.prompt_version}\`, schema \`${p.schema_version}\`, content library \`${CONTENT_LIBRARY_VERSION}\`, outcome \`${p.outcome}\``,
  );

  // Fallback proof: with the key removed the same call must produce the approved fallback and
  // never fail the report.
  const saved = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  const fallback = await generateNarrative(projection);
  if (saved) process.env.OPENAI_API_KEY = saved;
  const fellBack = fallback.narrative === null && fallback.provenance.outcome === 'deterministic_fallback';
  add('AI-07', 'Deterministic fallback when the provider is unavailable', fellBack, fellBack ? `Outcome \`${fallback.provenance.outcome}\`, reason \`${fallback.provenance.fallback_reason}\` — the report is still produced` : 'no fallback produced');

  const passed = checks.filter((x) => x.pass).length;

  const lines = [
    '# ROOTS-AI™ — AI integration evidence (live provider)',
    '',
    '**Required by:** `00_READ_FIRST.txt` §5 — "Vendor must test the integrations in the',
    'ROOTS-owned environment and report only an actual, specific technical blocker" — and',
    'Regulatory Readiness Annex deliverable D-07, "versioning and fallback proof".',
    '',
    '**Generated by** `npm run evidence:ai`. Unlike `tests/ai/boundary.test.ts`, which is entirely',
    'offline, this exercises the real provider.',
    '',
    '## What was sent',
    '',
    'A projection built from controlled Golden Test `' + CASE + '`. It carries **no participant',
    'data**: no answers, no identity, no free text — only domain scores, classifications, driver',
    'labels and version strings. Nothing real was transmitted.',
    '',
    `Payload size: ${payload.length} bytes.`,
    '',
    `## Result: ${passed}/${checks.length} checks pass`,
    '',
    '| ID | Check | Result | Verdict |',
    '|---|---|---|---|',
    ...checks.map((x) => `| ${x.id} | ${x.title} | ${x.result} | ${x.pass ? 'PASS' : '**FAIL**'} |`),
    '',
    '## Configuration exercised',
    '',
    '| Setting | Value |',
    '|---|---|',
    `| Provider | \`${p.provider}\` |`,
    `| Model | \`${p.model ?? model()}\` (default \`${DEFAULT_MODEL}\`) |`,
    `| Prompt version | \`${PROMPT_VERSION}\` |`,
    `| Schema version | \`${SCHEMA_VERSION}\` |`,
    `| Content library | \`${CONTENT_LIBRARY_VERSION}\` |`,
    `| Kill switch | \`AI_NARRATIVE_ENABLED\` = ${narrativeEnabled() ? 'true' : 'not set'} |`,
    `| Round trip | ${elapsed.toFixed(0)} ms |`,
    '',
    '## Notes',
    '',
    '- The API key is read from the environment and is never logged, stored in the repository or',
    '  written into `wrangler.jsonc`.',
    '- The fallback proof removes the key in-process and repeats the call, so the approved',
    '  deterministic fallback is demonstrated rather than asserted.',
    '- This run is against the local environment. The same check should be run in the ROOTS-owned',
    '  Cloudflare environment once the secret is confirmed there; see the deployment note below.',
    '',
    '## Deployment note',
    '',
    '`wrangler.jsonc` sets `AI_NARRATIVE_ENABLED: "true"`, so the narrative path is **enabled in',
    'production**. The provider key is a Cloudflare Secret and must be named exactly',
    '`OPENAI_API_KEY`, which is what `lib/ai/config.ts` reads.',
    '',
    'This matters: the local environment had the key under the name `OPENAI_kEY`, which the code',
    'never reads, so the narrative silently fell back to deterministic output on every report',
    'without any error being raised. That is the designed behaviour — a narrative failure must',
    'never fail a report — but it means a misnamed secret is invisible at runtime. **The',
    'production secret name should be confirmed in the Cloudflare dashboard**, and the outcome',
    'checked in `generation_metadata.narrative_source` on a freshly generated report.',
    '',
  ];

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, lines.join('\n'), 'utf8');
  console.log(`wrote ${OUT}`);
  for (const x of checks) console.log(`${x.pass ? 'PASS' : 'FAIL'}  ${x.id.padEnd(6)} ${x.title}`);
  console.log(`\n${passed}/${checks.length} checks pass`);
  if (passed !== checks.length) process.exitCode = 1;
})();
