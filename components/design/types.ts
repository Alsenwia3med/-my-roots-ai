/**
 * Design-exploration model. Presentation only: every word shown by the four design variants
 * comes from the v1.21 copy modules (lib/content/*-v121*.ts); nothing here adds or changes copy.
 */

import type { SceneVariant } from '@/components/lux/three/scenes';

export interface DLink {
  label: string;
  href: string;
}

export interface DSection {
  id: string;
  /** 1-based position in the page, used for numerals and the chapter rail. */
  num: number;
  /** Small label above the heading (the document's run-in heading). */
  eyebrow?: string;
  heading?: string;
  /** The line printed directly under the heading. */
  sub?: string;
  paragraphs: string[];
  /** The sentence that introduces `items`. */
  lead?: string;
  blocks: { label: string; paragraphs: string[] }[];
  items: string[];
  closing: string[];
  tone?: 'affirm' | 'limit';
  /** The source copy sets this section as one half of a pair. */
  half?: boolean;
  /** Legal sections are numbered by the notice itself. */
  numbered?: boolean;
}

export type SlotKind = 'none' | 'viewer' | 'blog' | 'contact' | 'assessment';

export interface DDoc {
  slug: string;
  /** Name in the gallery and the switcher. */
  label: string;
  group: 'Pages' | 'Legal' | 'Forms and viewers';
  scene: SceneVariant;
  kicker: string;
  title: string;
  tagline?: string;
  intro: string;
  introMore: string[];
  ctas: DLink[];
  /** Sections printed before the page's functional block (or all of them). */
  sections: DSection[];
  /** What the page shows between the two groups of sections. */
  slot: SlotKind;
  /** Sections printed after the functional block. */
  after: DSection[];
  outro?: { heading?: string; text: string };
  footnote?: string;
  /** Short badge printed in the hero (Example Report). */
  badge?: { label: string; text: string };
  /** Version / effective-date line (legal pages). */
  effective?: string;
  related?: DLink[];
  /** Lines printed as the page's closing identity block. */
  corporate?: string[];
  /** Legal pages: a table of contents is useful. */
  toc?: boolean;
}

export const VARIANTS = [
  { id: 1, name: 'Chapter Rail', mood: 'Light · sticky chapter rail · oversized numerals' },
  { id: 2, name: 'Glass Lab', mood: 'Light · frosted glass panels · cursor spotlight' },
  { id: 3, name: 'Editorial Spine', mood: 'Light · glowing scroll-spine · pull-quote bands' },
  { id: 4, name: 'Bento Prism', mood: 'Light · modular bento tiles · prism gradients' },
  { id: 5, name: 'Split Stage', mood: 'Light · sticky story panel beside a stream of cards' },
] as const;

export type VariantId = (typeof VARIANTS)[number]['id'];
