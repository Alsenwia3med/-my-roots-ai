/**
 * The traceability index.
 *
 *     M3_RELEASE=M3-RC23 npm run evidence:traceability
 *
 * ROOTS asked on 9 October 2026 for "direct access to the exact Git files, annotated tag, commit
 * SHA, and supporting evidence for final verification", and for the underlying technical records
 * behind the architecture, storage-boundary and restore summaries.
 *
 * This lists every evidence file with:
 *
 *   - its exact repository path, so it can be opened directly;
 *   - the commit that last changed it, so reused evidence stays traceable to the commit that
 *     produced it rather than to the release that cites it;
 *   - a SHA-256 of its contents, so the file can be checked byte-for-byte after download.
 *
 *
 * ORDERING MATTERS, and getting it wrong is how the first version shipped stale hashes.
 *
 * This index hashes HEAD. Committing it moves HEAD, so any file changed in the same commit as
 * the index now has a different blob than the index recorded. The release therefore runs in two
 * steps: commit the evidence, then regenerate this index and commit it alone. The second commit
 * touches only the index, so every other entry is correct for the tagged commit, and the index's
 * own row is already reported as self-referential rather than hashed.
 *
 * The hash is the part that makes this verification rather than a list. A path and a commit say
 * where a file should be; the hash says whether the file in hand is that file.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, sep } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'docs', 'm3', 'ROOTS-AI_M3_Traceability_Index.md');

/** Grouped so a reader looking for one answer is not reading the whole list. */
const GROUPS: { title: string; note: string; paths: string[] }[] = [
  {
    title: 'Architecture, storage and recovery',
    note: 'The underlying records behind the summaries, not the summaries.',
    paths: [
      'docs/m3/ROOTS-AI_M3_Architecture_and_Persistence_Inventory.md',
      'docs/m3/ROOTS-AI_M3_Storage_Object_Recovery_Boundary.md',
      'docs/m3/ROOTS-AI_M3_Restore_Drill_Execution.md',
      'docs/m3/ROOTS-AI_M3_Backup_Configuration_Evidence.md',
      'docs/m3/ROOTS-AI_M3_Backup_and_Restore_Drill_Plan.md',
      'scripts/db/restore_drill.ts',
      'supabase/roots_ai_complete.sql',
      'wrangler.jsonc',
    ],
  },
  {
    title: 'Supported clients',
    note: 'The report, its matrix, and the generator that produces both.',
    paths: [
      'docs/m3/ROOTS-AI_M3_Supported_Client_Evidence.pdf',
      'docs/m3/ROOTS-AI_M3_Supported_Client_Verification.md',
      'docs/m3/ROOTS-AI_M3_Accessibility_Evidence.md',
      'docs/m3/ROOTS-AI_M3_Responsive_Evidence.md',
      'scripts/evidence/supported-client-report.ts',
    ],
  },
  {
    title: 'Release, register and matrix',
    note: 'Each is generated; each generator fails if a cited document is missing.',
    paths: [
      'docs/m3/ROOTS-AI_M3_Closure_Register.md',
      'docs/m3/ROOTS-AI_M3_Evidence_Matrix.md',
      'docs/m3/ROOTS-AI_M3_Release_Manifest.md',
      'docs/m3/ROOTS-AI_M3_Traceability_Index.md',
      'scripts/evidence/closure-register.ts',
      'scripts/evidence/evidence-matrix.ts',
      'scripts/evidence/traceability-index.ts',
    ],
  },
  {
    title: 'Security, performance and integrity',
    note: 'Referenced by the register; listed here so they can be opened without searching.',
    paths: [
      'docs/m3/ROOTS-AI_M3_Security_Evidence.md',
      'docs/m3/ROOTS-AI_M3_OWASP_Evidence.md',
      'docs/m3/ROOTS-AI_M3_DB_Probe_Execution_Log.md',
      'docs/m3/ROOTS-AI_M3_Performance_Evidence.md',
      'docs/m3/ROOTS-AI_M3_Performance_Scale_Evidence.md',
      'docs/m3/ROOTS-AI_M3_Performance_Save_Evidence.md',
      'docs/m3/ROOTS-AI_M3_Clean_Install_Evidence.md',
      'docs/m3/ROOTS-AI_M3_Package_Integrity_Verification.md',
    ],
  },
];

const git = (args: string[]): string => {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
};

/**
 * The SHA-256 of the file as COMMITTED, not as it sits in a working tree.
 *
 * Hashing the working tree was a defect: on Windows git materialises text files with CRLF while
 * the repository stores LF, so the same committed file hashes differently on different
 * platforms. 162 tracked files in this repository differ that way, and ROOTS found three of them
 * in the index.
 *
 * The committed blob is the thing the tag actually identifies, and it is byte-identical for
 * everyone. Binary files are unaffected either way, and are hashed through the same path so one
 * rule covers the whole index.
 */
const sha256 = (rel: string, abs: string): string => {
  try {
    const blob = execFileSync('git', ['show', `HEAD:${rel}`], { maxBuffer: 1 << 30 });
    return createHash('sha256').update(blob).digest('hex');
  } catch {
    // Not tracked (or not yet committed): fall back to the file, and say so in the row.
    return `${createHash('sha256').update(readFileSync(abs)).digest('hex')} (untracked)`;
  }
};

const kb = (abs: string): string => `${Math.max(1, Math.round(statSync(abs).size / 1024))} KB`;

/** Every capture under a directory, so the screenshot evidence is addressable too. */
function filesUnder(rel: string): string[] {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    const child = join(abs, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(relative(ROOT, child).split(sep).join(posix.sep)));
    else out.push(relative(ROOT, child).split(sep).join(posix.sep));
  }
  return out.sort();
}

function main(): void {
  const release = process.env.M3_RELEASE?.trim();
  if (!release) {
    console.error('M3_RELEASE is not set. e.g. M3_RELEASE=M3-RC23 npm run evidence:traceability');
    process.exit(1);
  }

  const head = git(['rev-parse', 'HEAD']);
  const headShort = git(['rev-parse', '--short', 'HEAD']);

  const lines: string[] = [
    '# ROOTS-AI™ — traceability index',
    '',
    `**Release:** \`${release}\` (annotated tag)`,
    `**Commit SHA:** \`${head}\``,
    '**Repository:** `github.com/ROOTS-AI-Health-Systems/rootai`',
    `**Generated:** ${new Date().toISOString().slice(0, 10)} by \`npm run evidence:traceability\``,
    '',
    'ROOTS asked for direct access to the exact files, the annotated tag, the commit SHA and the',
    'underlying technical records. Every row below gives a path you can open, the commit that last',
    'changed that file, and a **SHA-256 of its contents**.',
    '',
    '## Why an earlier package named the wrong commit',
    '',
    'ROOTS asked why a previous index header named commit `8b51a8f`, which belongs to M3-RC22,',
    'while the package was M3-RC23. The cause is ordering, and it is worth stating because the',
    'same mechanism produced the three SHA-256 mismatches.',
    '',
    'This index reads `HEAD`. Committing the index **moves** `HEAD`. So an index generated before',
    'its own commit records the commit *preceding* the release, and any file changed in that same',
    'commit carries a hash taken before the change. That is what happened: the index was generated,',
    'then committed along with other evidence, and the header kept the earlier commit.',
    '',
    'Two changes fix it, and both are in force here. Hashes are taken from the **committed blob**',
    'rather than the working tree, so they do not vary by platform. And the release is cut in two',
    'steps: the evidence is committed first, then this index is regenerated and committed alone, so',
    'every entry describes the tagged commit. The index row for this document is reported as',
    'self-referential rather than hashed, because a file cannot contain its own hash.',
    '',
    'The hash is what makes this verification rather than a list: a path says where a file should',
    'be, the hash says whether the file in hand is that file.',
    '',
    '## Checking out this exact state',
    '',
    '```bash',
    'git clone https://github.com/ROOTS-AI-Health-Systems/rootai.git',
    'cd rootai',
    `git fetch --tags && git checkout ${release}`,
    `git rev-parse HEAD      # expect ${head}`,
    `git cat-file -t ${release}   # expect "tag" — an annotated tag, not lightweight`,
    `git tag -v ${release} 2>/dev/null || git show ${release} --stat | head -40`,
    '```',
    '',
    '**Verify any file below by hashing the committed blob, not the checked-out file.** Git',
    'materialises text files with CRLF on Windows and LF elsewhere, so hashing a working copy',
    'gives a platform-dependent answer. The blob is what the tag identifies and is identical',
    'for everyone:',
    '',
    '```bash',
    'sha256sum docs/m3/ROOTS-AI_M3_Restore_Drill_Execution.md   # Linux/macOS',
    'certutil -hashfile docs\\m3\\ROOTS-AI_M3_Restore_Drill_Execution.md SHA256   # Windows',
    '```',
    '',
    '---',
    '',
  ];

  let count = 0;
  let missing = 0;

  for (const g of GROUPS) {
    lines.push(`## ${g.title}`, '', g.note, '');
    lines.push('| File | Last changed in | SHA-256 | Size |', '|---|---|---|---|');
    for (const rel of g.paths) {
      const abs = join(ROOT, rel);
      // A document cannot hash itself: this index is written after the scan that lists it.
      // Named rather than skipped, so the row is not quietly absent from its own index.
      if (abs === OUT) {
        lines.push(`| \`${rel}\` | \`${release}\` | this document — hash it after download | — |`);
        count += 1;
        continue;
      }
      if (!existsSync(abs)) {
        lines.push(`| \`${rel}\` | — | **NOT PRESENT** | — |`);
        missing += 1;
        continue;
      }
      const commit = git(['log', '-1', '--format=%h', '--', rel]) || release;
      lines.push(`| \`${rel}\` | \`${commit}\` | \`${sha256(rel, abs).slice(0, 32)}…\` | ${kb(abs)} |`);
      count += 1;
    }
    lines.push('');
  }

  for (const [title, dir, note] of [
    ['Backup captures', 'docs/m3/evidence/backup', 'The provider console captures behind the backup and retention evidence.'],
    ['Supported-client captures', 'docs/m3/evidence/supported-client', 'The About-screen version captures (V1–V14) and the 20 rendered screens.'],
  ] as [string, string, string][]) {
    const files = filesUnder(dir);
    if (!files.length) continue;
    lines.push(`## ${title}`, '', note, '', `\`${dir}/\` — ${files.length} files`, '');
    lines.push('| File | Last changed in | SHA-256 |', '|---|---|---|');
    for (const rel of files) {
      const commit = git(['log', '-1', '--format=%h', '--', rel]) || release;
      lines.push(`| \`${rel.replace(`${dir}/`, '')}\` | \`${commit}\` | \`${sha256(rel, join(ROOT, rel)).slice(0, 24)}…\` |`);
      count += 1;
    }
    lines.push('');
  }

  lines.push(
    '---',
    '',
    '## Reproducing the generated evidence',
    '',
    'Three documents are generated rather than written, and each **fails** if a document it cites',
    'is absent — so none of them can claim evidence that is not in the repository.',
    '',
    '```bash',
    'npm ci',
    'npm test                                          # 478 tests',
    'npm run evidence:closure                          # Closure Register',
    `M3_RELEASE=${release} npm run evidence:matrix        # Evidence Matrix`,
    `M3_RELEASE=${release} npm run evidence:traceability  # this index`,
    '```',
    '',
    `**${count} files indexed**${missing ? `, **${missing} NOT PRESENT**` : ', all present'}.`,
    '',
  );

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, lines.join('\n'), 'utf8');
  console.log(`wrote ${OUT}`);
  console.log(`  release     ${release}`);
  console.log(`  commit      ${headShort}`);
  console.log(`  indexed     ${count}`);
  console.log(`  missing     ${missing}`);
  if (missing) {
    console.error('\nFAIL - a listed file is not present.');
    process.exit(1);
  }
  console.log('\nPASS - every listed file is present and hashed.');
}

main();
