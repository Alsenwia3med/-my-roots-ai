/**
 * Release manifest, and the archive that stops a regeneration destroying the last one.
 *
 *     npm run release:snapshot      archive the current evidence, then write the manifest
 *     npm run release:manifest      write the manifest only
 *
 * ROOTS review of 29 September 2026, section A, on two points.
 *
 * **A release manifest.** Every evidence document has been regenerated against the delivered
 * commit, and each says so individually. What has been missing is one document that says, for a
 * single release: this commit, this date, these files, these hashes, these gate results, these
 * open items. Without it, "regenerated against the delivered commit" is a claim each document
 * makes about itself.
 *
 * **Not overwriting old evidence.** Every generator writes over its own output, so regenerating
 * destroyed the version ROOTS had been sent. A superseded document is not waste: it is what a
 * disagreement about what was delivered is settled against. `release:snapshot` copies the current
 * evidence into `docs/m3/archive/<date>-<commit>/` before anything regenerates, and refuses to
 * overwrite an archive that already exists.
 *
 * The manifest records hashes and does not verify the claims inside the documents. What it proves
 * is that a named file at a named commit had a given content, which is exactly what is needed to
 * settle "which version did we review".
 *
 * ## Two corrections required by the ROOTS review of 30 September 2026 (sections 1 and 20)
 *
 * **The integrity basis is now git, not the working directory.** Hashes are computed from the
 * blobs the commit stores, read with `git cat-file`, so the recorded value is reproducible from a
 * fresh clone on any platform. The previous version hashed working-tree bytes, which differ from
 * the stored blob wherever git has normalised line endings — eleven files in the d04a324 package.
 * ROOTS was right that an integrity record must be derived from immutable content.
 *
 * **The manifest no longer lists itself.** It cannot: it hashes the evidence set and is then
 * written into that set, so any self-entry is necessarily the hash of the previous version. The
 * old version listed itself anyway, claiming a self-verification property it could not satisfy.
 * It is now excluded by name, and the exclusion is stated in the document.
 *
 * ## Release identity
 *
 * A document cannot name the commit that contains it: adding it changes that commit. The release
 * is therefore identified by a **name chosen in advance** (`--release M3-RC2`), which every
 * document can carry, and which an annotated git tag resolves to exactly one commit once the
 * release is committed. That gives one release identity without a circular dependency.
 */

import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const M3 = join(ROOT, 'docs', 'm3');
const ARCHIVE = join(M3, 'archive');
const OUT = join(M3, 'ROOTS-AI_M3_Release_Manifest.md');

const git = (args: string): string | null => {
  try {
    return execSync(`git ${args}`, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
};

/**
 * The three documents a release writes. None can be hashed from the commit they are about to be
 * committed into: the manifest cannot hash itself, and hashing the other two would record the
 * versions from the *previous* release rather than the ones being issued. All three are therefore
 * excluded by name, and the exclusion is declared in the document.
 */
const RELEASE_BOUND = [
  'ROOTS-AI_M3_Release_Manifest.md',
  'ROOTS-AI_M3_Submission_Index.md',
  'ROOTS-AI_M3_Closure_Register.md',
];

/**
 * SHA-256 of the bytes the commit stores, not of the working copy.
 *
 * `git cat-file blob` returns the object exactly as stored, so the value is reproducible from a
 * fresh clone on any platform. Reading the working file would record whatever line endings the
 * local checkout happens to have.
 */
function blobHash(commit: string, repoPath: string): { sha256: string; bytes: number } | null {
  try {
    const buf = execSync(`git cat-file blob ${commit}:"${repoPath}"`, {
      cwd: ROOT,
      maxBuffer: 1 << 28,
      encoding: 'buffer',
      stdio: ['ignore', 'pipe', 'ignore'],
    }) as unknown as Buffer;
    return { sha256: createHash('sha256').update(buf).digest('hex'), bytes: buf.length };
  } catch {
    return null;
  }
}

/** Every path the commit stores under docs/m3, in git's own order. */
function trackedEvidence(commit: string): string[] {
  const out = execSync(`git ls-tree -r --name-only ${commit} -- docs/m3`, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1 << 26,
  });
  return out.split('\n').map((l) => l.trim()).filter(Boolean).sort();
}

/** Every evidence file under docs/m3, excluding the archive itself. */
function evidenceFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (full === ARCHIVE) continue;
      if (statSync(full).isDirectory()) walk(full);
      else out.push(full);
    }
  };
  walk(M3);
  return out.sort();
}

function archive(label: string): { path: string; files: number } | null {
  const dir = join(ARCHIVE, label);
  if (existsSync(dir)) {
    console.error(`archive ${label} already exists — refusing to overwrite it`);
    console.error('An archive is the record of what was sent. If this release needs a new archive,');
    console.error('it needs a new commit; if it does not, the existing archive is the right one.');
    process.exit(1);
  }
  const files = evidenceFiles();
  mkdirSync(dir, { recursive: true });
  for (const file of files) {
    const target = join(dir, relative(M3, file));
    mkdirSync(join(target, '..'), { recursive: true });
    cpSync(file, target);
  }
  return { path: dir, files: files.length };
}

/** The gates a release is expected to pass, and what each covers. */
const GATES: [string, string][] = [
  ['npm test', 'Full automated suite'],
  ['npx tsc --noEmit', 'Type check, strict'],
  ['npm run check:c04', 'C-04 governed strings verbatim'],
  ['npm run check:c03', 'C-03 report strings classified against the controlled sources'],
  ['npm run check:vendor-copy', 'Non-report copy checked against C-04'],
  ['npm run evidence:parity && npm run check:parity', 'Web/PDF parity, 19 sections, 5 states'],
  ['npm run check:a11y', 'C-05 §13 accessibility clauses'],
  ['npm run check:tokens', 'Design-token contrast'],
  ['npm run check:security', 'Regulatory Readiness Annex D-06'],
  ['npm run check:package', 'Controlled package SHA-256 receipt'],
  ['npm run evidence:responsive', 'C-05 §5 breakpoints and touch targets'],
  ['npm run evidence:point34', 'Locale and time zone pinned at every format'],
  ['npm run evidence:c07-critical', 'Critical C-07 rows against controlled C-01 and the build'],
  ['npm run evidence:coverage', 'Master Requirements §13.1 suite 1'],
  ['npm run build && npm run evidence:e2e', '§13.1 suite 4'],
  ['npm run build && npm run evidence:owasp', '§13.1 suite 5, OWASP strand'],
  ['npm run build && npm run evidence:performance', 'Master Requirements §12, unconditioned metrics'],
  ['npm run db:verify && npm run db:probes', 'Clean install, then 98 database probes'],
];

/** Requirements no repository can satisfy, named so the manifest is not read as completeness. */
const CANNOT_BE_EVIDENCED_HERE: [string, string][] = [
  ['§13.1 suite 11 — backup/restore', 'Needs an authorised, isolated non-production restore target with the minimum access required, using synthetic data. No unrestricted production credentials. Plan: `ROOTS-AI_M3_Backup_and_Restore_Drill_Plan.md`'],
  ['§12 conditioned metrics', 'Needs agreed conditions and a staging environment. Plan: `ROOTS-AI_M3_Performance_Test_Plan.md`'],
  ['§12.1 browser matrix', 'Needs the device and browser matrix'],
  ['Screen-reader smoke test', 'Not complete. VoiceOver run on a real iPhone with the journey operable element by element; the announcements were not captured, so control names and the error announcement are not verified. See `ROOTS-AI_M3_Supported_Client_Verification.md`.'],
  ['Availability 99.9% monthly', 'Needs a production month with monitoring'],
];

function releaseName(): string | null {
  const i = process.argv.indexOf('--release');
  return i === -1 ? null : (process.argv[i + 1] ?? null);
}

function main(): void {
  const doArchive = process.argv.includes('--archive');
  const release = releaseName();

  const commit = git('rev-parse HEAD');
  const short = commit?.slice(0, 7) ?? 'unknown';
  const branch = git('rev-parse --abbrev-ref HEAD');
  const remote = git('remote get-url origin');
  /*
   * The release-bound documents are written by this run, so their presence in `git status` is not
   * evidence that the delivered state is uncommitted. Cleanliness is judged on everything else.
   */
  const pendingChanges = (git('status --porcelain') ?? 'x')
    .split(String.fromCharCode(10))
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^\S+\s+/, ''))
    .filter((path) => !RELEASE_BOUND.some((name) => path.endsWith(name)) && !path.startsWith('docs/m3/archive/'));

  const dirty = pendingChanges.length > 0;
  const committedAt = git('show -s --format=%cI HEAD');
  const date = (committedAt ?? new Date().toISOString()).slice(0, 10);
  const label = `${date}-${short}`;

  let archived: { path: string; files: number } | null = null;
  if (doArchive) {
    if (!commit || dirty) {
      console.error('refusing to archive: the working tree must be clean and committed, or the');
      console.error('archive would be labelled with a commit it does not contain.');
      process.exit(1);
    }
    archived = archive(label);
  }

  const files = evidenceFiles();

  /*
   * Hashed from what the commit stores. `trackedEvidence` lists the paths in the commit and
   * `blobHash` reads each blob, so the recorded values are reproducible from a fresh clone.
   * The manifest excludes itself, because it is written after the hashing and cannot contain
   * its own hash (ROOTS review of 30 September 2026, section 20).
   */
  const hashed = commit
    ? trackedEvidence(commit)
        .filter((path) => !RELEASE_BOUND.some((name) => path.endsWith(name)))
        // The archive holds superseded snapshots, each already hashed by the manifest inside it.
        .filter((path) => !path.startsWith('docs/m3/archive/'))
        .map((path) => ({ path, ...(blobHash(commit, path) ?? { sha256: 'unavailable', bytes: 0 }) }))
    : [];

  const lines: string[] = [
    '# ROOTS-AI™ — M3 release manifest',
    '',
    'One document stating what a release is: the commit, the files, their hashes, the gates and',
    'what is still outstanding. Prepared for the ROOTS review of 29 September 2026, section A.',
    '',
    '**Generated by** `npm run release:manifest`. It records hashes; it does not verify the claims',
    'inside the documents. What it proves is that a named file at a named commit had a given',
    'content — which is what settles *which version did we review*.',
    '',
    '## Release',
    '',
    '| | |',
    '|---|---|',
    `| Release | ${release ? `**${release}**` : '*unnamed — pass --release to name it*'} |`,
    `| Repository | ${remote ?? '**not set**'} |`,
    `| Branch | ${branch ?? '**unavailable**'} |`,
    `| Commit | ${commit ? `\`${commit}\`` : '**unavailable**'} |`,
    `| Committed | ${committedAt ?? '—'} |`,
    `| Working tree | ${dirty ? '**dirty — this manifest does not describe a reproducible state**' : 'clean' } |`,
    `| Manifest generated | ${new Date().toISOString()} |`,
    `| Evidence files | ${files.length} |`,
    '',
  ];

  if (dirty || !commit) {
    lines.push(
      '> **This manifest does not describe a release.**',
      '>',
      '> A manifest whose working tree is dirty records hashes of files that are not in any commit,',
      '> so nothing can be recovered from the reference above. Commit the delivered state and',
      '> regenerate before this is sent.',
      '',
    );
  }

  lines.push(
    '## One release identity',
    '',
    'ROOTS review of 30 September 2026, section 1, requires the package header, Submission Index,',
    'Release Manifest and Closure Register to identify the same release and a clean state. The',
    'previous package carried three different commits, which was our error.',
    '',
    '**Why a name rather than a hash.** A document cannot contain the hash of the commit that',
    'contains it: writing the hash in changes the commit, so the value is wrong the moment it is',
    'committed. Regenerating does not converge. The release is therefore identified by a **name**,',
    `chosen before the commit exists, which an annotated git tag resolves to exactly one commit.`,
    '',
    '| | |',
    '|---|---|',
    `| Release | ${release ? `**${release}**` : '*unnamed*'} |`,
    `| Evidence hashed at | \`${commit ?? 'unavailable'}\` |`,
    `| Release commit | the commit tagged ${release ?? '<release>'}, which adds only the release-bound documents |`,
    '',
    'Every document in this release carries the release **name**. The tag resolves it to one commit,',
    'and that commit is the release. The hashes below were taken from the commit named above, which',
    'differs from the tagged commit by these three files only:',
    '',
    '- `ROOTS-AI_M3_Release_Manifest.md` (this document)',
    '- `ROOTS-AI_M3_Submission_Index.md`',
    '- `ROOTS-AI_M3_Closure_Register.md`',
    '',
    'Those are exactly the three excluded from the hash list below, for the same reason.',
    '',
    'That is checkable in one command, and it is the whole of the difference:',
    '',
    '```',
    `git diff --name-only ${commit ?? '<commit>'} ${release ?? '<release>'}`,
    '```',
    '',
    'Every other evidence file is byte-identical in both, so each hash below verifies against the',
    'tagged release commit as well as against the commit it was taken from.',
    '',
    '## Archive of superseded evidence',
    '',
    'Every generator writes over its own output, so regenerating used to destroy the version ROOTS',
    'had been sent. `npm run release:snapshot` now copies the whole evidence set into',
    '`docs/m3/archive/<date>-<commit>/` **before** anything regenerates, and refuses to overwrite an',
    'archive that already exists: an archive is the record of what was sent, and a new one needs a',
    'new commit.',
    '',
  );

  const archives = existsSync(ARCHIVE)
    ? readdirSync(ARCHIVE).filter((d) => statSync(join(ARCHIVE, d)).isDirectory()).sort()
    : [];
  if (archives.length) {
    lines.push('| Archive | Files |', '|---|---|');
    for (const a of archives) {
      let n = 0;
      const count = (dir: string) => {
        for (const e of readdirSync(dir)) {
          const f = join(dir, e);
          if (statSync(f).isDirectory()) count(f);
          else n += 1;
        }
      };
      count(join(ARCHIVE, a));
      lines.push(`| \`docs/m3/archive/${a}/\` | ${n} |`);
    }
  } else {
    lines.push('No archive yet. The first `npm run release:snapshot` on a clean tree creates one.');
  }

  lines.push(
    '',
    '## Gates',
    '',
    'Each must be re-run against the commit above. A result from an earlier build is not evidence',
    'for a later one, which is the decision of 29 September stated as a rule.',
    '',
    '| Command | Covers |',
    '|---|---|',
    ...GATES.map(([cmd, covers]) => `| \`${cmd}\` | ${covers} |`),
    '',
    '## What this release does not evidence',
    '',
    'Stated here so the manifest is never read as a completeness claim.',
    '',
    '| Requirement | Why not, and where the plan is |',
    '|---|---|',
    ...CANNOT_BE_EVIDENCED_HERE.map(([what, why]) => `| ${what} | ${why} |`),
    '',
    '## Files',
    '',
    '**SHA-256 of the bytes this commit stores**, read with `git cat-file`, not of the working copy.',
    'The two differ wherever git has normalised line endings, so hashing the working copy produced a',
    'record that could not be reproduced from a fresh clone. ROOTS raised this on 30 September 2026',
    '(section 20); the integrity basis is now the immutable git content.',
    '',
    '### Exclusions register',
    '',
    'ROOTS decision of 30 September 2026, section 1: *"Keep the release-generated documents excluded',
    'where self-reference would make reproducible hashing impossible, and document those exclusions',
    'explicitly."* This is that record. **Four paths are excluded and no others.**',
    '',
    '| Excluded | Why it cannot be hashed here | How it can still be verified |',
    '|---|---|---|',
    '| `ROOTS-AI_M3_Release_Manifest.md` | This document. It hashes the evidence set and is then written into it, so an entry for itself would be the hash of the previous version. | Its SHA-256 is recorded in the next release, and in the archive snapshot taken at this one. |',
    '| `ROOTS-AI_M3_Submission_Index.md` | Written during this release, after the hashing. Hashing it would record the version issued with the *previous* release. | As above. |',
    '| `ROOTS-AI_M3_Closure_Register.md` | As above. | As above. |',
    '| `docs/m3/archive/**` | Superseded snapshots, each already carrying the manifest that hashed it. Re-hashing them would duplicate an existing record and grow without bound. | Each snapshot contains the manifest that described it. |',
    '',
    '**Nothing else is excluded.** Every other file the commit stores under `docs/m3` is listed below,',
    'and every one verifies against the tagged release commit. The exclusion is structural — a',
    'document cannot contain its own hash — not a judgement about which files matter.',
    '',
    '**What this means for the integrity claim.** The manifest does not assert that every evidence',
    'file at this release is hashed by it. It asserts that every file it lists is hashed correctly',
    'from the immutable git object, and it names what it does not cover. The previous version',
    'claimed a self-verification property it could not satisfy; this one does not claim it.',
    '',
    '| File | Bytes | SHA-256 |',
    '|---|---|---|',
  );

  for (const entry of hashed) {
    lines.push(`| \`${entry.path}\` | ${entry.bytes} | \`${entry.sha256}\` |`);
  }

  lines.push(
    '',
    '### Verifying a file',
    '',
    'From any clone, without checking anything out:',
    '',
    '```',
    `git cat-file blob ${commit ?? '<commit>'}:docs/m3/<file> | sha256sum`,
    '```',
    '',
    'This reads the stored bytes, so it gives the same result on every platform. A hash that differs',
    'means the file is not the one this manifest describes.',
    '',
  );

  writeFileSync(OUT, lines.join('\n'), 'utf8');

  if (archived) console.log(`archived ${archived.files} files to docs/m3/archive/${label}/`);
  console.log(`wrote ${relative(ROOT, OUT)}`);
  console.log(`${hashed.length} evidence files hashed from git at ${commit ?? 'an uncommitted tree'}`);
  console.log(`${files.length} files present in the working tree (the manifest excludes itself)`);
  if (release) console.log(`release name: ${release}`);
  if (dirty || !commit) {
    console.log('\nNOT RELEASE-READY — the working tree is dirty or untracked.');
    return;
  }
  console.log('\nPASS - manifest describes a committed, clean tree.');
}

main();
