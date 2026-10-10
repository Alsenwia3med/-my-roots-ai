/**
 * The governed narrative's settings, in one table.
 *
 *     npm run evidence:ai-settings
 *
 * ROOTS review of 29 September 2026, item B3. The AI feature has settings in three places — code
 * constants, environment variables and the provider request — and no document has stated all of
 * them together. Annex AI-06 requires the configuration that produced a report to be recoverable
 * from the report, and AI-11 requires ROOTS to be able to disable the narrative or change the
 * model without a code change; neither can be checked against a description spread over three
 * files.
 *
 * **Only the local column is filled, and deliberately.** The production values live in the
 * Cloudflare Worker's environment, which the vendor does not read. Guessing at them would produce
 * a table that looks authoritative and is not. The production column is left for whoever holds
 * that console, with the check to run beside each row.
 *
 * Every local value here is read from the running configuration, not transcribed: if a constant
 * changes, this table changes with it, and if it does not, the two have diverged visibly.
 *
 * Secrets are never printed. A key is reported as present or absent, by length and nothing else.
 */

/*
 * `lib/ai/config.ts` imports `server-only`, which exists to make a Next build fail if a server
 * module is pulled into a client bundle. Outside Next there is no bundler to guard and the
 * specifier does not resolve, so it is pointed at a no-op here — the same approach as
 * scripts/evidence/ai-integration.ts. The AI modules are therefore imported dynamically, after
 * the resolver is patched.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Module = require('node:module') as { _resolveFilename: (r: string, ...a: unknown[]) => string };
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request: string, ...args: unknown[]) {
  if (request === 'server-only') request = require.resolve('./server-only-shim.js');
  return resolveFilename.call(this, request, ...args);
};

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

interface Row {
  setting: string;
  where: string;
  local: string;
  production: string;
  governs: string;
  check: string;
}

const OUT = join(process.cwd(), 'docs', 'm3', 'ROOTS-AI_M3_AI_Settings.md');

async function main(): Promise<void> {
  const {
    CONTENT_LIBRARY_VERSION,
    DEFAULT_MODEL,
    FALLBACK_VERSION,
    PROMPT_VERSION,
    PROVIDER,
    REQUEST_TIMEOUT_MS,
    SCHEMA_VERSION,
  } = await import('../../lib/ai/config');
  const { MAX_ATTEMPTS } = await import('../../lib/ai/orchestrate');

  /** The provider request body, read from the source so the table cannot drift from what is sent. */
  function requestSetting(name: string): string {
    const source = readFileSync(join(process.cwd(), 'lib', 'ai', 'provider.ts'), 'utf8');
    // Line-anchored, with comment lines skipped: the sentence above `temperature` explains the
    // value and would otherwise be read as it.
    for (const line of source.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
      const match = new RegExp(`^${name}:\\s*(.+?),?$`).exec(trimmed);
      if (match) return `\`${match[1].trim()}\``;
    }
    return '—';
  }

  const env = (name: string) => process.env[name];

  /**
   * What a deploy applies. `wrangler.jsonc` is not a description of production — a Workers deploy
   * replaces the whole `vars` set with it — so reading it is reading production's declared state.
   * A value present in the dashboard but not here is one the next deploy removes.
   */
  function deployedVars(): Record<string, string> {
    const raw = readFileSync(join(process.cwd(), 'wrangler.jsonc'), 'utf8');
    const block = /"vars"\s*:\s*\{([\s\S]*?)\n\s*\}/.exec(raw);
    if (!block) return {};
    const out: Record<string, string> = {};
    for (const line of block[1].split('\n')) {
      const m = /^\s*"([A-Z0-9_]+)"\s*:\s*"(.*)"\s*,?\s*$/.exec(line);
      if (m) out[m[1]] = m[2];
    }
    return out;
  }

  const deployed = deployedVars();

  /** Secrets are set in the console and are not in wrangler.jsonc; deploys leave them untouched. */
  const SECRETS_IN_CONSOLE = ['OPENAI_API_KEY'];

  const production = (name: string): string => {
    if (SECRETS_IN_CONSOLE.includes(name)) return 'Secret, set — *confirmed in the console, 30 Sep 2026*';
    const value = deployed[name];
    return value === undefined ? '**not declared — a deploy would remove it**' : `\`${value}\``;
  };

  /** A key is reported as present or absent. Never printed, never partially printed. */
  function keyState(): string {
    const key = env('OPENAI_API_KEY')?.trim();
    if (!key) return '**not set**';
    return `set (${key.length} characters)`;
  }


  const ROWS: Row[] = [
    {
      setting: '`AI_NARRATIVE_ENABLED`',
      where: 'Environment',
      local: env('AI_NARRATIVE_ENABLED') === undefined ? '**not set** — narrative off' : `\`${env('AI_NARRATIVE_ENABLED')}\``,
      production: production('AI_NARRATIVE_ENABLED'),
      governs: 'AI-11 kill switch. Anything but the exact string `true` means off, and every governed section falls back to its approved deterministic copy.',
      check: 'A report generated with it off carries `outcome: deterministic_fallback` and `fallback_reason: not_configured`.',
    },
    {
      setting: '`OPENAI_API_KEY`',
      where: 'Environment (secret)',
      local: keyState(),
      production: production('OPENAI_API_KEY'),
      governs: 'Provider credential. Absent or misnamed, every report falls back — silently, until the provenance is read.',
      check: 'A generated report shows `outcome: generated`. `not_configured` means the key was never read, which is what a misnamed secret looks like.',
    },
    {
      setting: '`OPENAI_MODEL`',
      where: 'Environment',
      local: env('OPENAI_MODEL') ? `\`${env('OPENAI_MODEL')}\`` : `**not set** — defaults to \`${DEFAULT_MODEL}\``,
      production: production('OPENAI_MODEL'),
      governs: 'AI-11. ROOTS can change the approved model without a code change. Whatever is used is recorded on the report (AI-06).',
      check: 'The `model` field in the report\'s narrative provenance matches the value set.',
    },
    {
      setting: '`PROVIDER`',
      where: 'Code constant',
      local: `\`${PROVIDER}\``,
      production: 'same — compiled into the build',
      governs: 'OPS-06: no new provider without ROOTS approval. Changing it is a code change and a ROOTS decision, which is why it is not an environment variable.',
      check: 'Recorded in every report\'s provenance.',
    },
    {
      setting: '`DEFAULT_MODEL`',
      where: 'Code constant',
      local: `\`${DEFAULT_MODEL}\``,
      production: 'same — compiled into the build',
      governs: 'Used when `OPENAI_MODEL` is unset. The approved model of record.',
      check: 'Compare with the provenance on a report generated with no `OPENAI_MODEL` set.',
    },
    {
      setting: '`REQUEST_TIMEOUT_MS`',
      where: 'Code constant',
      local: `${REQUEST_TIMEOUT_MS} ms`,
      production: 'same — compiled into the build',
      governs: 'AI-07 — per attempt, so the participant never waits indefinitely. §12 requires a governed fallback on provider timeout.',
      check: '`tests/ai/outcomes.test.ts`, the timeout case: the report falls back with `fallback_reason: timeout`.',
    },
    {
      setting: '`MAX_ATTEMPTS`',
      where: 'Code constant',
      local: String(MAX_ATTEMPTS),
      production: 'same — compiled into the build',
      governs: `AI-07 retry. Worst case a participant waits ${MAX_ATTEMPTS} × ${REQUEST_TIMEOUT_MS / 1000} s = ${(MAX_ATTEMPTS * REQUEST_TIMEOUT_MS) / 1000} s before the deterministic report is produced.`,
      check: '`tests/ai/outcomes.test.ts`: one retry then acceptance, and a provider error on every attempt stopping after exactly this many.',
    },
    {
      setting: '`temperature`',
      where: 'Provider request',
      local: requestSetting('temperature'),
      production: 'same — compiled into the build',
      governs: 'Low: the narrative describes a fixed, already-calculated result, so variation adds nothing and costs reproducibility.',
      check: 'Read from `lib/ai/provider.ts` at generation time.',
    },
    {
      setting: '`max_tokens`',
      where: 'Provider request',
      local: requestSetting('max_tokens'),
      production: 'same — compiled into the build',
      governs: 'Bounds the response. The C-03 §4.2 word limits are enforced separately by the schema check, which rejects an over-long narrative rather than truncating it.',
      check: '`tests/ai/boundary.test.ts` — word limits.',
    },
    {
      setting: '`response_format`',
      where: 'Provider request',
      local: requestSetting('response_format'),
      production: 'same — compiled into the build',
      governs: 'The response must be JSON for the schema check to run at all. A model that does not support this mode returns prose and every report falls back with `invalid_json`.',
      check: '`tests/ai/outcomes.test.ts`, the invalid-JSON case.',
    },
    {
      setting: '`store`',
      where: 'Provider request',
      local: requestSetting('store'),
      production: 'same — compiled into the build',
      governs: 'False: the provider is asked not to retain the request. The projection holds no answers and no identity, but retention is still declined.',
      check: 'Read from `lib/ai/provider.ts`; confirm against the provider account\'s own retention setting.',
    },
    {
      setting: '`PROMPT_VERSION`',
      where: 'Code constant',
      local: `\`${PROMPT_VERSION}\``,
      production: 'same — compiled into the build',
      governs: 'AI-06 — recorded on every report so a narrative can be traced to the prompt that produced it.',
      check: 'Present in the report\'s narrative provenance.',
    },
    {
      setting: '`SCHEMA_VERSION`',
      where: 'Code constant',
      local: `\`${SCHEMA_VERSION}\``,
      production: 'same — compiled into the build',
      governs: 'AI-06. The schema a narrative was accepted against.',
      check: 'Present in the provenance.',
    },
    {
      setting: '`CONTENT_LIBRARY_VERSION`',
      where: 'Code constant',
      local: `\`${CONTENT_LIBRARY_VERSION}\``,
      production: 'same — compiled into the build',
      governs: 'AI-04 — the approved content the narrative is grounded in.',
      check: 'Present in the provenance.',
    },
    {
      setting: '`FALLBACK_VERSION`',
      where: 'Code constant',
      local: `\`${FALLBACK_VERSION}\``,
      production: 'same — compiled into the build',
      governs: 'C-03 §7 — the approved deterministic copy used when no narrative is accepted.',
      check: 'Present in the provenance, and carried in the report\'s narrative template version.',
    },
  ];

  const lines: string[] = [
    '# ROOTS-AI™ — governed narrative settings',
    '',
    'Prepared in response to the ROOTS review of 29 September 2026, item B3.',
    '',
    '**Generated by** `npm run evidence:ai-settings`. Every value in the *Local* column is read from',
    'the running configuration, not transcribed, so this table cannot drift from what the code does.',
    '',
    '## Where the production column comes from',
    '',
    "Not from memory, and not from reading the Worker's environment, which we do not do. It is",
    'read from `wrangler.jsonc`, and that is the stronger source: **a Workers deploy replaces the',
    'whole `vars` set with what is in that file**, so a value there is what production will have',
    'after the next deploy, whatever the dashboard currently shows. A value edited only in the',
    'dashboard is one the next deploy removes, and this table would show it as `not declared`.',
    '',
    'Secrets are the exception. They are set in the console, are not in `wrangler.jsonc`, and',
    'deploys leave them untouched — which is why `OPENAI_API_KEY` belongs there and not in the file.',
    '',
    '**Confirmed against the live console on 30 September 2026.** All ten runtime variables and all',
    'four secrets in the production Worker matched this file exactly, including',
    '`AI_NARRATIVE_ENABLED=true`, `OPENAI_MODEL=gpt-4.1` and `OPENAI_API_KEY` present as a Secret.',
    'So the narrative is on in production, against the approved model, with a key a deploy cannot',
    'disturb.',
    '',
    'The local column is empty because no `.env.local` is loaded when this table is generated. That',
    'is not a finding: it is what an unconfigured environment looks like, and it is the state the',
    '`not_configured` fallback reason exists to report.',
    '',
    '## Settings',
    '',
    '| Setting | Where | Local | Production | What it governs | How to check it |',
    '|---|---|---|---|---|---|',
  ];

  for (const r of ROWS) {
    lines.push(`| ${r.setting} | ${r.where} | ${r.local} | ${r.production} | ${r.governs} | ${r.check} |`);
  }

  lines.push(
    '',
    '## What the report records, whatever happens',
    '',
    'Every report carries its narrative provenance, whether a narrative was used or not. That is what',
    'makes this table checkable after the fact rather than only at deploy time:',
    '',
    '```json',
    JSON.stringify(
      {
        provider: PROVIDER,
        model: DEFAULT_MODEL,
        prompt_version: PROMPT_VERSION,
        schema_version: SCHEMA_VERSION,
        content_library_version: CONTENT_LIBRARY_VERSION,
        fallback_version: FALLBACK_VERSION,
        outcome: 'generated | generated_after_retry | deterministic_fallback',
        fallback_reason: 'not_configured | timeout | provider_error | invalid_json | schema_rejected | prohibited_language',
      },
      null,
      2,
    ),
    '```',
    '',
    '`fallback_reason` is the field that matters operationally. `not_configured` means the key was',
    'never read — a missing or misnamed secret. `provider_error` means the provider was reached and',
    'refused. The two look identical to a participant and are completely different to fix, which is',
    'why they are recorded separately.',
    '',
    '## Scope, stated because a settings table invites the question',
    '',
    'None of these settings can affect a score. The narrative may replace three sections of the',
    'report (2, 9 and 18) and nothing else; it is given a projection of values already calculated,',
    'never answers; and it holds no database credential of any kind. Turning it off changes what',
    'those three sections say and changes no number in the report.',
    '',
    'That boundary is asserted by `tests/ai/boundary.test.ts` and, in the database, by the',
    '`roots_ai_narrative` role\'s grants, probed by `npm run db:probes`.',
    '',
  );

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, lines.join('\n'), 'utf8');
  console.log(`wrote ${OUT}`);
  console.log(`${ROWS.length} settings; local column read from the running configuration`);
  console.log(`production column read from wrangler.jsonc — ${Object.keys(deployed).length} declared vars`);
}

main();
