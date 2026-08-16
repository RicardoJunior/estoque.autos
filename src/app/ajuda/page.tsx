import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ContentShell } from "../blog/_shell";
import { getAjudaByCategory, type ContentMeta } from "@/lib/content";
import { SITE_URL } from "@/lib/site-url";
import { organizationNode, breadcrumbNode, ORG_ID } from "@/lib/platform-jsonld";

const APP_URL = SITE_URL;

export const metadata: Metadata = {
  title: "Central de ajuda",
  description:
    "Dúvidas sobre o estoque.autos: conta, cadastro de veículos pela FIPE, fotos, personalização, leads, equipe, domínio próprio e cobrança.",
  alternates: { canonical: "/ajuda" },
  openGraph: {
    type: "website",
    url: "/ajuda",
    siteName: "estoque.autos",
    title: "Central de ajuda — estoque.autos",
    description:
      "Guias passo a passo: criar a loja, domínio próprio, cadastro de veículos pela FIPE, planos e cobrança.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Central de ajuda — estoque.autos",
    description:
      "Guias: criar a loja, domínio próprio, FIPE, planos e cobrança.",
  },
};

export default async function AjudaHub() {
  const groups = await getAjudaByCategory();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${APP_URL}/ajuda#collection`,
        name: "Central de ajuda — estoque.autos",
        url: `${APP_URL}/ajuda`,
        inLanguage: "pt-BR",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        publisher: { "@id": ORG_ID },
        hasPart: groups.flatMap((g) =>
          g.articles.map((a) => ({
            "@type": "Article",
            headline: a.title,
            description: a.description,
            url: `${APP_URL}/ajuda/${a.slug}`,
          })),
        ),
      },
      breadcrumbNode([
        { name: "Início", url: `${APP_URL}/` },
        { name: "Ajuda", url: `${APP_URL}/ajuda` },
      ]),
      organizationNode,
    ],
  };

  return (
    <ContentShell active="ajuda">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="ct-hub">
        <div className="ct-wrap">
          <p className="ct-kicker">Central de ajuda</p>
          <h1 className="ct-h1">Como podemos ajudar?</h1>
          <p className="ct-intro">
            Guias passo a passo para tirar o máximo da sua loja no estoque.autos —
            do primeiro acesso ao domínio próprio, cadastro de veículos e cobrança.
          </p>

          {groups.map((g) => (
            <div className="ct-group" key={g.category}>
              <h2 className="ct-group-h">{g.category}</h2>
              <div className="ct-list">
                {g.articles.map((a) => (
                  <ArticleRow key={a.slug} article={a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </ContentShell>
  );
}

function ArticleRow({ article }: { article: ContentMeta }) {
  return (
    <Link href={`/ajuda/${article.slug}`} className="ct-list-item">
      <span>
        <span className="ct-list-t">{article.title}</span>
        <span className="ct-list-d" style={{ display: "block" }}>
          {article.description}
        </span>
      </span>
      <ChevronRight className="ct-list-arrow" size={18} aria-hidden />
    </Link>
  );
}
