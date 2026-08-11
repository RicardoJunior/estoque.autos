/** Constantes do blog + helpers de URL (respeitam o `base` do Astro). */

export const SITE = {
  name: "estoque.autos",
  url: "https://estoque.autos",
  title: "Blog estoque.autos — gestão e vendas para lojas de carros",
  description:
    "Guias práticos para donos de loja de carros: gestão de estoque e caixa, comissões e bonificações, consignados, precificação e marketing para vender mais.",
  author: "Equipe estoque.autos",
} as const;

/** Links para o produto (site/app principal). */
export const PRODUCT = {
  home: "https://estoque.autos",
  planos: "https://estoque.autos/#planos",
  login: "https://estoque.autos/login",
  ajuda: "https://estoque.autos/ajuda",
  termos: "https://estoque.autos/termos",
  privacidade: "https://estoque.autos/privacidade",
} as const;

export type CategoryId =
  | "gestao"
  | "vendas"
  | "financeiro"
  | "consignados"
  | "marketing";

export const CATEGORIES: Record<
  CategoryId,
  { name: string; description: string }
> = {
  gestao: {
    name: "Gestão",
    description:
      "Gestão de estoque, avaliação de veículos, documentação e operação do dia a dia da loja de carros.",
  },
  vendas: {
    name: "Vendas & Equipe",
    description:
      "Comissões, bonificações, metas e como montar e liderar a equipe de vendas da sua loja.",
  },
  financeiro: {
    name: "Financeiro",
    description:
      "Fluxo de caixa, capital de giro, precificação, margem e financiamento para revenda de veículos.",
  },
  consignados: {
    name: "Consignados",
    description:
      "Como trabalhar com carros consignados: contrato, percentual, riscos e boas práticas.",
  },
  marketing: {
    name: "Marketing",
    description:
      "WhatsApp, fotos, anúncios, SEO local e site próprio: como atrair compradores para o seu estoque.",
  },
};

/** Prefixa um caminho com o `base` configurado (ex.: /blog). */
export function url(path = ""): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
  return `${base}/${path.replace(/^\/+/, "")}`;
}

export function postUrl(slug: string): string {
  return url(`${slug}/`);
}

export function categoryUrl(id: string): string {
  return url(`categoria/${id}/`);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

/** Minutos de leitura a partir do markdown cru (~200 palavras/min). */
export function readingTime(body: string): number {
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 200));
}
