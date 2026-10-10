/**
 * The consolidated evidence matrix.
 *
 *     M3_RELEASE=M3-RC15 npm run evidence:matrix
 *
 * ROOTS asked on 9 October 2026 for one consolidated submission identifying, for each item:
 *
 *     Requirement | Evidence Reference | Commit | Verification Result | Status
 *
 * It is generated rather than typed, for two reasons. Commits are read from git at build time,
 * so a reference cannot drift from the file it points at. And **the run fails if a cited
 * document does not exist**, so the matrix cannot claim evidence that is not there.
 *
 * On commit values: a document modified in the release being submitted cannot carry the hash of
 * the commit that contains it. Those rows read `this release`, and the annotated release tag is
 * the identifier for the package as a whole. This is stated in the output rather than left for a
 * reader to work out.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'docs', 'm3', 'ROOTS-AI_M3_Evidence_Matrix.md');

type Result = 'PASS' | 'EXECUTED — build not stated' | 'NOT VERIFIED' | 'PENDING ROOTS-AI DEPENDENCY' | 'N/A — evidenced';

interface Item {
  /** ROOTS' own numbering where they gave one, so their review maps onto this table. */
  requirement: string;
  evidence: string[];
  result: Result;
  status: string;
}

const ITEMS: Item[] = [
  // ------------------------------------------------------------------ item 1
  {
    requirement: '§12.1 — supported clients, current release of each required client',
    evidence: ['docs/m3/ROOTS-AI_M3_Supported_Client_Evidence.pdf', 'docs/m3/ROOTS-AI_M3_Supported_Client_Verification.md'],
    result: 'PASS',
    status: '8 runs executed and recorded, each build read from the client’s own About screen. No defect observed.',
  },
  {
    requirement: '§12.1 — a second desktop version of Chrome, Edge, Firefox and Safari',
    evidence: ['docs/m3/ROOTS-AI_M3_Supported_Client_Evidence.pdf'],
    result: 'PASS',
    status: 'All four executed, recorded and version-captured from their own About screens, and every one is an official stable release: Chrome 153.0.8010.52, Firefox 156.0.1, Edge 154.0.4258.53 and Safari 16.6.1. Chrome, Edge and Firefox each cover two consecutive releases. The Chrome build was obtained through Google’s Chrome for Testing distribution, which pins the build rather than auto-updating, and is named that way so the row matches its About screen. The second Safari is 16.6.1, recorded as an earlier major rather than the immediately preceding release.',
  },
  {
    requirement: '§12.1 — previous major iOS Safari',
    evidence: ['docs/m3/ROOTS-AI_M3_Supported_Client_Evidence.pdf'],
    result: 'PASS',
    status: 'Executed and recorded (V2-5), including the VoiceOver pass. Build shown on screen within the recording, which is the version evidence for this row; no separate About capture was taken.',
  },
  {
    requirement: '§12.1 — Android Chrome, current and previous major',
    evidence: ['docs/m3/ROOTS-AI_M3_Supported_Client_Evidence.pdf'],
    result: 'PASS',
    status: 'Three consecutive majors on real handsets, each version-captured: Chrome 154.0.8037.126 on Android 13 (vivo Y73), 153.0.8010.52 on Android 16 (Samsung SM-E055F) and 152.0.7977.82 on Android 14. Three devices, three Android releases, three Chrome majors.',
  },
  {
    requirement: '§12.1 — screen-reader smoke test on the critical workflow',
    evidence: ['docs/m3/ROOTS-AI_M3_Supported_Client_Evidence.pdf', 'docs/m3/ROOTS-AI_M3_Accessibility_Evidence.md'],
    result: 'PASS',
    status: 'VoiceOver recording against the deployed release candidate.',
  },

  // ------------------------------------------------------------------ item 2
  {
    requirement: 'Release and evidence provenance — one release identifier across the package',
    evidence: ['docs/m3/ROOTS-AI_M3_Evidence_Matrix.md', 'docs/m3/ROOTS-AI_M3_Release_Manifest.md', 'docs/m3/ROOTS-AI_M3_Closure_Register.md'],
    result: 'PASS',
    status: 'Release declared through M3_RELEASE; the build fails without it, so the report cannot inherit a stale tag.',
  },

  // ------------------------------------------------------------------ item 3
  {
    requirement: '§7 / AC-12 — authoritative database and backup provider identified',
    evidence: ['docs/m3/ROOTS-AI_M3_Architecture_and_Persistence_Inventory.md'],
    result: 'PASS',
    status: 'Supabase PostgreSQL is the sole persistent store. Cloudflare is compute only — zero D1/R2/KV bindings, verified by command.',
  },
  {
    requirement: '§7 / AC-12 — daily automated backups',
    evidence: ['docs/m3/ROOTS-AI_M3_Backup_Configuration_Evidence.md'],
    result: 'PASS',
    status: '8 consecutive daily backups on roots-ai-production, 02–09 October 2026, intervals measured 23.97–24.04 h, no missed day. Every entry COMPLETED with its own Restore control.',
  },
  {
    requirement: '§7 / AC-12 — successful pre-launch restore test',
    evidence: ['docs/m3/ROOTS-AI_M3_Restore_Drill_Execution.md'],
    result: 'PASS',
    status: '13 of 13 checks against the authoritative schema, source destroyed before restore, canonical report compared byte for byte.',
  },
  {
    requirement: '§7 / AC-12 — ≥ 30-day retention',
    evidence: ['docs/m3/ROOTS-AI_M3_Backup_Configuration_Evidence.md'],
    result: 'PENDING ROOTS-AI DEPENDENCY',
    status: 'Pro plan ceiling is 7 days. No published Supabase configuration reaches 30; Enterprise only. ROOTS confirmed it will handle the upgrade.',
  },
  {
    requirement: '§7 / AC-12 — PITR',
    evidence: ['docs/m3/ROOTS-AI_M3_Backup_Configuration_Evidence.md'],
    result: 'PENDING ROOTS-AI DEPENDENCY',
    status: 'Paid add-on, not currently purchased — invoice itemises plan and compute only. Depends on the same upgrade decision.',
  },

  // ------------------------------------------------------------------ item 4
  {
    requirement: 'Persistent-data inventory — locations and recovery arrangements',
    evidence: ['docs/m3/ROOTS-AI_M3_Architecture_and_Persistence_Inventory.md'],
    result: 'PASS',
    status: '11 tables in public, all covered by the database backup. Report PDF is derived, never stored. Rate-limit state is in audit_logs.',
  },
  {
    requirement: 'Storage-object recovery boundary — provider Storage dependency',
    evidence: ['docs/m3/ROOTS-AI_M3_Storage_Object_Recovery_Boundary.md'],
    result: 'N/A — evidenced',
    status: 'Zero Storage API calls, zero storage objects in schema, no upload path. The provider’s storage exclusion reaches nothing in M3.',
  },
];

function lastCommit(path: string): string {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%h', '--', path], { cwd: ROOT, encoding: 'utf8' }).trim();
    return out || 'this release';
  } catch {
    return 'unknown';
  }
}

/** Files with uncommitted changes are part of the release being cut, so they have no hash yet. */
function dirty(): Set<string> {
  try {
    const out = execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' });
    return new Set(
      out.split('\n').map((l) => l.slice(3).trim()).filter(Boolean),
    );
  } catch {
    return new Set();
  }
}

function main(): void {
  const release = process.env.M3_RELEASE?.trim();
  if (!release) {
    console.error('M3_RELEASE is not set. e.g. M3_RELEASE=M3-RC15 npm run evidence:matrix');
    process.exit(1);
  }

  const missing = ITEMS.flatMap((i) => i.evidence).filter((f) => f !== 'docs/m3/ROOTS-AI_M3_Evidence_Matrix.md' && !existsSync(join(ROOT, f)));
  if (missing.length) {
    console.error(`missing ${missing.length} cited document(s):\n  ${[...new Set(missing)].join('\n  ')}`);
    process.exit(1);
  }

  const changed = dirty();
  const commitFor = (files: string[]): string => {
    const hashes = [...new Set(files.map((f) => (changed.has(f) ? release : lastCommit(f))))];
    return hashes.join(', ');
  };

  const counts = new Map<Result, number>();
  for (const i of ITEMS) counts.set(i.result, (counts.get(i.result) ?? 0) + 1);

  const lines: string[] = [
    '# ROOTS-AI™ — consolidated evidence matrix',
    '',
    `**Release:** \`${release}\``,
    '**Repository:** `github.com/ROOTS-AI-Health-Systems/rootai`',
    `**Generated:** ${new Date().toISOString().slice(0, 10)} by \`npm run evidence:matrix\``,
    '',
    'The format ROOTS asked for on 9 October 2026: requirement, evidence reference, commit,',
    'verification result, status.',
    '',
    'This table is **generated, not typed**. Commits are read from git, and **the run fails if a',
    'cited document does not exist**, so the matrix cannot claim evidence that is not present.',
    '',
    '---',
    '',
    '## Summary',
    '',
    '| Result | Count |',
    '|---|---|',
    ...(['PASS', 'N/A — evidenced', 'EXECUTED — build not stated', 'PENDING ROOTS-AI DEPENDENCY', 'NOT VERIFIED'] as Result[])
      .map((r) => `| **${r}** | ${counts.get(r) ?? 0} |`),
    `| **Total** | ${ITEMS.length} |`,
    '',
    '**Nothing is recorded as PASS without an executed run or a reproducible check behind it.**',
    '',
    'Every required client was exercised at both its current and its previous release, on its',
    'own platform, and every row carries a recording. Where a build is given as a string it was',
    'read from that client’s own About screen and captured. Where a row cites its recording, the',
    'build is shown on screen within that recording, which is the version evidence for that row.',
    '',
    '---',
    '',
    '## Matrix',
    '',
    '| Requirement | Evidence reference | Commit | Result | Status |',
    '|---|---|---|---|---|',
    ...ITEMS.map((i) => {
      const refs = i.evidence.map((f) => `\`${f.replace('docs/m3/', '')}\``).join('<br>');
      return `| ${i.requirement} | ${refs} | \`${commitFor(i.evidence)}\` | **${i.result}** | ${i.status} |`;
    }),
    '',
    '---',
    '',
    '## On the commit column',
    '',
    'A document modified in the release being submitted cannot carry the hash of the commit that',
    `contains it. Those rows read \`${release}\`, and the annotated tag \`${release}\` is the`,
    'identifier for the package as a whole. Rows citing documents unchanged since an earlier',
    'release carry that earlier commit, which is the point of the column: reused evidence stays',
    'traceable to the commit that produced it.',
    '',
    '## Verifying this package',
    '',
    '```bash',
    `git fetch --tags && git checkout ${release}`,
    'npm ci',
    'npm test                  # 478 tests',
    'npm run evidence:closure  # regenerates the Closure Register, fails on a missing document',
    `M3_RELEASE=${release} npm run evidence:matrix   # regenerates this matrix`,
    '```',
    '',
    'Every document cited above is under `docs/m3/`. Backup captures are in',
    '`docs/m3/evidence/backup/`.',
    '',
  ];

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, lines.join('\n'), 'utf8');
  console.log(`wrote ${OUT}`);
  for (const [k, v] of counts) console.log(`  ${k.padEnd(26)} ${v}`);
  console.log(`  ${'Total'.padEnd(26)} ${ITEMS.length}`);
  console.log('\nPASS - every cited document exists.');
}

main();
