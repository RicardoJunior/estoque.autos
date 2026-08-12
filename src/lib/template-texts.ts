import type { TemplateId, TenantSettings } from "./types";

// ============================================================
// Textos personalizáveis dos templates — FONTE ÚNICA dos defaults.
//
// Modelo: o admin PREENCHE os campos com o default do template
// escolhido e o lojista edita à vontade (inclusive apagando).
// Semântica de leitura na vitrine (resolveTemplateText):
//   - undefined  → loja nunca editou → usa o default (compat)
//   - ""         → apagado de propósito → NÃO renderiza o elemento
//   - "texto"    → renderiza o texto do lojista
// ============================================================

export interface TemplateTextDefaults {
  /** olho/eyebrow acima do título da hero ("" = template não tem eyebrow) */
  hero_eyebrow: string;
  /** título da hero; "" = default dinâmico (ex.: carro em destaque) */
  hero_title: string;
  hero_subtitle: string;
  /** rótulo do botão principal da hero ("" = template não tem CTA) */
  hero_cta: string;
  /** heading da seção de destaques ("" = template não tem a seção) */
  featured_title: string;
  featured_subtitle: string;
  /** heading da seção de estoque completo */
  stock_title: string;
}

export const TEMPLATE_TEXT_DEFAULTS: Record<TemplateId, TemplateTextDefaults> = {
  classico: {
    hero_eyebrow: "",
    hero_title: "O carro certo, com confiança",
    hero_subtitle:
      "Veículos selecionados e revisados, com atendimento próximo do início ao fim da sua compra.",
    hero_cta: "Ver estoque",
    featured_title: "Destaques da loja",
    featured_subtitle: "Selecionados a dedo pela nossa equipe.",
    stock_title: "Todo o estoque",
  },
  moderno: {
    hero_eyebrow: "",
    hero_title: "Seu próximo carro está aqui",
    hero_subtitle:
      "Estoque selecionado, condições especiais e atendimento direto. Encontre o veículo certo para você.",
    hero_cta: "Explorar estoque",
    featured_title: "Destaques da semana",
    featured_subtitle: "Seleção especial do nosso time",
    stock_title: "Todo o estoque",
  },
  premium: {
    // hero do Premium destaca o carro em evidência (título dinâmico)
    hero_eyebrow: "Destaque da casa",
    hero_title: "",
    hero_subtitle: "",
    hero_cta: "Ver detalhes",
    featured_title: "Recém-chegados",
    featured_subtitle: "Seleção curada",
    stock_title: "Nossa coleção",
  },
  minimal: {
    hero_eyebrow: "Estoque",
    hero_title: "",
    hero_subtitle: "Uma seleção cuidadosa de veículos.",
    hero_cta: "Ver detalhes",
    featured_title: "Em destaque",
    featured_subtitle: "",
    stock_title: "Estoque",
  },
  esportivo: {
    hero_eyebrow: "Pronta entrega",
    hero_title: "POTÊNCIA NA SUA GARAGEM",
    hero_subtitle:
      "Velocidade, adrenalina e os melhores negócios. Acelere rumo ao carro dos seus sonhos.",
    hero_cta: "Ver estoque",
    featured_title: "Em destaque",
    featured_subtitle: "",
    stock_title: "Todo o estoque",
  },
  vitrine: {
    // hero da Vitrine destaca o carro em evidência (título dinâmico)
    hero_eyebrow: "A vitrine",
    hero_title: "",
    hero_subtitle: "",
    hero_cta: "Ver detalhes",
    featured_title: "",
    featured_subtitle: "",
    stock_title: "A vitrine",
  },
};

/**
 * Resolve um texto editável: undefined → default (loja nunca mexeu);
 * "" → null (apagado de propósito, elemento não renderiza).
 */
export function resolveTemplateText(
  value: string | undefined,
  fallback: string,
): string | null {
  if (value === undefined) return fallback.trim() === "" ? null : fallback;
  const t = value.trim();
  return t === "" ? null : t;
}

/**
 * Resolve de uma vez os textos editáveis de um template a partir das
 * settings da loja. `null` = o template NÃO renderiza o elemento
 * (ou aplica o próprio fallback dinâmico, ex.: nome da loja).
 */
export function templateTexts(id: TemplateId, settings: TenantSettings) {
  const D = TEMPLATE_TEXT_DEFAULTS[id];
  return {
    heroEyebrow: resolveTemplateText(settings.hero?.eyebrow, D.hero_eyebrow),
    heroTitle: resolveTemplateText(settings.hero?.title, D.hero_title),
    heroSubtitle: resolveTemplateText(settings.hero?.subtitle, D.hero_subtitle),
    heroCta: resolveTemplateText(settings.hero?.cta_label, D.hero_cta),
    featuredTitle: resolveTemplateText(
      settings.texts?.featured_title,
      D.featured_title,
    ),
    featuredSubtitle: resolveTemplateText(
      settings.texts?.featured_subtitle,
      D.featured_subtitle,
    ),
    stockTitle: resolveTemplateText(settings.texts?.stock_title, D.stock_title),
  };
}
