import importedPosts from './archive.json';
import type { LinkedInPost } from './posts';

export interface LinkedInFeedPost extends Omit<LinkedInPost, 'publishedAt'> {
  publishedAt: string | null;
  title?: string;
  imageSrc?: string | null;
  imageWidth?: number;
  imageHeight?: number;
  slug?: string;
}

function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const LINKEDIN_ARCHIVE: LinkedInFeedPost[] = importedPosts.map((post) => ({
  ...post,
  author: 'ROOTS-AI™',
  slug: slugify(post.title) || post.id,
  hasImage: Boolean(post.imageSrc),
}));

export function findLinkedInArchivePost(slug: string): LinkedInFeedPost | undefined {
  return LINKEDIN_ARCHIVE.find((post) => post.slug === slug);
}

function postKey(body: string): string {
  return body.replace(/\s+/g, ' ').trim().toLocaleLowerCase('en');
}

export function mergeLinkedInPosts(livePosts: LinkedInPost[]): LinkedInFeedPost[] {
  const liveBodies = new Set(livePosts.map((post) => postKey(post.body)));
  return [
    ...livePosts,
    ...LINKEDIN_ARCHIVE.filter((post) => !liveBodies.has(postKey(post.body))),
  ];
}
