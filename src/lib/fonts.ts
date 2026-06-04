// ============================================================
// Fontes das lojas (vitrine). Lista curada de pares Google Fonts.
// `head` = família para títulos/display; `body` = família p/ texto.
// Os nomes são exatamente as famílias CSS (`font-family`) que o
// next/font expõe — ver src/lib/store-fonts-loader.ts.
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

export interface StoreFont {
  /** Rótulo amigável exibido no admin. */
  label: string;
  /** Família CSS dos títulos/display. */
  head: string;
  /** Família CSS do corpo de texto. */
  body: string;
}

/** Fonte padrão quando a loja não escolheu nenhuma. */
export const DEFAULT_FONT_ID: StoreFontId = "inter";

export const STORE_FONTS: Record<StoreFontId, StoreFont> = {
  inter: {
    label: "Inter",
    head: "Inter",
    body: "Inter",
  },
  archivo: {
    label: "Archivo",
    head: "Archivo",
    body: "Archivo",
  },
  manrope: {
    label: "Manrope",
    head: "Manrope",
    body: "Manrope",
  },
  "dm-sans": {
    label: "DM Sans",
    head: "DM Sans",
    body: "DM Sans",
  },
  sora: {
    label: "Sora",
    head: "Sora",
    body: "Sora",
  },
  "space-grotesk": {
    label: "Space Grotesk",
    head: "Space Grotesk",
    body: "Space Grotesk",
  },
  playfair: {
    label: "Playfair + Inter",
    head: "Playfair Display",
    body: "Inter",
  },
  bebas: {
    label: "Bebas + DM Sans",
    head: "Bebas Neue",
    body: "DM Sans",
  },
};

/** Resolve um id arbitrário para uma fonte válida (fallback no padrão). */
export function resolveFontId(id: string | undefined | null): StoreFontId {
  return id && id in STORE_FONTS ? (id as StoreFontId) : DEFAULT_FONT_ID;
}
