/**
 * Approved articles for /blog (C-05 PUB-11 and PUB-12).
 *
 * The list is empty, and that is the correct Phase 1 state. C-04 /blog gives a "Launch empty
 * state" and requires that "Every article displays author, review date, sources and educational
 * disclaimer" and that "No article is personalized medical advice". ROOTS approves article
 * content separately; until it does, the landing page shows the approved launch copy and no
 * article route resolves.
 *
 * This file previously had a stand-in: /blog/[slug] rendered "Understanding Metabolic
 * Resistance" by "Dr. Sarah Johnson, PhD" — an invented author and invented health content about
 * metabolic rate, hunger signals and hormone levels, published as though it were real. It has
 * been removed. A placeholder that reads as a genuine article is a health claim ROOTS never
 * made, which is exactly what C-04 §1 forbids.
 *
 * The shape below is the contract an approved article must satisfy. Every editorial control
 * C-04 names is required, so an article cannot be added without them.
 */

export interface ArticleSource {
  label: string;
  href?: string;
}

export interface Article {
  slug: string;
  title: string;
  subtitle: string;
  /** C-04: every article displays its author. */
  author: string;
  /** ISO date the article was published. */
  published: string;
  /** C-04: every article displays its review date. */
  reviewed: string;
  category: string;
  /** Shown on the landing card (C-05 PUB-11 z3). */
  excerpt: string;
  /** Minutes, shown in the article header (C-05 PUB-12 z2). */
  readingMinutes: number;
  /** Ordered body blocks; headings keep the document outline semantic. */
  body: { heading?: string; paragraphs: string[] }[];
  /** C-04: every article displays its sources. */
  sources: ArticleSource[];
}

/**
 * No article has been approved for Phase 1. Adding one requires ROOTS approval of its content
 * together with its author, review date and sources.
 */
export const ARTICLES: readonly Article[] = [];

export function findArticle(slug: string): Article | undefined {
  return ARTICLES.find((article) => article.slug === slug);
}

/** C-05 PUB-11 z4: "Filters: category only if populated." */
export function categories(): string[] {
  return [...new Set(ARTICLES.map((article) => article.category))].sort();
}
