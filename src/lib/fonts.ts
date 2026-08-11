import type { TenantFonts, TenantSettings } from "./types";

// ============================================================
// Fontes das lojas (vitrine).
//
// O modelo atual guarda em `settings.fonts` os nomes EXATOS de
// famílias do Google Fonts ({ head, body }) — qualquer uma das
// ~1.9k famílias do catálogo (src/lib/google-fonts.ts).
//
// `STORE_FONTS`/`STORE_FONT_IDS` são o LEGADO da lista curada de
// 8 pares: ficam apenas para resolver `settings.font` de lojas
// antigas para nomes de família reais.
// ============================================================

export const STORE_FONT_IDS = [
  "inter",
  "archivo",
  "manrope",
  "dm-sans",
  "sora",
  "space-grotesk",
  "playfair",
  "bebas",
] as const;

export type StoreFontId = (typeof STORE_FONT_IDS)[number];

/** Fonte padrão quando a loja nunca escolheu nada. */
export const DEFAULT_STORE_FONTS: TenantFonts = { head: "Inter", body: "Inter" };

/** id legado → famílias do Google Fonts. */
export const STORE_FONTS: Record<StoreFontId, TenantFonts> = {
  inter: { head: "Inter", body: "Inter" },
  archivo: { head: "Archivo", body: "Archivo" },
  manrope: { head: "Manrope", body: "Manrope" },
  "dm-sans": { head: "DM Sans", body: "DM Sans" },
  sora: { head: "Sora", body: "Sora" },
  "space-grotesk": { head: "Space Grotesk", body: "Space Grotesk" },
  playfair: { head: "Playfair Display", body: "Inter" },
  bebas: { head: "Bebas Neue", body: "DM Sans" },
};

/**
 * Fontes efetivas da loja: `settings.fonts` (novo) → `settings.font`
 * (id legado) → padrão. Sempre devolve nomes de família do Google Fonts.
 */
export function selectedStoreFonts(
  settings: Pick<TenantSettings, "font" | "fonts"> | undefined | null,
): TenantFonts {
  const fonts = settings?.fonts;
  if (fonts?.head && fonts?.body) return { head: fonts.head, body: fonts.body };
  const legacy = settings?.font;
  if (legacy && legacy in STORE_FONTS) return STORE_FONTS[legacy as StoreFontId];
  return DEFAULT_STORE_FONTS;
}

export interface FontPairing {
  /** Rótulo curto exibido no card de sugestão. */
  label: string;
  head: string;
  body: string;
}

/** Combinações sugeridas no editor de marca (admin e onboarding). */
export const FONT_PAIRINGS: FontPairing[] = [
  { label: "Moderna", head: "Inter", body: "Inter" },
  { label: "Geométrica", head: "Sora", body: "Inter" },
  { label: "Elegante", head: "Playfair Display", body: "Inter" },
  { label: "Impacto", head: "Bebas Neue", body: "DM Sans" },
  { label: "Editorial", head: "Fraunces", body: "Source Sans 3" },
  { label: "Tech", head: "Space Grotesk", body: "DM Sans" },
  { label: "Robusta", head: "Archivo", body: "Archivo" },
  { label: "Amigável", head: "Nunito", body: "Nunito Sans" },
];
