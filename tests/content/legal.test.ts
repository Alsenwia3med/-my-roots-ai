/**
 * Governed legal content (C-04 §§4-8).
 *
 * These are structural checks — every section present, in order, nothing abridged. That the
 * wording is C-04 *verbatim* is proven separately, against the controlled PDF itself:
 *
 *     python scripts/canonical/check_c04.py
 *
 * which reads the same strings this file imports and fails on any paraphrase.
 */

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  AI_DISCLAIMER,
  COOKIE_BANNER,
  COOKIE_CATEGORIES,
  COOKIES,
  LEGAL_DOCUMENTS,
  LEGAL_VERSION,
  MEDICAL_DISCLAIMER,
  PRIVACY,
  TERMS,
} from '../../lib/content/c04-legal';

describe('C-04 legal content', () => {
  test('all five governed notices exist, on their C-04 routes', () => {
    assert.deepEqual(
      LEGAL_DOCUMENTS.map((d) => d.route),
      ['/privacy', '/terms', '/cookies', '/medical-disclaimer', '/ai-disclaimer'],
    );
  });

  test('the Privacy Notice carries all fourteen C-04 sections, in order', () => {
    assert.deepEqual(
      PRIVACY.blocks.map((b) => b.heading),
      [
        'Who we are',
        'Data we collect',
        'Why we use it',
        'Sensitive data',
        'Research',
        'Providers and transfers',
        'AI use',
        'Retention',
        'Security',
        'Your choices and rights',
        'Cookies and analytics',
        'Children',
        'Contact',
        'Updates',
      ],
    );
  });

  test('the Terms carry all thirteen C-04 sections, in order', () => {
    assert.deepEqual(
      TERMS.blocks.map((b) => b.heading),
      [
        'Agreement and eligibility',
        'Educational service',
        'No medical reliance',
        'Your information',
        'Reports and scores',
        'Acceptable use',
        'Intellectual property',
        'Availability and beta',
        'Disclaimers',
        'Limitation',
        'Suspension and termination',
        'Governing framework',
        'Contact and changes',
      ],
    );
  });

  test('Privacy and Terms show the effective date, version and controlled note', () => {
    for (const doc of [PRIVACY, TERMS]) {
      assert.ok(doc.effective, `${doc.route} must state its effective date`);
      assert.match(doc.effective!.line, /Effective date: 21 July 2026/);
      assert.ok(doc.effective!.line.includes(LEGAL_VERSION), `${doc.route} must state version ${LEGAL_VERSION}`);
      assert.ok((doc.effective!.note ?? '').length > 100, `${doc.route} must keep the full controlled note`);
    }
  });

  test('the governing-law clause is left unresolved, as C-04 requires', () => {
    const clause = TERMS.blocks.find((b) => b.heading === 'Governing framework')!.paragraphs.join(' ');
    assert.match(clause, /jurisdiction-controlled deployment variable/);
    assert.match(clause, /must not be presented as a final governing-law selection/);
  });

  test('all five cookie categories are described with their controls', () => {
    assert.equal(COOKIE_CATEGORIES.length, 5);
    assert.deepEqual(
      COOKIE_CATEGORIES.map((c) => c.category),
      ['Strictly necessary', 'Public-site analytics', 'Advertising', 'Session replay', 'Health data'],
    );
    assert.equal(COOKIES.table?.rows.length, 5);
    for (const row of COOKIES.table!.rows) assert.equal(row.length, 3, 'every category states treatment and control');
  });

  test('the cookie banner uses the approved wording and three button labels', () => {
    assert.match(COOKIE_BANNER.body, /We do not use advertising pixels or session replay/);
    assert.deepEqual(
      [COOKIE_BANNER.accept, COOKIE_BANNER.reject, COOKIE_BANNER.manage],
      ['Accept optional analytics', 'Reject optional analytics', 'Manage choices'],
    );
  });

  test('the disclaimers are not shortened into marketing summaries (C-04 §1)', () => {
    const medical = MEDICAL_DISCLAIMER.blocks[0].paragraphs.join(' ');
    const ai = AI_DISCLAIMER.blocks[0].paragraphs.join(' ');

    assert.ok(medical.split(/\s+/).length >= 100, 'the Medical Disclaimer must be the full governed text');
    assert.ok(ai.split(/\s+/).length >= 90, 'the AI Disclaimer must be the full governed text');

    // The boundaries that must survive any redesign.
    assert.match(medical, /not a medical device, doctor, healthcare provider, diagnostic test/);
    assert.match(medical, /contact local emergency services/);
    assert.match(ai, /not permitted to calculate or change scores, classifications, drivers or null states/);
    assert.match(ai, /C-02 v1\.0\.1/);
    assert.match(ai, /C-03 v1\.0\.1/);
  });

  test('no notice makes a prohibited claim (C-04 §1)', () => {
    const prohibited = /\b(cure|guaranteed weight loss|clinically proven|FDA[- ]approved|medical device status)\b/i;
    for (const doc of LEGAL_DOCUMENTS) {
      const text = doc.blocks.flatMap((b) => b.paragraphs).join(' ');
      assert.ok(!prohibited.test(text), `${doc.route} contains a prohibited claim`);
    }
  });
});

describe('C-05 screen zones (LEG-01 … LEG-05)', () => {
  test('LEG-01 Privacy: title/meta, contents, body, rights CTA', () => {
    assert.ok(PRIVACY.effective, 'z1 effective date and version');
    assert.ok(PRIVACY.blocks.length > 1, 'z2 contents needs more than one section');
    assert.ok(PRIVACY.rightsCta, 'z4 rights CTA is required');
    assert.equal(PRIVACY.rightsCta!.href, '/contact', 'the rights channel is the Contact page');
  });

  test('LEG-02 Terms: related links to Privacy, Medical and AI disclaimers', () => {
    assert.deepEqual(
      TERMS.related?.map((l) => l.href),
      ['/privacy', '/medical-disclaimer', '/ai-disclaimer'],
    );
  });

  test('LEG-03 Cookies: title/meta, body, preferences, table — in that order', () => {
    assert.ok(COOKIES.effective, 'z1 effective date and version');
    assert.ok(COOKIES.blocks.length >= 1, 'z2 body');
    assert.equal(COOKIES.preferences, true, 'z3 opens the consent panel');
    assert.ok(COOKIES.table, 'z4 category table');
  });

  test('LEG-04 Medical: callout, emergency zone and related links', () => {
    assert.ok(MEDICAL_DISCLAIMER.effective, 'z1 effective date and version');
    assert.ok(MEDICAL_DISCLAIMER.callout, 'z2 callout');
    assert.ok(MEDICAL_DISCLAIMER.emergency, 'z4 emergency direction');
    assert.match(MEDICAL_DISCLAIMER.emergency!, /contact local emergency services/);
    assert.deepEqual(MEDICAL_DISCLAIMER.related?.map((l) => l.href), ['/terms', '/ai-disclaimer']);
  });

  test('LEG-05 AI: summary, versioning and related links', () => {
    assert.ok(AI_DISCLAIMER.effective, 'z4 versioning identifier');
    assert.ok(AI_DISCLAIMER.callout, 'z2 summary');
    assert.match(AI_DISCLAIMER.callout!, /not permitted to calculate or change scores/);
    assert.deepEqual(AI_DISCLAIMER.related?.map((l) => l.href), ['/medical-disclaimer', '/privacy']);
  });

  test('every zone sentence is C-04 copy, not new wording', () => {
    // The callout, emergency and rights-CTA text must appear in the notice they belong to.
    const bodyOf = (d: typeof PRIVACY) => d.blocks.flatMap((b) => b.paragraphs).join(' ');
    assert.ok(bodyOf(MEDICAL_DISCLAIMER).includes(MEDICAL_DISCLAIMER.callout!));
    assert.ok(bodyOf(MEDICAL_DISCLAIMER).includes(MEDICAL_DISCLAIMER.emergency!));
    assert.ok(bodyOf(AI_DISCLAIMER).includes(AI_DISCLAIMER.callout!));
    assert.ok(bodyOf(PRIVACY).includes(PRIVACY.rightsCta!.text));
  });

  test('every notice states its effective date and version (C-05 zone 1)', () => {
    for (const doc of LEGAL_DOCUMENTS) {
      assert.ok(doc.effective, `${doc.route} has no title/meta zone`);
      assert.match(doc.effective!.line, /Effective date: .+ • Version: 1\.0\.1\./);
    }
  });
});
