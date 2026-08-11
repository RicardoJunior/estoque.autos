import type { TenantSettings } from "./types";
import { selectedStoreFonts } from "./fonts";

// ============================================================
// Catálogo completo do Google Fonts (gerado a partir de
// fonts.google.com/metadata/fonts — ver src/lib/fonts-data/).
//
// O JSON (~140KB) só entra via import() dinâmico: quem importa
// este módulo estaticamente (layout da vitrine, actions, picker)
// não carrega o catálogo até chamar getFontCatalog().
// ============================================================

export type FontCategory = "sans" | "serif" | "display" | "handwriting" | "mono";

export interface GoogleFont {
  /** Nome exato da família (ex.: "Playfair Display") */
  f: string;
  c: FontCategory;
  /** Pesos estáticos disponíveis */
  w: number[];
  /** 1 = tem itálico */
  i?: number;
  /** Eixo variável de peso [min, max] */
  a?: [number, number];
  /** 1 = cobre o subset latin */
  l?: number;
  /** Rank de popularidade (0 = mais popular) */
  p: number;
}

export const FONT_CATEGORY_LABELS: Record<FontCategory, string> = {
  sans: "Sans-serif",
  serif: "Serif",
  display: "Display",
  handwriting: "Manuscrita",
  mono: "Mono",
};

let catalogPromise: Promise<GoogleFont[]> | null = null;

/** Lista completa (ordenada por popularidade), carregada sob demanda. */
export function getFontCatalog(): Promise<GoogleFont[]> {
  catalogPromise ??= import("./fonts-data/google-fonts.json").then(
    (m) => m.default as GoogleFont[],
  );
  return catalogPromise;
}

let mapPromise: Promise<Map<string, GoogleFont>> | null = null;

function getFontMap(): Promise<Map<string, GoogleFont>> {
  mapPromise ??= getFontCatalog().then(
    (list) => new Map(list.map((f) => [f.f.toLowerCase(), f])),
  );
  return mapPromise;
}

/** Busca exata (case-insensitive) de uma família no catálogo. */
export async function findGoogleFont(
  family: string,
): Promise<GoogleFont | undefined> {
  return (await getFontMap()).get(family.trim().toLowerCase());
}

// ------------------------------------------------------------
// URLs da API css2 (https://fonts.googleapis.com/css2?...)
// ------------------------------------------------------------

/** Pesos que a vitrine realmente usa (font-light..font-black). */
const PREFERRED_WEIGHTS = [300, 400, 500, 600, 700, 800, 900];

/**
 * Trecho `family=` para carregar a família com os pesos úteis.
 * Fontes variáveis pedem o range completo do eixo; estáticas pedem
 * só os pesos existentes (pedir peso inexistente = HTTP 400).
 */
export function familyParam(font: GoogleFont): string {
  const name = font.f.replaceAll(" ", "+");
  if (font.a) return `${name}:wght@${font.a[0]}..${font.a[1]}`;
  const weights = font.w.filter((w) => PREFERRED_WEIGHTS.includes(w));
  const list = (weights.length > 0 ? weights : font.w).join(";");
  return list ? `${name}:wght@${list}` : name;
}

/** Stylesheet com todas as famílias (dedup) — usado na vitrine. */
export function googleFontsHref(fonts: GoogleFont[]): string {
  const uniq = [...new Map(fonts.map((f) => [f.f, f])).values()];
  const params = uniq.map((f) => `family=${familyParam(f)}`).join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

/**
 * Stylesheet mínimo para PREVIEW de uma família (peso padrão, subset
 * apenas dos glifos de `text`) — barato o bastante para o autocomplete
 * carregar dezenas durante a rolagem.
 *
 * Passe o GoogleFont quando tiver: famílias estáticas SEM o corte 400
 * (ex.: Buda, só 300) derrubam a URL sem peso explícito (HTTP 400).
 */
export function specimenHref(font: GoogleFont | string, text?: string): string {
  const family = typeof font === "string" ? font : font.f;
  const name = family.replaceAll(" ", "+");
  const t = encodeURIComponent(text ?? family);
  const needsWeight =
    typeof font !== "string" && !font.a && !font.w.includes(400);
  const spec = needsWeight ? `:wght@${font.w[0]}` : "";
  return `https://fonts.googleapis.com/css2?family=${name}${spec}&text=${t}&display=swap`;
}

/** Stylesheet completo de UMA família com pesos úteis (preview ao vivo). */
export function previewHref(font: GoogleFont): string {
  return `https://fonts.googleapis.com/css2?family=${familyParam(font)}&display=swap`;
}

// ------------------------------------------------------------
// Resolução do tema tipográfico da vitrine (server)
// ------------------------------------------------------------

/** `font-family` completo com fallback adequado à categoria. */
export function fontStack(family: string, category?: FontCategory): string {
  const fallback =
    category === "serif"
      ? "ui-serif, Georgia, serif"
      : category === "mono"
        ? "ui-monospace, SFMono-Regular, monospace"
        : category === "handwriting"
          ? "cursive"
          : "ui-sans-serif, system-ui, sans-serif";
  return `"${family}", ${fallback}`;
}

export interface ResolvedStoreFonts {
  /** URL do stylesheet do Google Fonts (null se nenhuma família conhecida). */
  href: string | null;
  /** font-family (com fallbacks) dos títulos. */
  headStack: string;
  /** font-family (com fallbacks) do corpo. */
  bodyStack: string;
  /** Nomes crus das famílias escolhidas. */
  head: string;
  body: string;
}

/**
 * Resolve as fontes da loja (novas ou legadas) para o que o layout
 * da vitrine precisa: o <link> do Google Fonts + as pilhas CSS.
 * Família fora do catálogo não carrega, mas ainda entra na pilha
 * (o fallback do stack segura a renderização).
 */
export async function resolveStorefrontFonts(
  settings: Pick<TenantSettings, "font" | "fonts"> | undefined | null,
): Promise<ResolvedStoreFonts> {
  const sel = selectedStoreFonts(settings);
  const [head, body] = await Promise.all([
    findGoogleFont(sel.head),
    findGoogleFont(sel.body),
  ]);
  const known = [head, body].filter((f): f is GoogleFont => Boolean(f));
  return {
    href: known.length > 0 ? googleFontsHref(known) : null,
    headStack: fontStack(sel.head, head?.c),
    bodyStack: fontStack(sel.body, body?.c),
    head: sel.head,
    body: sel.body,
  };
}
