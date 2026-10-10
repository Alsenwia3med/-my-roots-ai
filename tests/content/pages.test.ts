/**
 * Governed public-page content (C-04 §3 production page copy, §10 metadata).
 *
 * Structural checks only. That the wording is C-04 verbatim is proven separately against the
 * controlled PDF by `python scripts/canonical/check_c04.py`, which reads these same strings.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { ARTICLES, categories, findArticle } from '../../lib/content/blog';
import { EXAMPLE, EXAMPLE_SECTIONS } from '../../lib/content/example-report';
import { DOMAIN_LABELS, SECTION_TITLES } from '../../lib/report/c03-content';
import {
  ABOUT,
  BLOG_EMPTY_STATE,
  CONTACT_CONFIRMATION,
  CONTACT_EMERGENCY_NOTICE,
  CONTACT_MESSAGE_LIMIT,
  HOW_IT_WORKS,
  PLATFORM,
  PRIMARY_CTA,
  PUBLIC_PAGES,
  SECONDARY_CTA,
} from '../../lib/content/c04-pages';

describe('C-04 public page content', () => {
  test('every public route C-04 specifies has copy', () => {
    assert.deepEqual(
      PUBLIC_PAGES.map((p) => p.route),
      ['/', '/assessment', '/example-report', '/how-it-works', '/platform', '/research', '/healthcare-professionals', '/pilot', '/about', '/contact', '/blog'],
    );
  });

  test('every page has a headline, an intro and at least one approved action', () => {
    for (const page of PUBLIC_PAGES) {
      assert.ok(page.headline.length > 0, `${page.route} has no headline`);
      assert.ok(page.intro.length > 40, `${page.route} intro looks truncated`);
      assert.ok(page.ctas.length >= 1, `${page.route} has no call to action`);
      for (const cta of page.ctas) assert.ok(cta.href.length > 0, `${page.route} CTA has no destination`);
    }
  });

  test('the two approved calls to action keep their C-04 §1 labels', () => {
    assert.equal(PRIMARY_CTA.label, 'Start Your Assessment');
    assert.equal(SECONDARY_CTA.label, 'View Example Report');
  });

  test('C-04 §1: no page makes a prohibited claim', () => {
    // "Never claim diagnosis, disease prevention, cure, guaranteed weight loss, clinical
    // validation or medical-device status."
    const prohibited = /\b(cures?|guaranteed weight loss|prevents? disease|disease prevention|clinically validated|medical device status|FDA[- ]approved)\b/i;
    for (const page of PUBLIC_PAGES) {
      const text = [page.headline, page.intro, ...page.bullets, ...(page.zones ?? []).flatMap((z) => z.items)].join(' ');
      assert.ok(!prohibited.test(text), `${page.route} contains a prohibited claim`);
    }
  });

  test('C-04 §1: every future capability is labelled Coming Soon', () => {
    const future = ['Laboratory data integration', 'DNA and epigenetic insights', 'Microbiome analysis', 'Wearable integrations', 'ROOTS Biological Twin™'];
    const comingSoon = PLATFORM.zones!.find((z) => z.heading === 'Coming soon')!;

    for (const capability of future) {
      const line = comingSoon.items.find((i) => i.includes(capability));
      assert.ok(line, `${capability} is not listed`);
      assert.ok(line!.startsWith('Coming Soon:'), `${capability} is not labelled Coming Soon`);
    }

    // And nothing forthcoming is described as available.
    const available = PLATFORM.zones!.find((z) => z.heading === 'Available now')!;
    for (const capability of future) {
      assert.ok(!available.items.join(' ').includes(capability), `${capability} is listed as available`);
    }
  });

  test('How It Works states both sides of the AI boundary in separate zones', () => {
    const does = HOW_IT_WORKS.zones!.find((z) => z.heading === 'What AI does')!;
    const doesNot = HOW_IT_WORKS.zones!.find((z) => z.heading === 'What AI does not do')!;
    assert.match(does.items.join(' '), /assist only in expressing approved information/);
    assert.match(doesNot.items.join(' '), /not permitted to calculate or change scores/);
  });

  test('About names the company exactly as C-04 states it', () => {
    assert.ok(ABOUT.zones!.some((z) => z.items.some((i) => i.includes('ROOTS AI HEALTH SYSTEMS, Inc., Delaware, USA'))));
  });

  test('the Contact and Blog system copy is present and unabridged', () => {
    assert.match(CONTACT_CONFIRMATION, /Thank you\. Your enquiry has been received\./);
    assert.match(CONTACT_EMERGENCY_NOTICE, /not monitored for emergencies/);
    assert.equal(CONTACT_MESSAGE_LIMIT, 2000);
    assert.match(BLOG_EMPTY_STATE, /Our first evidence-informed insights are being prepared/);
  });

  test('metadata, where C-04 §10 supplies it, is used verbatim', () => {
    const withMeta = PUBLIC_PAGES.filter((p) => p.meta);
    assert.equal(withMeta.length, 7, 'C-04 §10 lists seven routes');
    for (const page of withMeta) {
      assert.ok(page.meta!.title.length > 0 && page.meta!.description.length > 0, `${page.route} metadata incomplete`);
    }
  });
});

describe('C-04 /blog editorial controls (PUB-11, PUB-12)', () => {
  test('no article is published until ROOTS approves one', () => {
    // C-04 gives a launch empty state; an unapproved placeholder article would be a health
    // claim ROOTS never made.
    assert.equal(ARTICLES.length, 0, 'an article is published without recorded approval');
    assert.deepEqual(categories(), []);
    assert.equal(findArticle('anything'), undefined);
  });

  test('any article that is added must carry author, review date and sources', () => {
    for (const article of ARTICLES) {
      assert.ok(article.author?.trim(), `${article.slug} has no author`);
      assert.ok(Date.parse(article.reviewed) > 0, `${article.slug} has no review date`);
      assert.ok(article.sources.length > 0, `${article.slug} lists no sources`);
    }
  });

  test('the fabricated placeholder article is gone', () => {
    const template = readFileSync(join(__dirname, '../../app/(site)/blog/[slug]/page.tsx'), 'utf8');
    for (const trace of ['Sarah Johnson', 'Metabolic resistance refers', 'Mock article', 'mock article']) {
      assert.ok(!template.includes(trace), `the article template still contains "${trace}"`);
    }
    // And it renders from the approved list rather than a literal.
    assert.ok(template.includes('findArticle'), 'the template must read the approved article list');
    assert.ok(template.includes('notFound'), 'an unapproved slug must 404, not render a placeholder');
  });
});

describe('the blog flow is complete, so an approved article is reachable', () => {
  const landing = readFileSync(join(__dirname, '../../app/(site)/blog/page.tsx'), 'utf8');
  const template = readFileSync(join(__dirname, '../../app/(site)/blog/[slug]/page.tsx'), 'utf8');

  test('the landing links articles to their slug pages (PUB-11 z2, z3)', () => {
    // Without these, an approved article would exist at a URL nothing points to.
    assert.ok(landing.includes('/blog/${featured.slug}'), 'the featured article must link to its slug');
    assert.ok(landing.includes('/blog/${article.slug}'), 'each grid card must link to its slug');
  });

  test('the landing shows the approved launch state only when there is nothing to list', () => {
    assert.ok(landing.includes('BLOG_EMPTY_STATE'), 'the approved launch copy must be used');
    assert.ok(landing.includes('ARTICLES.length === 0'), 'the empty state must be conditional, not permanent');
  });

  test('category filters appear only when populated (PUB-11 z4)', () => {
    assert.ok(landing.includes('filters.length > 1'), 'an empty or single-category filter bar must not render');
    assert.deepEqual(categories(), [], 'no categories while no article is approved');
  });

  test('every PUB-12 zone is implemented', () => {
    for (const [zone, marker] of [
      ['1 breadcrumb', 'article-crumbs'],
      ['2 header', 'article-header'],
      ['2 author', '{article.author}'],
      ['2 review date', '{dateFormat.format(new Date(article.reviewed))}'],
      ['2 reading time', '{article.readingMinutes}'],
      ['3 body', 'article-prose'],
      ['3 sources', 'article-sources'],
      ['4 share', 'ShareLink'],
      ['5 related', 'article-related'],
      ['6 disclaimer', 'article-disclaimer'],
      ['7 cta', 'center-actions'],
    ] as [string, string][]) {
      assert.ok(template.includes(marker), `PUB-12 zone ${zone} is missing`);
    }
  });

  test('related is capped at three (PUB-12 z5)', () => {
    assert.ok(template.includes('.slice(0, 3)'), 'related articles must be limited to three');
  });

  test('sharing is by link only — no third-party widgets (PUB-12 z4)', () => {
    const share = readFileSync(join(__dirname, '../../app/(site)/blog/[slug]/ShareLink.tsx'), 'utf8');
    for (const service of ['twitter', 'facebook', 'linkedin', 'x.com', 'addthis', 'sharethis']) {
      assert.ok(!share.toLowerCase().includes(service), `share must not use ${service}`);
    }
    assert.ok(share.includes('clipboard'), 'sharing is copy-link only');
  });
});

describe('PUB-04 example report (ROOTS review point 6)', () => {
  const page = readFileSync(join(__dirname, '../../app/(site)/example-report/page.tsx'), 'utf8');

  test('all nineteen C-03 sections are present, in the fixed order', () => {
    assert.equal(EXAMPLE_SECTIONS.length, 19);
    assert.deepEqual(
      EXAMPLE_SECTIONS.map((s) => s.number),
      Array.from({ length: 19 }, (_, i) => i + 1),
    );
    for (const section of EXAMPLE_SECTIONS) {
      assert.equal(section.title, SECTION_TITLES[section.number - 1], `section ${section.number} title`);
    }
  });

  test('the seven canonical domains are shown in the C-03 display order', () => {
    const breakdown = EXAMPLE_SECTIONS.find((s) => s.number === 7)!;
    assert.deepEqual(
      breakdown.bars!.map((b) => b.domain_id),
      ['MR', 'HS', 'SR', 'CH', 'SL', 'IB', 'BS'],
    );
    for (const bar of breakdown.bars!) {
      assert.equal(bar.label, DOMAIN_LABELS[bar.domain_id]);
      assert.ok(bar.score >= 0 && bar.score <= 100, `${bar.domain_id} out of range`);
    }
  });

  test('the non-canonical categories are gone', () => {
    // What the page used to show instead of the seven ROOTS-AI domains.
    for (const wrong of ['Metabolic Wellness', 'Hormonal Balance', 'Sleep Quality', 'Cellular Health', 'Stress Resilience', 'Immune Function']) {
      assert.ok(!page.includes(wrong), `the example report still shows "${wrong}"`);
    }
  });

  test('the unsupported recommendation language is gone', () => {
    for (const claim of ['personalized recommendations', 'actionable wellness strategies', 'comparative wellness scores']) {
      assert.ok(!page.toLowerCase().includes(claim.toLowerCase()), `the example report still claims "${claim}"`);
    }
  });

  test('displayed versions follow the C-03 v1.0.1 correction, not the legacy sample', () => {
    // C-03 v1.0.1 §6: displayed questionnaire/scoring/rules versions must reflect v1.0.1.
    assert.equal(EXAMPLE.questionnaireVersion, '1.0.1');
    assert.equal(EXAMPLE.scoringVersion, '1.0.1');
    assert.equal(EXAMPLE.reportTemplateVersion, '1.0.1');
    const card = EXAMPLE_SECTIONS.find((s) => s.number === 17)!;
    assert.ok(card.content.includes('Rules v1.0.1'), 'the Biological Card must not print v1.0.0');
  });

  test('every figure carries a classification or unit, never a bare number (C-03 §2)', () => {
    for (const section of EXAMPLE_SECTIONS.filter((s) => s.figure)) {
      assert.ok(section.figure!.unit || section.figure!.label, `section ${section.number} shows a bare number`);
    }
  });

  test('the Triad distinguishes a domain from a protective factor', () => {
    const triad = EXAMPLE_SECTIONS.find((s) => s.number === 8)!.triad!;
    assert.equal(triad.filter((t) => t.kind === 'driver').length, 2);
    assert.equal(triad.filter((t) => t.kind === 'protective').length, 1);
    assert.ok(page.includes('Protective factor'), 'the protective factor must be labelled as such');
    assert.ok(page.includes('not causes'), 'the approved relationship note must appear');
  });

  test('the example is labelled as fictional and shows the full disclaimer', () => {
    assert.ok(page.includes('Example only'), 'the example-only badge is required (PUB-04 z1)');
    assert.ok(page.includes('COPY.disclaimer'), 'the full fixed disclaimer is required (PUB-04 z5)');
  });
});
