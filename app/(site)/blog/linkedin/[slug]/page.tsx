import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, MoveUpRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import ShareLink from '../../[slug]/ShareLink';
import { findLinkedInArchivePost, LINKEDIN_ARCHIVE } from '@/lib/linkedin/archive';
import { MEDICAL_DISCLAIMER } from '@/lib/content/c04-legal';
import styles from './article.module.css';

export const dynamicParams = false;

export function generateStaticParams() {
  return LINKEDIN_ARCHIVE.flatMap((post) => post.slug ? [{ slug: post.slug }] : []);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = findLinkedInArchivePost((await params).slug);
  if (!post) return { title: 'LinkedIn article — ROOTS-AI™' };

  return {
    title: `${post.title} — ROOTS-AI™`,
    description: post.body.replace(/\s+/g, ' ').slice(0, 160),
  };
}

function readingMinutes(body: string): number {
  return Math.max(1, Math.ceil(body.trim().split(/\s+/).length / 220));
}

export default async function LinkedInArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const post = findLinkedInArchivePost((await params).slug);
  if (!post || !post.title || !post.slug) notFound();

  const paragraphs = post.body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);
  const related = LINKEDIN_ARCHIVE.filter((item) => item.slug !== post.slug).slice(0, 3);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/blog"><ArrowLeft size={15} aria-hidden="true" /> Insights</Link>
          <span aria-hidden="true">/</span>
          <span>LinkedIn article</span>
        </nav>

        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}><span /> ROOTS-AI™ JOURNAL <span className={styles.kickerDivider}>/</span> LINKEDIN EDITION</p>
            <h1>{post.title}</h1>
            <div className={styles.heroBottom}>
              <p className={styles.byline}><span className={styles.brandMark}>R</span> ROOTS-AI™</p>
              <span className={styles.metaDivider} aria-hidden="true" />
              <p className={styles.reading}><BookOpen size={15} aria-hidden="true" /> {readingMinutes(post.body)} min read</p>
            </div>
            <a className={styles.jumpLink} href="#article">
              Read the article <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
          <div className={styles.heroArtwork} style={post.imageSrc ? ({ '--art': `url(${post.imageSrc})` } as React.CSSProperties) : undefined}>
            {post.imageSrc ? (
              <Image
                src={post.imageSrc}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 760px) 100vw, 48vw"
                className={styles.heroImage}
              />
            ) : (
              <div className={styles.artworkFallback} aria-hidden="true">
                <span className={styles.orbit} />
                <span className={styles.orbitInner} />
                <span className={styles.fallbackWordmark}>ROOTS<br />AI</span>
              </div>
            )}
            <span className={styles.artworkCaption}>A perspective from ROOTS-AI™</span>
          </div>
          <span className={styles.heroIndex} aria-hidden="true">ROOTS / 01</span>
        </header>

        <article className={styles.article} id="article">
          <div className={styles.articleIntro}>
            <span className={styles.articleRule} />
            <p>From our LinkedIn community</p>
          </div>
          <div className={styles.prose}>
            {paragraphs.map((paragraph, index) => (
              <p className={index === 0 ? styles.leadParagraph : undefined} key={`${index}-${paragraph.slice(0, 32)}`}>
                {paragraph}
              </p>
            ))}
          </div>

          <div className={styles.articleEnd}>
            <span className={styles.articleRule} />
            <span>END OF ARTICLE</span>
            <span className={styles.articleRule} />
          </div>

          <ShareLink />
        </article>

        <aside className={styles.disclaimer}>
          <span className={styles.disclaimerMark} aria-hidden="true">i</span>
          <p>{MEDICAL_DISCLAIMER.callout}</p>
        </aside>

        {related.length ? (
          <section className={styles.related} aria-labelledby="related-title">
            <div className={styles.relatedHeading}>
              <div>
                <p className={styles.kicker}><span /> CONTINUE EXPLORING</p>
                <h2 id="related-title">More from ROOTS-AI™</h2>
              </div>
              <Link href="/blog" className={styles.allArticles}>All articles <MoveUpRight size={15} aria-hidden="true" /></Link>
            </div>
            <div className={styles.relatedGrid}>
              {related.map((item) => item.slug ? (
                <Link className={styles.relatedCard} href={`/blog/linkedin/${item.slug}`} key={item.id}>
                  <span className={styles.relatedEyebrow}>LINKEDIN EDITION</span>
                  <span className={styles.relatedTitle}>{item.title}</span>
                  <span className={styles.relatedArrow}><ArrowRight size={17} aria-hidden="true" /></span>
                </Link>
              ) : null)}
            </div>
          </section>
        ) : null}

        <footer className={styles.footer}>
          <Link href="/blog"><ArrowLeft size={16} aria-hidden="true" /> Back to Insights</Link>
          <span>ROOTS-AI™ · Human Systems Intelligence™</span>
        </footer>
      </div>
    </main>
  );
}
