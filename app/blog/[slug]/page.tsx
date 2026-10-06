import { notFound } from "next/navigation";

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  await params;
  notFound();
}
