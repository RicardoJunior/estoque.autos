// Nós JSON-LD da marca estoque.autos (Organization + WebSite) reutilizados
// pelas páginas da PLATAFORMA (landing, blog, ajuda). NÃO usar nas vitrines
// dos lojistas ([slug]) — elas são white-label e têm a própria entidade.
import { SITE_URL, SOCIAL_PROFILES } from "./site-url";

export const ORG_ID = `${SITE_URL}/#org`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const organizationNode = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "estoque.autos",
  url: SITE_URL,
  description:
    "Plataforma SaaS para lojas de veículos criarem um site profissional em minutos.",
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/icon-512.png`,
    width: 512,
    height: 512,
  },
  sameAs: SOCIAL_PROFILES,
} as const;

export const websiteNode = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: SITE_URL,
  name: "estoque.autos",
  inLanguage: "pt-BR",
  publisher: { "@id": ORG_ID },
} as const;

/** Trilha de navegação (Home → …itens). */
export function breadcrumbNode(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
