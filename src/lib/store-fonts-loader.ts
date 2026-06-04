import type { CSSProperties } from "react";
import {
  Inter,
  Archivo,
  Manrope,
  DM_Sans,
  Sora,
  Space_Grotesk,
  Playfair_Display,
  Bebas_Neue,
} from "next/font/google";
import { resolveFontId, type StoreFontId } from "./fonts";

// ============================================================
// next/font exige instâncias ESTÁTICAS (chamadas no topo do módulo,
// com argumentos constantes) — não dá para gerar dinamicamente.
// Instanciamos as ~8 fontes aqui e exportamos um map id→famílias CSS.
// ============================================================

const inter = Inter({ subsets: ["latin"], display: "swap" });
const archivo = Archivo({ subsets: ["latin"], display: "swap" });
const manrope = Manrope({ subsets: ["latin"], display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], display: "swap" });
const sora = Sora({ subsets: ["latin"], display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap" });
// Bebas Neue não é variável: precisa de weight explícito.
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });

interface LoadedFont {
  /** `font-family` (com fallbacks) da família de títulos. */
  head: string;
  /** `font-family` (com fallbacks) da família de corpo. */
  body: string;
  /**
   * classNames das instâncias (head + body). Aplicar no container
   * garante que o next/font injete o @font-face das duas famílias.
   */
  className: string;
}

function pair(headCls: string, bodyCls: string): string {
  return headCls === bodyCls ? headCls : `${headCls} ${bodyCls}`;
}

/**
 * Map id→famílias resolvidas pelo next/font. Cada `style.fontFamily`
 * já vem com a família self-hosted + os fallbacks ajustados.
 */
const LOADED_FONTS: Record<StoreFontId, LoadedFont> = {
  inter: {
    head: inter.style.fontFamily,
    body: inter.style.fontFamily,
    className: inter.className,
  },
  archivo: {
    head: archivo.style.fontFamily,
    body: archivo.style.fontFamily,
    className: archivo.className,
  },
  manrope: {
    head: manrope.style.fontFamily,
    body: manrope.style.fontFamily,
    className: manrope.className,
  },
  "dm-sans": {
    head: dmSans.style.fontFamily,
    body: dmSans.style.fontFamily,
    className: dmSans.className,
  },
  sora: {
    head: sora.style.fontFamily,
    body: sora.style.fontFamily,
    className: sora.className,
  },
  "space-grotesk": {
    head: spaceGrotesk.style.fontFamily,
    body: spaceGrotesk.style.fontFamily,
    className: spaceGrotesk.className,
  },
  playfair: {
    head: playfair.style.fontFamily,
    body: inter.style.fontFamily,
    className: pair(playfair.className, inter.className),
  },
  bebas: {
    head: bebas.style.fontFamily,
    body: dmSans.style.fontFamily,
    className: pair(bebas.className, dmSans.className),
  },
};

/** Famílias CSS (head/body) da fonte escolhida — com fallback no padrão. */
export function getStoreFontFamilies(id: string | undefined | null): LoadedFont {
  return LOADED_FONTS[resolveFontId(id)];
}

/** className(s) do next/font da fonte escolhida — aplicar no container. */
export function storeFontClassName(id: string | undefined | null): string {
  return LOADED_FONTS[resolveFontId(id)].className;
}

/** Vars CSS de fonte para mesclar no `style` do container da vitrine. */
export function storeFontVars(id: string | undefined | null): CSSProperties {
  const f = getStoreFontFamilies(id);
  return {
    ["--sf-font" as string]: f.body,
    ["--sf-font-head" as string]: f.head,
  };
}

/**
 * Famílias para preview no admin (client). Não dá para enviar a
 * instância do next/font ao client, mas a string `fontFamily` é
 * serializável e renderiza a fonte self-hosted corretamente.
 */
export function storeFontPreviewMap(): Record<StoreFontId, LoadedFont> {
  return LOADED_FONTS;
}
