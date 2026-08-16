import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ContentShell } from "../_shell";
import { BLOG_SLUGS, getBlogPost, formatDate } from "@/lib/content";
import { SITE_URL } from "@/lib/site-url";
import {
  organizationNode,
  breadcrumbNode,
  ORG_ID,
} from "@/lib/platform-jsonld";

const APP_URL = SITE_URL;

// Pré-renderiza todos os posts no build; rotas fora da lista → 404.
export function generateStaticParams() {
  return BLOG_SLUGS.map((slug) => ({ slug }));
}
export const dynamicParams = false;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return {};
  const { meta } = post;
  const url = `/blog/${meta.slug}`;
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      siteName: "estoque.autos",
      title: meta.title,
      description: meta.description,
      publishedTime: meta.date,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function BlogPost({ params }: Params) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const { default: Article, meta } = post;

  const url = `${APP_URL}/blog/${meta.slug}`;
  const image = meta.image
    ? new URL(meta.image, APP_URL).toString()
    : `${APP_URL}/og.png`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: meta.title,
        description: meta.description,
        datePublished: meta.date,
        dateModified: meta.updated ?? meta.date,
        articleSection: meta.category,
        image,
        url,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        author: { "@id": ORG_ID },
        publisher: { "@id": ORG_ID },
      },
      breadcrumbNode([
        { name: "Início", url: `${APP_URL}/` },
        { name: "Blog", url: `${APP_URL}/blog` },
        { name: meta.title, url },
      ]),
      organizationNode,
      ...(meta.faq?.length
        ? [
            {
              "@type": "FAQPage",
              mainEntity: meta.faq.map(({ q, a }) => ({
                "@type": "Question",
                name: q,
                acceptedAnswer: { "@type": "Answer", text: a },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <ContentShell active="blog">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="ct-article">
        <div className="ct-article-wrap">
          <Link href="/blog" className="ct-back">
            <ArrowLeft size={15} aria-hidden /> Voltar ao blog
          </Link>

          <header className="ct-article-head">
            <span className="ct-article-cat">{meta.category}</span>
            <p className="ct-article-meta">
              <time dateTime={meta.date}>{formatDate(meta.date)}</time>
            </p>
          </header>

          <div className="ct-prose">
            <Article />
          </div>
        </div>
      </article>
    </ContentShell>
  );
}
