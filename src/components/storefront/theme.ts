import type { CSSProperties } from "react";
import type { TenantColors } from "@/lib/types";
import type { Storefront } from "@/lib/public";
import { readableText, mix, withAlpha } from "@/lib/colors";
import { storeFontVars } from "@/lib/store-fonts-loader";

/**
 * Variáveis CSS do tema da loja, aplicadas no container da vitrine
 * (NÃO em :root global — isso evita o vazamento de estilos da v1).
 */
export function themeVars(colors: TenantColors): CSSProperties {
  return {
    ["--sf-primary" as string]: colors.primary,
    ["--sf-accent" as string]: colors.accent,
    ["--sf-on-primary" as string]: readableText(colors.primary),
    ["--sf-on-accent" as string]: readableText(colors.accent),
    ["--sf-primary-soft" as string]: withAlpha(colors.primary, 0.1),
    ["--sf-primary-dark" as string]: mix(colors.primary, "#000", 0.25),
  };
}

/**
 * Tema completo (cores + fonte) a partir da loja. Emite também
 * --sf-font (corpo) e --sf-font-head (títulos). Use no container
 * da vitrine; os templates referenciam var(--sf-font[-head]).
 */
export function themeVarsFromStore(store: Storefront): CSSProperties {
  return {
    ...themeVars(store.colors),
    ...storeFontVars(store.settings.font),
  };
}
