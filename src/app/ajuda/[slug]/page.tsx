import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ContentShell } from "../../blog/_shell";
import { AJUDA_SLUGS, getAjudaArticle } from "@/lib/content";
import { SITE_URL } from "@/lib/site-url";
import {
  organizationNode,
  breadcrumbNode,
  ORG_ID,
} from "@/lib/platform-jsonld";

const APP_URL = SITE_URL;

export function generateStaticParams() {
  return AJUDA_SLUGS.map((slug) => ({ slug }));
}
export const dynamicParams = false;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = await getAjudaArticle(slug);
  if (!article) return {};
  const { meta } = article;
  const url = `/ajuda/${meta.slug}`;
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
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function AjudaArticle({ params }: Params) {
  const { slug } = await params;
  const article = await getAjudaArticle(slug);
  if (!article) notFound();

  const { default: Body, meta } = article;

  const url = `${APP_URL}/ajuda/${meta.slug}`;
  const image = meta.image
    ? new URL(meta.image, APP_URL).toString()
    : `${APP_URL}/og.png`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
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
        { name: "Ajuda", url: `${APP_URL}/ajuda` },
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
    <ContentShell active="ajuda">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="ct-article">
        <div className="ct-article-wrap">
          <Link href="/ajuda" className="ct-back">
            <ArrowLeft size={15} aria-hidden /> Voltar à central de ajuda
          </Link>

          <header className="ct-article-head">
            <span className="ct-article-cat">{meta.category}</span>
          </header>

          <div className="ct-prose">
            <Body />
          </div>
        </div>
      </article>
    </ContentShell>
  );
}
