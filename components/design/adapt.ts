/**
 * Turns the v1.21 content modules into the one page model the design variants render.
 * No wording is created or altered here; each field is copied from its source.
 */

import type { LegalBlock, LegalDocument } from '@/lib/content/c04-legal';
import type { PageContent, PageZone } from '@/lib/content/c04-pages';
import { ABOUT, HEALTHCARE_PROFESSIONALS, HOW_IT_WORKS, PILOT, PLATFORM, RESEARCH } from '@/lib/content/website-v121';
import { ASSESSMENT_PAGE, CONTACT_PAGE, EXAMPLE_REPORT_PAGE, INSIGHTS_PAGE } from '@/lib/content/website-v121-pages';
import { AI_DISCLAIMER, MEDICAL_DISCLAIMER, PRIVACY, TERMS } from '@/lib/content/legal-v121';
import type { DDoc, DSection } from './types';

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function zoneToSection(zone: PageZone, num: number): DSection {
  return {
    id: `s${num}-${slugify(zone.heading || zone.eyebrow || 'section')}`,
    num,
    eyebrow: zone.eyebrow,
    heading: zone.heading || undefined,
    sub: zone.sub,
    paragraphs: zone.paragraphs ?? [],
    lead: zone.lead,
    blocks: zone.blocks ?? [],
    items: zone.items ?? [],
    closing: zone.closing ?? [],
    tone: zone.tone,
    half: (zone.span ?? 12) <= 6 && zone.span !== undefined,
  };
}

const zonesToSections = (zones: PageZone[], from = 1) => zones.map((z, i) => zoneToSection(z, from + i));

function fromPage(slug: string, label: string, scene: DDoc['scene'], p: PageContent, group: DDoc['group'] = 'Pages'): DDoc {
  return {
    slug,
    label,
    group,
    scene,
    kicker: p.kicker ?? '',
    title: p.headline,
    tagline: p.tagline,
    intro: p.intro,
    introMore: p.introMore ?? [],
    ctas: p.ctas,
    sections: zonesToSections(p.zones ?? []),
    slot: 'none',
    after: [],
    outro: p.outro,
    footnote: p.footnote,
  };
}

function blockToSection(block: LegalBlock, num: number, numbered: boolean): DSection {
  return {
    id: `s${num}-${slugify(block.heading)}`,
    num,
    heading: block.heading,
    paragraphs: block.paragraphs,
    blocks: block.subs ?? [],
    items: block.list ?? [],
    closing: block.closing ?? [],
    numbered,
  };
}

function fromLegal(slug: string, label: string, doc: LegalDocument): DDoc {
  const numbered = doc.blocks.length > 1;
  const sections = doc.blocks.map((b, i) => blockToSection(b, i + 1, numbered));
  if (doc.corporate) sections.push({ ...blockToSection(doc.corporate, sections.length + 1, false), id: 'corporate-information' });
  return {
    slug,
    label,
    group: 'Legal',
    scene: 'shield',
    kicker: doc.kicker,
    title: doc.title,
    intro: doc.intro?.[0] ?? '',
    introMore: doc.intro?.slice(1) ?? [],
    ctas: [{ label: 'Start Your Assessment', href: '/assessment' }],
    sections,
    slot: 'none',
    after: [],
    effective: doc.effective?.line,
    related: doc.related,
    toc: numbered,
  };
}

const exampleDoc: DDoc = {
  slug: 'example-report',
  label: 'Example Report',
  group: 'Forms and viewers',
  scene: 'rings',
  kicker: EXAMPLE_REPORT_PAGE.kicker,
  title: EXAMPLE_REPORT_PAGE.headline,
  tagline: EXAMPLE_REPORT_PAGE.tagline,
  intro: EXAMPLE_REPORT_PAGE.intro,
  introMore: EXAMPLE_REPORT_PAGE.introMore,
  ctas: EXAMPLE_REPORT_PAGE.ctas,
  sections: zonesToSections(EXAMPLE_REPORT_PAGE.before),
  slot: 'viewer',
  after: zonesToSections(EXAMPLE_REPORT_PAGE.after, EXAMPLE_REPORT_PAGE.before.length + 1),
  footnote: EXAMPLE_REPORT_PAGE.footnote,
  badge: EXAMPLE_REPORT_PAGE.badge,
};

const insightsDoc: DDoc = {
  slug: 'blog',
  label: 'Insights',
  group: 'Forms and viewers',
  scene: 'wave',
  kicker: INSIGHTS_PAGE.kicker,
  title: INSIGHTS_PAGE.headline,
  tagline: INSIGHTS_PAGE.tagline,
  intro: INSIGHTS_PAGE.intro,
  introMore: [],
  ctas: INSIGHTS_PAGE.ctas,
  sections: zonesToSections(INSIGHTS_PAGE.before),
  slot: 'blog',
  after: zonesToSections(INSIGHTS_PAGE.after, INSIGHTS_PAGE.before.length + 1),
  footnote: INSIGHTS_PAGE.footnote,
};

const contactDoc: DDoc = {
  slug: 'contact',
  label: 'Contact',
  group: 'Forms and viewers',
  scene: 'dialog',
  kicker: CONTACT_PAGE.kicker,
  title: CONTACT_PAGE.headline,
  tagline: CONTACT_PAGE.tagline,
  intro: CONTACT_PAGE.intro,
  introMore: CONTACT_PAGE.introMore,
  ctas: [],
  sections: zonesToSections(CONTACT_PAGE.help),
  slot: 'contact',
  after: zonesToSections(CONTACT_PAGE.after, CONTACT_PAGE.help.length + 1),
  corporate: CONTACT_PAGE.corporate,
};

const assessmentDoc: DDoc = {
  slug: 'assessment',
  label: 'Assessment entry',
  group: 'Forms and viewers',
  scene: 'core',
  kicker: ASSESSMENT_PAGE.kicker,
  title: ASSESSMENT_PAGE.headline,
  tagline: ASSESSMENT_PAGE.tagline,
  intro: ASSESSMENT_PAGE.intro,
  introMore: ASSESSMENT_PAGE.introMore,
  ctas: [],
  sections: [
    {
      id: 's1-what-to-expect',
      num: 1,
      heading: ASSESSMENT_PAGE.expect.heading,
      paragraphs: [],
      blocks: ASSESSMENT_PAGE.expect.blocks.map((b) => ({ label: b.label, paragraphs: [b.text] })),
      items: [],
      closing: [],
    },
  ],
  slot: 'assessment',
  after: [
    {
      id: 's2-boundaries',
      num: 2,
      heading: ASSESSMENT_PAGE.boundaries.heading,
      paragraphs: ASSESSMENT_PAGE.boundaries.paragraphs,
      blocks: [],
      items: [],
      closing: [],
      tone: 'limit',
    },
  ],
  related: ASSESSMENT_PAGE.links,
  corporate: [ASSESSMENT_PAGE.closing],
};

export const DOCS: DDoc[] = [
  fromPage('how-it-works', 'How It Works', 'flow', HOW_IT_WORKS),
  fromPage('platform', 'Platform', 'layers', PLATFORM),
  exampleDoc,
  fromPage('research', 'Research', 'lattice', RESEARCH),
  fromPage('about', 'About', 'helix', ABOUT),
  fromPage('healthcare-professionals', 'Healthcare Professionals', 'panels', HEALTHCARE_PROFESSIONALS),
  fromPage('pilot', 'Free Beta', 'beacon', PILOT),
  insightsDoc,
  contactDoc,
  assessmentDoc,
  fromLegal('privacy', 'Privacy Notice', PRIVACY),
  fromLegal('terms', 'Terms of Service', TERMS),
  fromLegal('medical-disclaimer', 'Medical Disclaimer', MEDICAL_DISCLAIMER),
  fromLegal('ai-disclaimer', 'AI Disclaimer', AI_DISCLAIMER),
];

export const docBySlug = (slug: string) => DOCS.find((d) => d.slug === slug);
