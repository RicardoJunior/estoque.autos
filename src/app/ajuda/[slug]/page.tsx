import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ContentShell } from "../../blog/_shell";
import { AJUDA_SLUGS, getAjudaArticle } from "@/lib/content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.estoque.autos";

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.title,
    description: meta.description,
    articleSection: meta.category,
    url: `${APP_URL}/ajuda/${meta.slug}`,
    author: { "@type": "Organization", name: "estoque.autos" },
    publisher: { "@type": "Organization", name: "estoque.autos" },
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
