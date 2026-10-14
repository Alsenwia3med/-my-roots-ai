/**
 * Website governance review (Consolidated Governance & Regulatory Review) and the v1.21
 * publication-candidate copy.
 *
 * Guards the corrections the review requires on the public pages: the claims it removes must
 * stay removed, the replacement copy must stay in place, and the document's editorial notes
 * must not reach the published pages. Content only — nothing here touches scoring or the report.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { PILOT, PLATFORM, HOW_IT_WORKS, RESEARCH, ABOUT, HEALTHCARE_PROFESSIONALS } from '../../lib/content/website-v121';
import { AI_DISCLAIMER, MEDICAL_DISCLAIMER, PRIVACY, TERMS } from '../../lib/content/legal-v121';
import { EXAMPLE_REPORT_PAGE, INSIGHTS_PAGE, CONTACT_PAGE, ASSESSMENT_PAGE } from '../../lib/content/website-v121-pages';

const read = (path: string) => readFileSync(join(__dirname, '../..', path), 'utf8');

const HOME_SOURCES = ['components/RootsV1.tsx', 'components/lux/chrome-data.ts', 'components/Footer.tsx', 'components/lux/home/HeroCore.tsx'];

describe('governance review — homepage corrections (B1–B7)', () => {
  const home = HOME_SOURCES.map(read).join('\n');

  test('the claims the review removes are gone', () => {
    for (const phrase of [
      'HIPAA / GDPR Protection',
      'Zero Hallucination Bounds',
      '94.2%',
      'Calibrated Confidence',
      'glucocorticoids',
      'Validated against ROOTS-AI',
      'Governed Tokens',
      'ROOTS-AI Health Inc',
      'governed clinical sample values',
      'physiological systems',
    ]) {
      assert.ok(!home.includes(phrase), `"${phrase}" must not appear on the homepage`);
    }
  });

  test('the replacement copy is in place', () => {
    for (const phrase of [
      'This illustrative assessment highlights reported patterns involving stress, sleep, and weight regulation.',
      'do not establish hormone levels, metabolic dysfunction, or underlying biological mechanisms.',
      'Structured Assessment Insights',
      'Questionnaire-based patterns interpreted within defined scientific and safety boundaries.',
      'Weight regulation involves interacting biological and behavioral processes.',
      'Explore a fictional, non-diagnostic example of how ROOTS-AI™ presents structured questionnaire findings',
      'Privacy & Data Protection',
      'Defined AI Safety Boundaries',
      '© 2026 ROOTS AI HEALTH SYSTEMS, Inc. All rights reserved.',
      'Non-specific symptom patterns and relevant health context; not a direct measure of inflammation.',
    ]) {
      assert.ok(home.replace(/\s+/g, ' ').includes(phrase), `"${phrase}" must appear on the homepage`);
    }
  });
});

describe('v1.21 publication-candidate copy', () => {
  const everything = JSON.stringify([
    HOW_IT_WORKS, PLATFORM, RESEARCH, ABOUT, HEALTHCARE_PROFESSIONALS, PILOT,
    EXAMPLE_REPORT_PAGE, INSIGHTS_PAGE, CONTACT_PAGE, ASSESSMENT_PAGE,
    PRIVACY, MEDICAL_DISCLAIMER, TERMS, AI_DISCLAIMER,
  ]);

  test("the document's editorial notes are not published", () => {
    assert.ok(!everything.includes('must be mapped to the separately governed technical product roadmap'));
    assert.ok(!everything.includes('non-calculated design placeholders'));
    assert.ok(!everything.includes('Publication Closure Register'));
  });

  test('the legal pages carry the document\'s own version lines', () => {
    assert.match(PRIVACY.effective!.line, /Version: 1\.2 — Publication Candidate; Legal and Operational Sign-off Required\./);
    assert.match(TERMS.effective!.line, /Version: 1\.2 — Publication Candidate; Legal Sign-off Required\./);
    assert.match(MEDICAL_DISCLAIMER.effective!.line, /Version: 1\.2 — Publication Candidate; Medical and Legal Sign-off Required\./);
    assert.equal(AI_DISCLAIMER.effective!.line, 'Effective Date: To be confirmed upon publication.');
  });

  test('every page names its own kicker and keeps both calls to action', () => {
    assert.equal(HOW_IT_WORKS.kicker, 'ROOTS-AI™ | HOW IT WORKS');
    assert.deepEqual(HOW_IT_WORKS.ctas.map((c) => c.label), ['Start Your Assessment', 'View Example Report']);
    assert.deepEqual(PLATFORM.ctas.map((c) => c.label), ['Start Your Assessment', 'Explore How It Works']);
    assert.deepEqual(ABOUT.ctas.map((c) => c.label), ['Explore Our Platform', 'Discover How It Works']);
  });

  test('the corporate identity uses the registered entity name', () => {
    assert.match(everything, /ROOTS AI HEALTH SYSTEMS, Inc\./);
    assert.ok(!everything.includes('ROOTS-AI Health Inc'));
  });

  test('the legal pages are laid out from the v1.21 copy', () => {
    for (const route of ['privacy', 'terms', 'medical-disclaimer', 'ai-disclaimer']) {
      assert.ok(read(`app/(site)/${route}/page.tsx`).includes('legal-v121'), `/${route} must use lib/content/legal-v121.ts`);
    }
  });
});
