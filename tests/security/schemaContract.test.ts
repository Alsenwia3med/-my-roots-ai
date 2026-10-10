/**
 * Every column the application selects must exist in the delivered schema.
 *
 * ROOTS review of 29 September 2026, item B2: "Please provide a regression test that would fail
 * if the export query and deployed schema diverged again."
 *
 * The defect it refers to: `lib/privacy/data.ts` selected `responses.updated_at`, a column the
 * schema defines as `answered_at`. Every participant's GDPR Article 15 and 20 download returned
 * 503, in every environment, and 359 passing tests said nothing — because no test compared a
 * query against the schema, and the failure only appeared when a real database rejected it.
 *
 * This reads `supabase/roots_ai_complete.sql` for the real column set of every table, then reads
 * every `.from('table').select('columns')` in the application and checks each named column
 * exists. It needs no database, so it runs in the ordinary suite, and it fails on the exact class
 * of mistake that shipped.
 */

import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';

const ROOT = join(import.meta.dirname, '..', '..');
const SCHEMA = join(ROOT, 'supabase', 'roots_ai_complete.sql');

/** table -> column names, parsed from the CREATE TABLE statements of the delivered schema. */
function schemaColumns(): Map<string, Set<string>> {
  const sql = readFileSync(SCHEMA, 'utf8');
  const tables = new Map<string, Set<string>>();

  for (const m of sql.matchAll(/CREATE TABLE IF NOT EXISTS\s+public\.(\w+)\s*\(([\s\S]*?)\n\);/g)) {
    const [, table, body] = m;
    const columns = new Set<string>();
    for (const rawLine of body.split('\n')) {
      const line = rawLine.trim();
      // Skip comments and table-level constraints, which are not columns.
      if (!line || line.startsWith('--') || /^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT|EXCLUDE)\b/i.test(line)) continue;
      const name = /^([a-z_][a-z0-9_]*)\s/i.exec(line)?.[1];
      if (name) columns.add(name.toLowerCase());
    }
    tables.set(table.toLowerCase(), columns);
  }

  // Columns added after table creation still belong to the table.
  for (const m of sql.matchAll(/ALTER TABLE\s+public\.(\w+)\s+ADD COLUMN IF NOT EXISTS\s+(\w+)/gi)) {
    tables.get(m[1].toLowerCase())?.add(m[2].toLowerCase());
  }

  return tables;
}

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, found);
    else if (/\.tsx?$/.test(entry)) found.push(full);
  }
  return found;
}

interface Query {
  file: string;
  table: string;
  columns: string[];
}

/**
 * Finds `.from('table')` followed by `.select('a, b, c')`. The select may be chained directly or
 * after a line break, which is how most of these are written.
 */
function queries(): Query[] {
  const out: Query[] = [];
  for (const file of [...sourceFiles(join(ROOT, 'lib')), ...sourceFiles(join(ROOT, 'app'))]) {
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/\.from\('(\w+)'\)\s*(?:\r?\n\s*)?\.select\(\s*'([^']*)'/g)) {
      const [, table, list] = m;
      // `*` and aggregate/embedded forms name no specific column.
      if (list.trim() === '*' || list.includes('(')) continue;
      const columns = list
        .split(',')
        .map((raw) => {
          // PostgREST writes an alias as `alias:source`, so the real column is what follows the
          // colon, not what precedes it. Reading the alias as the column name reported
          // `reports.failure_code` as missing when the query in fact selects
          // `generation_metadata->>failure_code`.
          const source = raw.includes(':') ? raw.slice(raw.indexOf(':') + 1) : raw;
          return source.trim().toLowerCase();
        })
        // A JSON path selects from a column this check has already accepted by its own name, and
        // the key inside the document is not a column at all.
        .filter((c) => c && c !== '*' && !c.includes('->'))
        .map((c) => c.split(/\s/)[0]);
      if (columns.length) out.push({ file: file.slice(ROOT.length + 1).replace(/\\/g, '/'), table: table.toLowerCase(), columns });
    }
  }
  return out;
}

const TABLES = schemaColumns();
const QUERIES = queries();

/** Tables Supabase owns; the application schema does not define them. */
const EXTERNAL_TABLES = new Set(['users']);

describe('the application and the delivered schema agree (ROOTS item B2)', () => {
  test('the schema parser found the expected tables', () => {
    for (const expected of ['profiles', 'assessments', 'responses', 'scores', 'reports', 'consents', 'audit_logs']) {
      assert.ok(TABLES.has(expected), `parsed no columns for ${expected}; the parser, not the schema, is wrong`);
      assert.ok((TABLES.get(expected)?.size ?? 0) > 2, `${expected} parsed with too few columns`);
    }
  });

  test('the query scanner found the application queries', () => {
    assert.ok(QUERIES.length >= 20, `found only ${QUERIES.length} column-listing queries; the scanner is not matching`);
  });

  test('every selected column exists in the schema', () => {
    const missing: string[] = [];

    for (const q of QUERIES) {
      if (EXTERNAL_TABLES.has(q.table)) continue;
      const columns = TABLES.get(q.table);
      if (!columns) {
        missing.push(`${q.file}: selects from "${q.table}", which the schema does not define`);
        continue;
      }
      for (const column of q.columns) {
        if (!columns.has(column)) {
          missing.push(`${q.file}: ${q.table}.${column} does not exist in the schema`);
        }
      }
    }

    assert.deepEqual(missing, [], `\n  ${missing.join('\n  ')}\n`);
  });

  test('the participant data export selects only columns the schema defines', () => {
    // The specific query that shipped broken, checked by name so it cannot regress quietly.
    const exportQueries = QUERIES.filter((q) => q.file.endsWith('lib/privacy/data.ts'));
    assert.ok(exportQueries.length >= 3, `expected the export to query several tables, found ${exportQueries.length}`);

    for (const q of exportQueries) {
      const columns = TABLES.get(q.table);
      assert.ok(columns, `the export reads "${q.table}", which the schema does not define`);
      for (const column of q.columns) {
        assert.ok(columns!.has(column), `the export reads ${q.table}.${column}, which does not exist`);
      }
    }
  });

  test('the column that caused the defect is still named as the schema defines it', () => {
    const responses = TABLES.get('responses');
    assert.ok(responses?.has('answered_at'), 'responses.answered_at is missing from the schema');
    assert.ok(!responses?.has('updated_at'), 'responses.updated_at exists now — this test needs revisiting');

    const exportSource = readFileSync(join(ROOT, 'lib', 'privacy', 'data.ts'), 'utf8');
    assert.ok(
      !/from\('responses'\)[\s\S]{0,120}updated_at/.test(exportSource),
      'the export selects responses.updated_at again',
    );
  });
});
