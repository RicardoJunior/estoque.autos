import type { ComponentType } from "react";

/**
 * BLOG + CENTRAL DE AJUDA — conteúdo MDX.
 *
 * Estratégia (compatível com o Worker do OpenNext): TODO o MDX é compilado no
 * BUILD via `import()` dinâmico de `content/**`. Nada de `fs` em runtime —
 * `generateStaticParams` pré-renderiza cada artigo e `dynamicParams = false`
 * faz qualquer rota fora da lista virar 404.
 *
 * O frontmatter vem como `export const meta` dentro do próprio .mdx (o
 * `@next/mdx` não parseia YAML; usar exports evita a dependência de
 * gray-matter). Aqui mantemos a LISTA de slugs estática — assim o bundler
 * resolve cada `import()` em build e o índice (hub) não precisa ler diretório.
 */

export type ContentMeta = {
  title: string;
  description: string;
  date: string; // ISO yyyy-mm-dd
  category: string;
  slug: string;
};

type MdxModule = {
  default: ComponentType;
  meta: ContentMeta;
};

// ── Slugs (a ordem aqui é a ordem natural; o hub reordena por data) ──────────
export const BLOG_SLUGS = [
  "como-vender-mais-carros-com-site-proprio",
  "tabela-fipe-precificacao-estoque",
] as const;

export const AJUDA_SLUGS = [
  "criando-sua-loja-em-5-minutos",
  "apontar-dominio-proprio-cname",
  "cadastrando-veiculos-com-fipe",
  "cobranca-e-troca-de-plano",
] as const;

// Ordem das categorias da Central de Ajuda (define a ordem de exibição no hub).
export const AJUDA_CATEGORIES = [
  "Começando",
  "Domínio próprio",
  "Veículos & FIPE",
  "Planos & cobrança",
] as const;

export type BlogSlug = (typeof BLOG_SLUGS)[number];
export type AjudaSlug = (typeof AJUDA_SLUGS)[number];

// ── Importers estáticos (resolvidos no build) ───────────────────────────────
// O caminho-base literal em cada `import()` permite ao bundler incluir só os
// arquivos da respectiva pasta — sem leitura de filesystem em runtime.
async function loadBlog(slug: string): Promise<MdxModule> {
  return (await import(`../../content/blog/${slug}.mdx`)) as unknown as MdxModule;
}

async function loadAjuda(slug: string): Promise<MdxModule> {
  return (await import(`../../content/ajuda/${slug}.mdx`)) as unknown as MdxModule;
}

// ── API do BLOG ──────────────────────────────────────────────────────────────
export async function getBlogPost(slug: string): Promise<MdxModule | null> {
  if (!(BLOG_SLUGS as readonly string[]).includes(slug)) return null;
  return loadBlog(slug);
}

/** Lista de posts ordenada por data (mais recente primeiro). */
export async function getBlogIndex(): Promise<ContentMeta[]> {
  const all = await Promise.all(BLOG_SLUGS.map((s) => loadBlog(s)));
  return all.map((m) => m.meta).sort(byDateDesc);
}

// ── API da AJUDA ──────────────────────────────────────────────────────────────
export async function getAjudaArticle(
  slug: string,
): Promise<MdxModule | null> {
  if (!(AJUDA_SLUGS as readonly string[]).includes(slug)) return null;
  return loadAjuda(slug);
}

export async function getAjudaIndex(): Promise<ContentMeta[]> {
  const all = await Promise.all(AJUDA_SLUGS.map((s) => loadAjuda(s)));
  return all.map((m) => m.meta);
}

/** Artigos da ajuda agrupados por categoria, na ordem de AJUDA_CATEGORIES. */
export async function getAjudaByCategory(): Promise<
  { category: string; articles: ContentMeta[] }[]
> {
  const articles = await getAjudaIndex();
  const known = AJUDA_CATEGORIES.map((category) => ({
    category,
    articles: articles.filter((a) => a.category === category),
  }));
  // Qualquer categoria não prevista entra ao final (defensivo).
  const extras = articles
    .filter((a) => !(AJUDA_CATEGORIES as readonly string[]).includes(a.category))
    .reduce<Record<string, ContentMeta[]>>((acc, a) => {
      (acc[a.category] ??= []).push(a);
      return acc;
    }, {});
  const extraGroups = Object.entries(extras).map(([category, list]) => ({
    category,
    articles: list,
  }));
  return [...known, ...extraGroups].filter((g) => g.articles.length > 0);
}

function byDateDesc(a: ContentMeta, b: ContentMeta) {
  return b.date.localeCompare(a.date);
}

/** Data ISO → "12 de maio de 2026" (pt-BR). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
