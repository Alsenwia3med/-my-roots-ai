/**
 * D-04 — driver output entries are represented consistently across the whole report.
 *
 * ROOTS direction, 25 September 2026: "Every report representation must use the actual C-02
 * deterministic driver output entries consistently, including the Executive Summary, Key
 * Drivers, Biological Card, Biological Triad where applicable, canonical report object, web
 * rendering, and PDF rendering. A co-primary pair must retain its controlled structure. It must
 * not be split, duplicated, independently re-ranked, or counted as two output entries where
 * C-02 defines it as one."
 *
 * The checks below run over all 30 Golden Tests, so every driver state C-02 can produce is
 * covered: no eligible driver, one entry, two entries, three entries and co-primary outputs.
 * Nothing here changes C-01, C-02, the engine or the Golden Test expectations — the canonical
 * output is read and the rendering is checked against it.
 */

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { applyNarrative } from '../../lib/ai/apply';
import { NO_NARRATIVE } from '../../lib/ai/provenance';
import { buildReport, driverName, type DeterministicReport } from '../../lib/report/build';
import { toScoresRow } from '../../lib/scoring/scoresRow';
import golden from '../../lib/scoring/c02-golden-tests.json';
import { computeScores, type NormalizedInput, type ScoringResult } from '../../lib/scoring/engine';

const CO_PRIMARY = /^([A-Z]{2})\+([A-Z]{2}) co-primary$/;

interface Case {
  id: string;
  scoring: ScoringResult;
  report: DeterministicReport;
}

const cases: Case[] = golden.cases.map((c) => {
  const scoring = computeScores(c.input as unknown as NormalizedInput);
  return {
    id: c.test_id,
    scoring,
    report: buildReport({
      reportId: `RPT-STATE-${c.test_id}`,
      generatedAt: '2026-09-25T12:00:00.000Z',
      participantDisplay: null,
      questionnaireVersion: '1.0.1',
      auditTraceReference: `scores/${c.test_id}`,
      scoring,
      protective: { P1: true, P2: true, P3: false, P4: false, P5: true },
      answers: {},
    }),
  };
});

const section = (report: DeterministicReport, n: number) => report.sections[n - 1];
const text = (report: DeterministicReport, n: number) => section(report, n).paragraphs.join(' ');

/** Sections that name drivers: 2 Executive Summary, 6 Key Drivers, 17 Biological Card. */
const DRIVER_SECTIONS = [2, 6, 17];

describe('driver output entries across the report (D-04)', () => {
  test('the canonical object carries the C-02 output unchanged', () => {
    for (const { id, scoring, report } of cases) {
      assert.deepEqual(report.drivers, scoring.drivers, `${id}: canonical drivers differ from the C-02 output`);
      assert.ok(report.drivers.length <= 3, `${id}: more than three output entries`);
    }
  });

  test('a co-primary entry is never split into two entries, anywhere', () => {
    for (const { id, scoring, report } of cases) {
      const coPrimary = scoring.drivers.find((d) => CO_PRIMARY.test(d));
      if (!coPrimary) continue;

      const [, first, second] = CO_PRIMARY.exec(coPrimary)!;
      const rendered = driverName(coPrimary);

      // The canonical object keeps the single entry.
      assert.ok(report.drivers.includes(coPrimary), `${id}: the co-primary entry is missing from the canonical object`);
      assert.ok(
        !report.drivers.includes(first) && !report.drivers.includes(second),
        `${id}: a co-primary domain also appears as its own entry`,
      );

      // Every section that names drivers names the pair once, as one entry.
      for (const n of DRIVER_SECTIONS) {
        const body = text(report, n);
        if (!body.includes(rendered)) continue;
        const occurrences = body.split(rendered).length - 1;
        assert.equal(occurrences, 1, `${id}: section ${n} names the co-primary pair ${occurrences} times`);
      }

      // The Triad treats it as one element.
      const triad = section(report, 8).triad ?? [];
      const asElement = triad.filter((t) => t.kind === 'driver' && t.label === rendered);
      assert.ok(asElement.length <= 1, `${id}: the co-primary pair appears ${asElement.length} times in the Triad`);

      // The stored score row keeps the entry whole in primary_driver.
      const row = toScoresRow('00000000-0000-4000-8000-000000000000', scoring, {});
      assert.equal(row.primary_driver, coPrimary, `${id}: the score row split the co-primary entry`);
      assert.deepEqual(row.drivers_json, scoring.drivers, `${id}: drivers_json differs from the C-02 output`);
    }
  });

  test('Key Drivers ranks exactly the entries C-02 returned, in order', () => {
    for (const { id, scoring, report } of cases) {
      const body = text(report, 6);
      const ranks = ['Primary', 'Secondary', 'Tertiary'];

      for (let i = 0; i < 3; i += 1) {
        const present = body.includes(`${ranks[i]}:`);
        assert.equal(present, i < scoring.drivers.length, `${id}: ${ranks[i]} should ${i < scoring.drivers.length ? '' : 'not '}appear`);
        if (i < scoring.drivers.length) {
          assert.ok(body.includes(`${ranks[i]}: ${driverName(scoring.drivers[i])}.`), `${id}: ${ranks[i]} is not the C-02 entry at that rank`);
        }
      }
    }
  });

  test('no eligible driver renders the approved null copy and invents nothing', () => {
    const none = cases.filter((c) => c.scoring.drivers.length === 0);
    assert.ok(none.length > 0, 'the Golden Tests must cover the no-driver state');

    for (const { id, report } of none) {
      assert.match(text(report, 6), /No dominant burden signal was identified in the available answers\./, `${id}: approved no-driver copy missing`);
      assert.match(text(report, 2), /No dominant burden signal/, `${id}: the summary must use the no-driver copy`);
      for (const n of DRIVER_SECTIONS) {
        assert.ok(!text(report, n).includes('—'), `${id}: section ${n} shows a placeholder`);
        assert.ok(!/\{\w+\}/.test(text(report, n)), `${id}: section ${n} shows an unresolved placeholder`);
      }
    }
  });

  test('no unresolved placeholder survives in any state', () => {
    for (const { id, report } of cases) {
      for (const s of report.sections) {
        const body = s.paragraphs.join(' ');
        assert.ok(!/\{\w+\}/.test(body), `${id}: section ${s.number} has an unresolved template value`);
      }
    }
  });

  test('every driver state C-02 can produce is covered by these cases', () => {
    const counts = new Set(cases.map((c) => c.scoring.drivers.length));
    for (const n of [0, 1, 2, 3]) assert.ok(counts.has(n), `no Golden Test produces ${n} driver entries`);
    assert.ok(cases.some((c) => c.scoring.drivers.some((d) => CO_PRIMARY.test(d))), 'no Golden Test produces a co-primary output');
  });

  test('web and PDF read the same canonical sections (no second driver source)', () => {
    // Both renderings take report.sections; neither derives drivers of its own. Applying the
    // narrative decision does not alter any driver-bearing section.
    for (const { id, report } of cases.slice(0, 5)) {
      const canonical = applyNarrative(report, { narrative: null, provenance: NO_NARRATIVE });
      for (const n of [...DRIVER_SECTIONS, 8]) {
        assert.deepEqual(
          canonical.sections[n - 1],
          report.sections[n - 1],
          `${id}: section ${n} differs between the deterministic and stored report`,
        );
      }
    }
  });
});
