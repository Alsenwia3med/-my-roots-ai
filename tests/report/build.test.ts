/**
 * Canonical report builder against the C-03 acceptance checks (§10):
 *   RPT-01  all 19 sections; scores, drivers and versions match the scoring result exactly
 *   RPT-02  null / missing states use approved copy and are never imputed
 *   RPT-03  no prohibited diagnostic or prescriptive claim
 *   RPT-07  narrative sections use the deterministic fallback; full disclaimer present
 * plus determinism of the canonical hash.
 */

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { computeScores, type NormalizedInput } from '../../lib/scoring/engine';
import { buildReport, type DeterministicReport } from '../../lib/report/build';
import { canonicalStringify, reportChecksum } from '../../lib/report/canonical';
import { COPY, DOMAIN_LABELS, SECTION_TITLES, disclaimerGroups } from '../../lib/report/c03-content';
import golden from '../../lib/scoring/c02-golden-tests.json';

function reportFor(testId: string, answers: Record<string, never> = {}): { report: DeterministicReport; input: NormalizedInput } {
  const input = golden.cases.find((c) => c.test_id === testId)!.input as unknown as NormalizedInput;
  const scoring = computeScores(input);
  const report = buildReport({
    reportId: `RPT-TEST-${testId}`,
    generatedAt: '2026-09-21T00:00:00.000Z',
    participantDisplay: null,
    questionnaireVersion: '1.0.0',
    auditTraceReference: `scores:${testId}`,
    scoring,
    protective: { P1: input.P1, P2: input.P2, P3: input.P3, P4: input.P4, P5: input.P5 },
    answers,
  });
  return { report, input };
}

const text = (r: DeterministicReport) => canonicalStringify(r);
const section = (r: DeterministicReport, n: number) => r.sections[n - 1];

describe('RPT-01 structure and fidelity', () => {
  test('exactly 19 sections, numbered 1-19, with the C-03 titles in order', () => {
    const { report } = reportFor('GT-030');
    assert.deepEqual(report.sections.map((s) => s.number), Array.from({ length: 19 }, (_, i) => i + 1));
    assert.deepEqual(report.sections.map((s) => s.title), SECTION_TITLES);
  });

  test('scores and drivers are copied from the scoring result exactly', () => {
    const { report, input } = reportFor('GT-030');
    const scoring = computeScores(input);
    assert.deepEqual(report.domain_scores, { MR: 75, HS: 100, SR: 25, CH: 50, SL: 100, IB: 75, BS: 100 });
    assert.equal(report.biological_state, scoring.biological_state);
    assert.equal(report.opportunity_score, scoring.opportunity);
    assert.equal(report.recovery_potential, scoring.recovery_potential);
    assert.deepEqual(report.drivers, scoring.drivers);
    assert.equal(report.confidence.score, scoring.confidence);
  });

  test('carries every canonical top-level key C-03 §9 requires', () => {
    const { report } = reportFor('GT-030');
    for (const key of [
      'report_id', 'participant_display', 'generated_at', 'questionnaire_version', 'scoring_version',
      'report_template_version', 'narrative_template_version', 'domain_scores', 'biological_state',
      'opportunity_score', 'recovery_potential', 'confidence', 'drivers', 'protective_factors',
      'limitations', 'sections', 'disclaimer_version', 'audit_trace_reference',
    ]) {
      assert.ok(key in report, `missing ${key}`);
    }
  });

  test('section 7 bars are in the fixed order MR, HS, SR, CH, SL, IB, BS', () => {
    const { report } = reportFor('GT-030');
    assert.deepEqual(section(report, 7).bars!.map((b) => b.domain_id), ['MR', 'HS', 'SR', 'CH', 'SL', 'IB', 'BS']);
  });

  test('a co-primary driver names both domains', () => {
    const { report } = reportFor('GT-002');
    assert.match(section(report, 6).paragraphs[0], new RegExp(`Primary: ${DOMAIN_LABELS.MR} and ${DOMAIN_LABELS.HS} \\(co-primary\\)`));
  });

  test('the participant defaults to "Participant" when no display name exists', () => {
    assert.equal(reportFor('GT-030').report.participant_display, 'Participant');
  });
});

describe('RPT-02 null and missing states are never imputed', () => {
  test('a null domain shows "Not enough information" and is listed as a limitation', () => {
    const { report } = reportFor('GT-017'); // SL null
    assert.equal(report.domain_scores.SL, null);
    assert.ok(section(report, 7).paragraphs.some((p) => p === `${DOMAIN_LABELS.SL}: ${COPY.domainNull}.`));
    assert.ok(report.limitations.some((l) => l.code === 'DOMAIN_NOT_AVAILABLE_SL'));
    assert.equal(section(report, 7).bars!.find((b) => b.domain_id === 'SL')!.score, null);
  });

  test('a null Biological State leaves State, Opportunity and Recovery unavailable', () => {
    const { report } = reportFor('GT-020');
    assert.equal(report.biological_state, null);
    assert.equal(report.opportunity_score, null);
    assert.equal(report.recovery_potential, null);
    assert.match(section(report, 3).paragraphs[0], /Not enough information/);
    assert.match(section(report, 4).paragraphs[0], /Not enough information/);
    assert.ok(report.limitations.some((l) => l.code === 'BIOLOGICAL_STATE_NOT_AVAILABLE'));
  });

  test('confidence never conceals missing domains', () => {
    const { report } = reportFor('GT-019'); // MR and SR null
    const missing = section(report, 5).items!.find((i) => i.label === 'Areas without enough information')!;
    assert.match(missing.value!, new RegExp(DOMAIN_LABELS.MR));
    assert.match(missing.value!, new RegExp(DOMAIN_LABELS.SR));
  });

  test('no dominant burden: approved no-driver copy, and no micro-actions invented', () => {
    const { report } = reportFor('GT-022');
    assert.equal(section(report, 6).paragraphs[0], COPY.noDriver);
    assert.deepEqual(section(report, 12).items, []);
  });

  test('no protective factors: approved "may reflect missing data" copy', () => {
    const { report } = reportFor('GT-026');
    assert.equal(section(report, 13).paragraphs[0], COPY.noProtective);
    assert.deepEqual(report.protective_factors, []);
  });

  test('no NaN or Infinity anywhere', () => {
    for (const c of golden.cases) {
      const t = text(reportFor(c.test_id).report);
      assert.ok(!/NaN|Infinity/.test(t), `${c.test_id} contains NaN or Infinity`);
    }
  });
});

describe('RPT-03 no prohibited claims', () => {
  const PROHIBITED = [/\byou have\b/i, /\bthis proves\b/i, /\bcures?\b/i, /\bsleep apn(o)?ea\b/i, /\bhs-?CRP\b/i, /\bguaranteed\b/i];

  // The prohibition targets claims the report generates. Two sections are verbatim sources and
  // are excluded: 16 quotes C-01's approved question wording and the participant's own answers
  // exactly as submitted, and 19 is C-03's fixed disclaimer (checked word for word below).
  // Both legitimately contain "you have" ("Have you been told … that you have …",
  // "If you have severe … symptoms").
  const generated = (r: DeterministicReport) => text({ ...r, sections: r.sections.filter((s) => s.number !== 16 && s.number !== 19) });

  for (const c of golden.cases) {
    test(`${c.test_id} report contains no prohibited phrase`, () => {
      const t = generated(reportFor(c.test_id).report);
      for (const p of PROHIBITED) assert.ok(!p.test(t), `${c.test_id} matched ${p}`);
    });
  }

  test('the laboratory prompts never name sleep apnoea or recommend hs-CRP, even when every prompt applies', () => {
    const answers = { Q13: ['T2D', 'THYROID', 'HTN'] } as unknown as Record<string, never>;
    const { report } = reportFor('GT-002', answers); // every domain 100: every rule fires
    const lab = section(report, 15);
    assert.equal(lab.items!.length, 5, 'all five discussion prompts are eligible');
    assert.ok(!/sleep apn(o)?ea|hs-?CRP/i.test(canonicalStringify(lab)));
  });
});

describe('RPT-07 fallback and disclaimer', () => {
  test('governed-narrative sections use the approved deterministic fallback', () => {
    const { report } = reportFor('GT-030');
    for (const n of [2, 9, 18]) assert.equal(section(report, n).source, 'deterministic_fallback');
    assert.equal(section(report, 9).paragraphs[0], COPY.futureProjection);
    assert.equal(section(report, 18).paragraphs[0], COPY.finalWord);
  });

  /*
   * Review point 27 restructured section 19 into four headed groups. The requirement is
   * unchanged (C-03 §4.19: in full, never truncated), so the test asserts the requirement
   * rather than the old single-paragraph shape: re-joining the groups must reproduce the
   * approved text character for character.
   */
  test('the full disclaimer is present, untruncated', () => {
    const s19 = section(reportFor('GT-030').report, 19);
    const groups = s19.items ?? [];
    assert.equal(groups.length, 4, 'the disclaimer must be shown as the four approved groups');
    assert.deepEqual(
      groups.map((g) => g.label),
      ['What this report is', 'What this report is not', 'How AI is used', 'When professional or urgent care is appropriate'],
    );
    assert.equal(groups.map((g) => g.note).join(' '), COPY.disclaimer);
    assert.deepEqual(s19.paragraphs, [], 'the approved text must not also appear as a paragraph');
  });

  test('the disclaimer grouping refuses to run if the approved text changes shape', () => {
    // disclaimerGroups() is the guard: it throws rather than silently dropping a clause.
    assert.doesNotThrow(() => disclaimerGroups());
    assert.equal(disclaimerGroups().map((g) => g.text).join(' '), COPY.disclaimer);
  });
});

describe('canonical hash', () => {
  test('the same inputs always give the same hash', () => {
    assert.equal(reportChecksum(reportFor('GT-030').report), reportChecksum(reportFor('GT-030').report));
  });

  test('the hash does not depend on property order', () => {
    assert.equal(reportChecksum({ a: 1, b: { c: 2, d: 3 } }), reportChecksum({ b: { d: 3, c: 2 }, a: 1 }));
  });

  test('different scores give a different hash', () => {
    assert.notEqual(reportChecksum(reportFor('GT-030').report), reportChecksum(reportFor('GT-029').report));
  });
});

// ------------------------------------------------- C-03 v1.0.1 §4/§5 driver and triad rules

describe('driver cardinality and Triad fallback (C-03 v1.0.1 §4, §5)', () => {
  const reports = golden.cases.map((c) => ({ id: c.test_id, ...reportFor(c.test_id) }));

  test('Key Drivers renders exactly the C-02 output — never padded, never an em dash', () => {
    for (const { id, report } of reports) {
      const text = section(report, 6).paragraphs.join(' ');
      assert.ok(!text.includes('—'), `${id}: a placeholder driver was rendered`);

      const count = report.drivers.length;
      assert.equal(text.includes('Primary:'), count >= 1, `${id}: Primary should appear only with a driver`);
      assert.equal(text.includes('Secondary:'), count >= 2, `${id}: Secondary must not be invented`);
      assert.equal(text.includes('Tertiary:'), count >= 3, `${id}: Tertiary must not be invented`);
    }
  });

  test('the Executive Summary adapts to how many drivers exist', () => {
    for (const { id, report } of reports) {
      const text = section(report, 2).paragraphs.join(' ');
      assert.ok(!text.includes('—'), `${id}: the summary padded a missing driver`);
      if (report.drivers.length === 0) {
        assert.ok(text.includes('No dominant burden signal'), `${id}: expected the approved no-driver copy`);
      } else {
        // Wording approved by ROOTS on 25 September 2026. "Strongest area(s)" was rejected:
        // it can read as the participant's healthiest areas, which a driver is not.
        assert.ok(text.includes('highest-ranked driver'), `${id}: expected the approved summary wording`);
        assert.ok(!text.includes('strongest area'), `${id}: unapproved "strongest area" wording`);
      }
    }
  });

  test('a co-primary pair is one driver entry and is never duplicated', () => {
    for (const { id, report } of reports) {
      const ids = report.drivers.flatMap((d) => {
        const co = d.match(/^([A-Z]{2})\+([A-Z]{2}) co-primary$/);
        return co ? [co[1], co[2]] : [d];
      });
      assert.equal(new Set(ids).size, ids.length, `${id}: a domain appears twice across drivers`);
      assert.ok(report.drivers.length <= 3, `${id}: more than three driver entries`);
    }
  });

  test('a co-primary pair is one Triad element, not two', () => {
    for (const { id, report } of reports) {
      const coPrimary = report.drivers.find((d) => d.includes('co-primary'));
      if (!coPrimary) continue;
      const triad = section(report, 8).triad ?? [];
      const drivers = triad.filter((t) => t.kind === 'driver');
      const pair = drivers.find((d) => d.label.includes('co-primary'));
      assert.ok(pair, `${id}: the co-primary output should appear as one element`);
      // Both domains are named within that single element.
      assert.ok(pair!.label.includes(' and '), `${id}: the co-primary element must name both domains`);
    }
  });

  test('the Triad shows only verified elements, reducing rather than inventing', () => {
    for (const { id, report } of reports) {
      const triad = section(report, 8).triad ?? [];
      const drivers = triad.filter((t) => t.kind === 'driver');
      const protective = triad.filter((t) => t.kind === 'protective');

      assert.ok(triad.length >= 1 && triad.length <= 3, `${id}: triad has ${triad.length} elements`);
      assert.ok(drivers.length <= 2, `${id}: triad shows more than two driver elements`);
      assert.ok(protective.length <= 1, `${id}: triad shows more than one protective factor`);

      // Every named protective element must actually be present on the report.
      for (const p of protective) {
        assert.ok(
          report.protective_factors.some((f) => f.label.toLowerCase() === p.label.toLowerCase()),
          `${id}: triad named a protective factor the report does not hold`,
        );
      }
      // An unavailable slot is only ever used when there is nothing at all to show.
      const unavailable = triad.filter((t) => t.kind === 'unavailable');
      if (unavailable.length) assert.equal(triad.length, 1, `${id}: padded the triad with unavailable slots`);
    }
  });

  test('the Triad never claims causation', () => {
    for (const { id, report } of reports) {
      const text = section(report, 8).paragraphs.join(' ');
      assert.ok(text.includes('not causes'), `${id}: the approved relationship note is missing`);
      assert.ok(!/\bcauses your|\bleads to|\bresults in/.test(text), `${id}: causal wording in the triad`);
    }
  });
});
