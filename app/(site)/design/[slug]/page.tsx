// DESIGN EXPLORATION ONLY — one page, five designs: /design/<page>?v=1..5

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { docBySlug, DOCS } from '@/components/design/adapt';
import DesignPage from '@/components/design/Variants';
import { VARIANTS, type VariantId } from '@/components/design/types';

export function generateStaticParams() {
  return DOCS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const doc = docBySlug((await params).slug);
  return { title: doc ? `${doc.label} — design options` : 'Design options', robots: { index: false, follow: false } };
}

export default async function DesignSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { slug } = await params;
  const { v } = await searchParams;
  const doc = docBySlug(slug);
  if (!doc) notFound();
  const n = Number(v);
  const variant = (VARIANTS.some((x) => x.id === n) ? n : 1) as VariantId;
  return <DesignPage doc={doc} variant={variant} />;
}
