import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ContentShell } from "./_shell";
import { getBlogIndex, formatDate, type ContentMeta } from "@/lib/content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.estoque.autos";

export const metadata: Metadata = {
  title: "Blog — dicas para vender mais carros",
  description:
    "Conteúdos práticos para lojas e revendas de veículos: como vender mais com um site próprio, precificação com a tabela FIPE, captação de leads e SEO.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: "/blog",
    siteName: "estoque.autos",
    title: "Blog do estoque.autos — dicas para vender mais carros",
    description:
      "Conteúdos práticos para lojas e revendas de veículos: site próprio, tabela FIPE, leads e SEO.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog do estoque.autos",
    description:
      "Dicas práticas para lojas de carros: site próprio, FIPE, leads e SEO.",
  },
};

export default async function BlogHub() {
  const posts = await getBlogIndex();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog do estoque.autos",
    url: `${APP_URL}/blog`,
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      datePublished: p.date,
      url: `${APP_URL}/blog/${p.slug}`,
    })),
  };

  return (
    <ContentShell active="blog">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="ct-hub">
        <div className="ct-wrap">
          <p className="ct-kicker">Blog</p>
          <h1 className="ct-h1">Para vender mais carros.</h1>
          <p className="ct-intro">
            Estratégias práticas de site próprio, precificação com a tabela FIPE,
            captação de leads e SEO — feito para lojas e revendas de veículos.
          </p>

          <div className="ct-grid">
            {posts.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </div>
      </section>
    </ContentShell>
  );
}

function PostCard({ post }: { post: ContentMeta }) {
  return (
    <Link href={`/blog/${post.slug}`} className="ct-card">
      <span className="ct-card-cat">{post.category}</span>
      <span className="ct-card-t">{post.title}</span>
      <span className="ct-card-d">{post.description}</span>
      <span className="ct-card-meta">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <ArrowUpRight className="ct-card-arrow" size={18} aria-hidden />
      </span>
    </Link>
  );
}
