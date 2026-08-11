import type { CSSProperties } from "react";
import type { TenantColors } from "@/lib/types";
import type { ResolvedStoreFonts } from "@/lib/google-fonts";
import { readableText, mix, withAlpha } from "@/lib/colors";

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
 * Tokens ESTRUTURAIS derivados da cor de fundo escolhida pela loja.
 * Só são emitidos quando há cor custom — os templates referenciam
 * var(--sf-bg, <padrão do template>) etc., então sem custom cada
 * template mantém o próprio shell (branco, #0a0e1a, slate-950…).
 *
 * Tokens: --sf-bg, --sf-ink (texto), --sf-ink-soft, --sf-ink-faint,
 * --sf-surface (cartões), --sf-surface-2, --sf-border.
 */
export function surfaceVars(
  background: string | undefined | null,
): CSSProperties {
  if (!background) return {};
  const ink = readableText(background);
  const dark = ink === "#ffffff";
  const lift = dark ? "#fff" : "#000";
  return {
    ["--sf-bg" as string]: background,
    ["--sf-ink" as string]: ink,
    ["--sf-ink-soft" as string]: withAlpha(ink, 0.62),
    ["--sf-ink-faint" as string]: withAlpha(ink, 0.4),
    ["--sf-surface" as string]: mix(background, lift, 0.05),
    ["--sf-surface-2" as string]: mix(background, lift, 0.1),
    ["--sf-border" as string]: withAlpha(ink, dark ? 0.16 : 0.12),
  };
}

/**
 * Vars de tipografia — os templates referenciam var(--sf-font) no corpo
 * e var(--sf-font-head) nos títulos. As pilhas vêm de
 * resolveStorefrontFonts() (Google Fonts dinâmico, ver [slug]/layout).
 */
export function fontVars(
  fonts: Pick<ResolvedStoreFonts, "headStack" | "bodyStack">,
): CSSProperties {
  return {
    ["--sf-font" as string]: fonts.bodyStack,
    ["--sf-font-head" as string]: fonts.headStack,
  };
}
