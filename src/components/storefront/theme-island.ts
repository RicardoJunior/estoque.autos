import type { CSSProperties } from "react";

// ============================================================
// "Ilha" shadcn dentro da vitrine.
//
// O app inteiro roda com .dark no <html>, e os overlays (Dialog,
// Sheet, Select) são portalados para fora do container que carrega
// as vars --sf-* do tema da loja. Estes helpers resolvem os dois
// problemas: tokens shadcn CLAROS forçados no overlay + cópia das
// vars --sf-* resolvidas a partir de um elemento dentro do tema.
// ============================================================

/** Vars do tema da loja que os overlays precisam levar consigo. */
export const SF_THEME_VARS = [
  "--sf-primary",
  "--sf-accent",
  "--sf-on-accent",
  "--sf-font",
] as const;

/** Copia os valores resolvidos das --sf-* a partir de um elemento temado. */
export function captureSfVars(el: HTMLElement): CSSProperties {
  const computed = getComputedStyle(el);
  const vars: Record<string, string> = {};
  for (const name of SF_THEME_VARS) {
    const value = computed.getPropertyValue(name).trim();
    if (value) vars[name] = value;
  }
  return vars as CSSProperties;
}

/**
 * Tokens shadcn claros (mesmos valores do :root de globals.css) com a
 * cor de ação apontando para o accent da loja: componentes shadcn
 * dentro do overlay ficam com a identidade shadcn, na marca da loja.
 */
export const LIGHT_ISLAND = {
  "--background": "oklch(1 0 0)",
  "--foreground": "oklch(0.15 0 0)",
  "--card": "oklch(1 0 0)",
  "--card-foreground": "oklch(0.15 0 0)",
  "--popover": "oklch(1 0 0)",
  "--popover-foreground": "oklch(0.15 0 0)",
  "--primary": "var(--sf-accent, oklch(0.72 0.18 47))",
  "--primary-foreground": "var(--sf-on-accent, #ffffff)",
  "--secondary": "oklch(0.97 0 0)",
  "--secondary-foreground": "oklch(0.2 0 0)",
  "--muted": "oklch(0.97 0 0)",
  "--muted-foreground": "oklch(0.5 0 0)",
  "--accent": "oklch(0.97 0 0)",
  "--accent-foreground": "oklch(0.2 0 0)",
  "--destructive": "oklch(0.58 0.22 27)",
  "--border": "oklch(0.92 0 0)",
  "--input": "oklch(0.92 0 0)",
  "--ring": "oklch(0.6 0 0 / 40%)",
} as CSSProperties;
