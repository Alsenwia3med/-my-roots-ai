/**
 * Projection branch coverage — Master Requirements §13.1 suite 1.
 *
 * `buildProjection` decides what the narrative model is allowed to see. Its fallbacks and null
 * paths are the boundary itself, so they are covered explicitly rather than incidentally.
 *
 * The AI boundary rules are asserted in tests/ai/boundary.test.ts; this file covers the
 * per-field branches of the projection builder.
 */

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { buildProjection, type ProjectionInput } from '../../lib/ai/projection';
import { driverName } from '../../lib/report/build';
import golden from '../../lib/scoring/c02-golden-tests.json';
import { computeScores, type NormalizedInput, type ScoringResult } from '../../lib/scoring/engine';

const scoringFor = (id: string): ScoringResult =>
  computeScores(golden.cases.find((c) => c.test_id === id)!.input as unknown as NormalizedInput);

const input = (scoring: ScoringResult, over: Partial<ProjectionInput> = {}): ProjectionInput => ({
  scoring,
  driverLabels: Object.fromEntries(scoring.drivers.map((d) => [d, driverName(d)])),
  biologicalStateClassification: 'Strained',
  protectiveFactors: [{ id: 'P1', label: 'Sleep regularity' }],
  freeTextPresent: false,
  questionnaireVersion: '1.0.1',
  reportTemplateVersion: '1.0.1',
  ...over,
});

describe('buildProjection field branches', () => {
  test('a driver with a supplied label uses it', () => {
    const scoring = scoringFor('GT-013');
    const p = buildProjection(input(scoring));
    assert.equal(p.drivers.length, scoring.drivers.length);
    for (const d of p.drivers) assert.equal(d.label, driverName(d.id));
  });

  test('a driver with no supplied label falls back to its id, rather than showing nothing', () => {
    const scoring = scoringFor('GT-013');
    assert.ok(scoring.drivers.length > 0, 'this case must produce a driver');
    const p = buildProjection(input(scoring, { driverLabels: {} }));
    for (const d of p.drivers) assert.equal(d.label, d.id);
  });

  test('a domain with no classification projects null, not a guessed label', () => {
    const scoring = scoringFor('GT-020');
    const p = buildProjection(input(scoring));
    const nulls = p.domains.filter((d) => d.score === null);
    assert.ok(nulls.length > 0, 'this case must produce a null domain');
    for (const d of nulls) assert.equal(d.classification, null);
  });

  test('a scored domain projects its classification label', () => {
    const p = buildProjection(input(scoringFor('GT-013')));
    for (const d of p.domains.filter((x) => x.score !== null)) {
      assert.equal(typeof d.classification, 'string');
    }
  });

  test('a null Biological State classification is carried as null', () => {
    const p = buildProjection(input(scoringFor('GT-020'), { biologicalStateClassification: null }));
    assert.equal(p.biological_state_classification, null);
  });

  test('all seven domains are projected, in the fixed display order', () => {
    const p = buildProjection(input(scoringFor('GT-001')));
    assert.deepEqual(
      p.domains.map((d) => d.domain_id),
      ['MR', 'HS', 'SR', 'CH', 'SL', 'IB', 'BS'],
    );
  });

  test('free text is projected as a boolean only, in both states', () => {
    const scoring = scoringFor('GT-001');
    assert.equal(buildProjection(input(scoring, { freeTextPresent: true })).free_text_present, true);
    assert.equal(buildProjection(input(scoring, { freeTextPresent: false })).free_text_present, false);
  });

  test('no protective factor projects an empty list rather than being omitted', () => {
    const p = buildProjection(input(scoringFor('GT-001'), { protectiveFactors: [] }));
    assert.deepEqual(p.protective_factors, []);
  });

  test('limitations are copied, not shared with the scoring result', () => {
    const scoring = scoringFor('GT-001');
    const p = buildProjection(input(scoring));
    assert.deepEqual(p.limitations, scoring.limitations);
    assert.notEqual(p.limitations, scoring.limitations, 'the array must be a copy');
  });

  test('versions are carried from the inputs, not invented', () => {
    const scoring = scoringFor('GT-001');
    const p = buildProjection(input(scoring, { questionnaireVersion: '9.9.9', reportTemplateVersion: '8.8.8' }));
    assert.equal(p.versions.questionnaire_version, '9.9.9');
    assert.equal(p.versions.report_template_version, '8.8.8');
    assert.equal(p.versions.scoring_version, scoring.scoring_version);
  });

  test('the scale note states the direction, so numbers cannot be read backwards', () => {
    const p = buildProjection(input(scoringFor('GT-001')));
    assert.match(p.scale_note, /HIGHER score means MORE reported burden/);
  });

  test('a no-driver result projects an empty driver list', () => {
    const scoring = scoringFor('GT-001');
    if (scoring.drivers.length === 0) assert.deepEqual(buildProjection(input(scoring)).drivers, []);
    const none = golden.cases
      .map((c) => computeScores(c.input as unknown as NormalizedInput))
      .find((s) => s.drivers.length === 0)!;
    assert.deepEqual(buildProjection(input(none)).drivers, []);
  });
});
