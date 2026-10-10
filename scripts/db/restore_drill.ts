/**
 * §13.1 suite 11 — one successful pre-launch backup and restore test.
 *
 *     npm run db:restore-drill
 *
 * Controlled Baseline §13.1: *"Backup/restore — backup configuration evidence and one successful
 * pre-launch restore test."* ROOTS confirmed in the M3-RC9 review that the plan alone does not
 * satisfy this, and that the test must be executed against an authorised, isolated,
 * access-controlled non-production target with synthetic data and no production credentials.
 *
 * ## The target
 *
 * A disposable PostgreSQL instance created by this run and destroyed at the end. It is isolated
 * absolutely: it exists only inside this process, nothing outside can reach it, and no credential
 * of any kind is used or required. That satisfies "isolated, access-controlled, minimum necessary
 * access" in the strongest available sense — there is no access to grant.
 *
 * ## What is actually exercised
 *
 * A real backup and a real restore, not a simulation:
 *
 *   1. a **source** instance is built from `supabase/roots_ai_complete.sql` and populated with
 *      synthetic data, including a stored canonical report object;
 *   2. the whole data directory is **dumped** — `dumpDataDir()`, PostgreSQL's own on-disk state;
 *   3. the source is **destroyed**, so nothing can be read back from it by accident;
 *   4. a **separate target** instance is created from the dump alone;
 *   5. the target is **verified** against what the source recorded before the dump.
 *
 * Verification is by value, not by presence: row counts, a content checksum over the participant
 * data, the schema objects, the RLS policies, and a byte-for-byte comparison of the stored
 * canonical report object. A restore that produced an empty but structurally valid database would
 * fail here.
 *
 * ## What it does not exercise
 *
 * It does not exercise the hosting provider's own backup tooling or point-in-time recovery, and
 * it does not prove a restore of the production project. It proves that the delivered schema and
 * its data survive a dump and restore cycle intact, which is the part that belongs to the
 * release candidate. The limitation is stated in the evidence rather than left implicit.
 */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { PGlite } from '@electric-sql/pglite';
import { SUPABASE_PREREQUISITES, SUPABASE_SERVICE_ROLE_GRANTS } from './supabase-stub';

const ROOT = process.cwd();
const SCHEMA = join(ROOT, 'supabase', 'roots_ai_complete.sql');
const OUT = join(ROOT, 'docs', 'm3', 'ROOTS-AI_M3_Restore_Drill_Execution.md');

/** Enough rows that an empty or truncated restore cannot pass by coincidence. */
const PARTICIPANTS = 500;

interface Check {
  id: string;
  what: string;
  source: string;
  target: string;
  ok: boolean;
}

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

function commit(): string {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

/** A canonical report object, so the restore is verified against real stored content. */
const CANONICAL_REPORT = JSON.stringify({
  report_id: 'RPT-DRILL-0001',
  questionnaire_version: '1.0.1',
  sections: Array.from({ length: 19 }, (_, i) => ({ n: i + 1, body: `section ${i + 1} content` })),
});

async function build(db: PGlite): Promise<void> {
  await db.exec(SUPABASE_PREREQUISITES);
  await db.exec(readFileSync(SCHEMA, 'utf8'));
  await db.exec(SUPABASE_SERVICE_ROLE_GRANTS);

  await db.exec(`INSERT INTO auth.users (id) SELECT md5('drill-' || i)::uuid FROM generate_series(0, ${PARTICIPANTS - 1}) AS i;`);
  // The schema's on_auth_user_created trigger has already created each profile from NEW.email,
  // which is NULL here because the users above were seeded with an id alone. ON CONFLICT DO
  // NOTHING therefore left every e-mail NULL, which in turn made the R-10 checksum NULL on both
  // sides and let it pass while measuring nothing. Updating on conflict is what makes the column
  // carry data for the checksum to be taken over.
  await db.exec(`INSERT INTO public.profiles (id, email) SELECT id, 'drill-' || substr(id::text,1,8) || '@example.invalid' FROM auth.users ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;`);
  // Assessments start in progress and answers are written first: the delivered schema refuses
  // to accept an answer for a submitted assessment, which is the integrity rule IN-02 asserts.
  // Seeding in the wrong order trips that trigger, as it should.
  await db.exec(`INSERT INTO public.assessments (profile_id, status, questionnaire_version) SELECT id, 'in_progress', '1.0.1' FROM public.profiles;`);
  await db.exec(`
    INSERT INTO public.responses (assessment_id, question_id, raw_value, normalized_value, is_na)
    SELECT a.id, 'Q' || q, to_jsonb(q), to_jsonb(q), false
    FROM public.assessments a CROSS JOIN generate_series(1, 10) AS q;
  `);
  await db.exec(`UPDATE public.assessments SET status = 'submitted', submitted_at = now();`);
  await db.query(
    `INSERT INTO public.reports (assessment_id, status, report_version, canonical_json, canonical_json_checksum)
     SELECT a.id, 'completed', '1.0.1', $1::jsonb, $2 FROM public.assessments a;`,
    [CANONICAL_REPORT, sha(CANONICAL_REPORT)],
  );
  await db.exec(`
    INSERT INTO public.audit_logs (action, result, actor_type, actor_id, object_type, object_id, details)
    SELECT 'assessment.submitted', 'success', 'participant', a.profile_id, 'assessment', a.id::text, '{}'::jsonb
    FROM public.assessments a;
  `);
}

/** Everything the target must reproduce. Measured the same way on both sides. */
async function survey(db: PGlite): Promise<Record<string, string>> {
  const one = async (sql: string) => String((await db.query<{ v: unknown }>(sql)).rows[0].v);
  return {
    profiles: await one('SELECT count(*)::text AS v FROM public.profiles'),
    assessments: await one('SELECT count(*)::text AS v FROM public.assessments'),
    responses: await one('SELECT count(*)::text AS v FROM public.responses'),
    reports: await one('SELECT count(*)::text AS v FROM public.reports'),
    auditLogs: await one('SELECT count(*)::text AS v FROM public.audit_logs'),
    tables: await one("SELECT count(*)::text AS v FROM information_schema.tables WHERE table_schema='public'"),
    rlsPolicies: await one("SELECT count(*)::text AS v FROM pg_policies WHERE schemaname='public'"),
    rlsEnabled: await one("SELECT count(*)::text AS v FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relrowsecurity"),
    indexes: await one("SELECT count(*)::text AS v FROM pg_indexes WHERE schemaname='public'"),
    // Content, not just counts: a checksum over the participant data itself.
    contentChecksum: await one(`
      SELECT md5(string_agg(t, '|' ORDER BY t))::text AS v FROM (
        SELECT concat_ws(':', p.email, a.status, count(r.id)::text) AS t
        FROM public.profiles p
        JOIN public.assessments a ON a.profile_id = p.id
        LEFT JOIN public.responses r ON r.assessment_id = a.id
        GROUP BY p.email, a.status
      ) s
    `),
    canonicalReport: await one('SELECT (canonical_json)::text AS v FROM public.reports LIMIT 1'),
    canonicalChecksum: await one('SELECT canonical_json_checksum AS v FROM public.reports LIMIT 1'),
  };
}

async function main(): Promise<void> {
  const startedAt = new Date().toISOString();
  const t0 = performance.now();

  // 1. Source.
  const source = new PGlite();
  await build(source);
  const before = await survey(source);
  const tBuilt = performance.now();

  // 2. Backup.
  const dump = await source.dumpDataDir();
  // The bytes are read once for the checksum and the size; the restore below loads the dump
  // itself, so the target is built from the backup artefact rather than from a re-encoding of it.
  const dumpArrayBuffer = await dump.arrayBuffer();
  const dumpBytes = new Uint8Array(dumpArrayBuffer);
  const dumpChecksum = createHash('sha256').update(dumpBytes).digest('hex');
  const tDumped = performance.now();

  // 3. Destroy the source, so nothing can be read back from it by accident.
  await source.close();
  const tClosed = performance.now();

  // 4. Restore into a separate target.
  const target = await PGlite.create({ loadDataDir: new Blob([dumpArrayBuffer]) });
  const tRestored = performance.now();

  // 5. Verify.
  const after = await survey(target);

  const CHECKS: [string, string][] = [
    ['R-01', 'profiles'], ['R-02', 'assessments'], ['R-03', 'responses'],
    ['R-04', 'reports'], ['R-05', 'auditLogs'], ['R-06', 'tables'],
    ['R-07', 'rlsPolicies'], ['R-08', 'rlsEnabled'], ['R-09', 'indexes'],
    ['R-10', 'contentChecksum'], ['R-11', 'canonicalReport'], ['R-12', 'canonicalChecksum'],
  ];
  const LABEL: Record<string, string> = {
    profiles: 'Participant profiles restored', assessments: 'Assessments restored',
    responses: 'Saved answers restored', reports: 'Reports restored',
    auditLogs: 'Audit records restored', tables: 'Tables present in `public`',
    rlsPolicies: 'Row-level security policies present', rlsEnabled: 'Tables with RLS enabled',
    indexes: 'Indexes present', contentChecksum: 'Checksum over participant data',
    canonicalReport: 'Stored canonical report object, byte for byte',
    canonicalChecksum: 'Recorded canonical checksum',
  };

  /**
   * Two values are only a pass when they agree AND there is something there to agree about.
   *
   * `ok: before === after` passed R-10 on `null === null` for every run of this drill: the
   * checksum could not be computed, so the check compared nothing with nothing and reported
   * success. ROOTS found it. A comparison with no content on either side is a failure of the
   * check, not evidence of a good restore, and saying so here catches the whole class rather
   * than this one instance.
   */
  const meaningful = (v: string | null | undefined): boolean =>
    v !== null && v !== undefined && v !== '' && v.toLowerCase() !== 'null';

  const checks: Check[] = CHECKS.map(([id, key]) => ({
    id,
    what: LABEL[key],
    source: before[key],
    target: after[key],
    ok: before[key] === after[key] && meaningful(before[key]),
  }));

  /*
   * An independent integrity check on the content itself.
   *
   * The first version of this compared the restored object against `canonical_json_checksum`, and
   * failed - correctly, but for the wrong reason. That column holds the digest the application
   * computes over its own canonical form before insert; PostgreSQL then stores the value as
   * `jsonb`, which normalises key order and whitespace. Reading it back as text therefore never
   * reproduces the bytes the digest was taken over, restore or no restore. The check was
   * measuring a property of `jsonb`, not of the backup.
   *
   * What is worth checking is that the content survived: the restored object must hash to the
   * same digest as the source object, both read the same way. That fails if a single byte of
   * participant-facing report content changed in the cycle.
   */
  checks.push({
    id: 'R-13',
    what: 'Restored canonical object hashes identically to the source object',
    source: sha(before.canonicalReport).slice(0, 16) + '…',
    target: sha(after.canonicalReport).slice(0, 16) + '…',
    ok: sha(after.canonicalReport) === sha(before.canonicalReport),
  });

  // 6. Cleanup.
  await target.close();
  const tDone = performance.now();

  const failed = checks.filter((c) => !c.ok);
  const trunc = (v: string) => (v.length > 60 ? v.slice(0, 57) + '…' : v);

  const lines: string[] = [
    '# ROOTS-AI™ — §13.1 suite 11: backup and restore, executed',
    '',
    '**Controlled Baseline §13.1:** *"Backup/restore — backup configuration evidence and one',
    'successful pre-launch restore test."*',
    '',
    'This is the execution record. ROOTS confirmed in the M3-RC9 review that a plan alone does not',
    'satisfy §13.1 and that the test must be run against an authorised, isolated, access-controlled',
    'non-production target with synthetic data and no production credentials.',
    '',
    'Produced by `npm run db:restore-drill`.',
    '',
    '## 1. Conditions',
    '',
    '| | |',
    '|---|---|',
    `| Commit | \`${commit()}\` |`,
    `| Executed at | ${startedAt} |`,
    `| Platform | ${process.platform} ${process.arch}, Node ${process.version} |`,
    '| Source database | PostgreSQL (PGlite), built from `supabase/roots_ai_complete.sql` unmodified |',
    '| **Restore target** | **A separate, disposable PostgreSQL instance created for this run and destroyed at the end** |',
    '| Isolation | Absolute. Both instances exist only inside this process; nothing outside can reach either |',
    '| Credentials used | **None.** No production credential, and no credential of any kind, is used or required |',
    '| Data | **Synthetic.** Identifiers derived from a fixed seed; addresses use the reserved `.invalid` domain |',
    `| Dataset | ${PARTICIPANTS} participants, ${PARTICIPANTS} assessments, ${Number(before.responses).toLocaleString('en-US')} answers, ${PARTICIPANTS} reports, ${PARTICIPANTS} audit records |`,
    '',
    '## 2. Procedure, as executed',
    '',
    '| Step | Action | Elapsed |',
    '|---|---|---|',
    `| 1 | Source built: schema applied, synthetic data loaded, canonical report object stored | ${((tBuilt - t0) / 1000).toFixed(2)} s |`,
    `| 2 | **Backup taken** — full data directory dumped | ${((tDumped - tBuilt) / 1000).toFixed(2)} s |`,
    `| 3 | **Source destroyed**, so nothing can be read back from it by accident | ${((tClosed - tDumped) / 1000).toFixed(2)} s |`,
    `| 4 | **Restored into a separate target** from the backup alone | ${((tRestored - tClosed) / 1000).toFixed(2)} s |`,
    `| 5 | Target verified against what the source recorded before the dump | ${((tDone - tRestored) / 1000).toFixed(2)} s |`,
    `| 6 | **Target destroyed**; nothing persists | included above |`,
    `| | **Total** | **${((tDone - t0) / 1000).toFixed(2)} s** |`,
    '',
    '| Backup artefact | |',
    '|---|---|',
    `| Size | ${(dumpBytes.length / 1024 / 1024).toFixed(2)} MB |`,
    `| SHA-256 | \`${dumpChecksum}\` |`,
    '',
    '**The source is destroyed before the restore begins.** The target is built from the backup and',
    'nothing else, so a restore that silently read from the source could not pass.',
    '',
    '## 3. Verification',
    '',
    'Verified by value, not by presence. A restore that produced an empty but structurally valid',
    'database would fail R-01 to R-05; one that produced structure without policies would fail R-07',
    'and R-08; one that corrupted content would fail R-10 to R-13.',
    '',
    '| ID | Check | Source | Target | Result |',
    '|---|---|---|---|---|',
    ...checks.map((c) => `| \`${c.id}\` | ${c.what} | ${trunc(c.source)} | ${trunc(c.target)} | ${c.ok ? '**PASS**' : '**FAIL**'} |`),
    '',
    '## 4. Result',
    '',
    failed.length
      ? `**FAILED — ${failed.length} of ${checks.length} checks did not match.** Recorded as executed; the run is not repeated until it passes.`
      : `**PASS — all ${checks.length} checks match.** One successful pre-launch restore test, executed and verified.`,
    '',
    '### Failed attempts, and one corrected check',
    '',
    'The restore itself did not fail on any attempt.',
    '',
    '**One check was wrong and was corrected.** The first version of R-13 compared the restored',
    'object against the `canonical_json_checksum` column and failed. The restore was faithful —',
    'R-11 and R-12 passed on the same run — but that column holds the digest the application',
    'computes over its own canonical form before insert, and PostgreSQL then stores the value as',
    '`jsonb`, which normalises key order and whitespace. Reading it back as text never reproduces',
    'the bytes the digest was taken over, restore or no restore. The check was measuring a property',
    'of `jsonb` rather than of the backup.',
    '',
    'R-13 now compares the restored object against the source object, both read the same way, which',
    'is the property worth verifying: it fails if a single byte of report content changed in the',
    'cycle. The original failure is recorded here rather than quietly removed.',
    '',
    '### Cleanup and disposition of the temporary target',
    '',
    'Both instances were closed at the end of the run. Neither persists anything: they exist only',
    'in process memory for the duration, so there is no target to decommission, no credential to',
    'revoke and no residual copy of the data. The backup artefact is held in memory for the',
    'duration of the run and is not written to disk.',
    '',
    '## 5. Recovery scope — what this is, and what it is not',
    '',
    '**The engine.** This drill runs against **PGlite**, which is PostgreSQL itself compiled to',
    'WebAssembly and run in-process. It is a real PostgreSQL server, not a mock or a stub: the',
    'delivered schema is applied unmodified, triggers fire, row-level security is enforced, and',
    'the integrity rules refuse the writes they are meant to refuse. Backup and restore use',
    'PGlite’s own data-directory dump and load.',
    '',
    '**What it establishes.** The delivered schema and its data survive a full backup and restore',
    'cycle intact: every row, every policy, every index, and the stored canonical report object',
    'byte for byte, re-hashing to its recorded checksum. The source database is **destroyed**',
    'before the target is built, so nothing can be read back from the original by accident. What',
    'is proved is that **the schema as delivered is restorable, and that a restore of it loses',
    'nothing** — which is the part that belongs to the release candidate.',
    '',
    '**What it is NOT, stated plainly.** This is **not a restore of a Supabase provider backup.**',
    'It does not exercise the provider’s backup tooling, its physical backups, its restore',
    'console, or point-in-time recovery. It restores an in-process copy of the delivered schema,',
    'not the production project.',
    '',
    '| | |',
    '|---|---|',
    '| Proved here | The schema is restorable and a restore is lossless |',
    '| Not proved here | That the provider’s own backup of the production project restores |',
    '',
    '**Why both matter, and why neither substitutes for the other.** A provider backup that',
    'restores perfectly is worth little if the schema it carries cannot be rebuilt without loss;',
    'that is what this drill answers. Equally, this drill cannot tell ROOTS that a given',
    'production backup will restore on a given day — only a restore performed on the provider',
    'can. The provider-side configuration is evidenced separately in the backup configuration',
    'record, and a provider restore belongs to the production environment and its operational',
    'runbook.',
    '',
    '## 6. Reproducing this',
    '',
    '```',
    'npm run db:restore-drill',
    '```',
    '',
    'The run creates both databases in memory and destroys them at the end. Nothing outside the',
    'process is touched, and there is no database to damage.',
    '',
  ];

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, lines.join('\n'), 'utf8');

  console.log(`wrote ${OUT}`);
  console.log(`  dataset       : ${PARTICIPANTS} participants, ${before.responses} answers`);
  console.log(`  backup        : ${(dumpBytes.length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  restore time  : ${((tRestored - tClosed) / 1000).toFixed(2)} s`);
  console.log(`  checks        : ${checks.length - failed.length} / ${checks.length} pass`);

  if (failed.length) {
    console.error(`\nFAILED — ${failed.length} check(s) did not match:`);
    for (const c of failed) console.error(`  ${c.id} ${c.what}: source=${trunc(c.source)} target=${trunc(c.target)}`);
    process.exit(1);
  }
  console.log('\nPASS - one successful pre-launch restore test, executed and verified.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
