/** Utilidades de cor para previews e temas das lojas. */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Cor de texto legível (preto ou branco) sobre um fundo. */
export function readableText(bgHex: string): "#ffffff" | "#0f172a" {
  const [r, g, b] = hexToRgb(bgHex);
  // luminância relativa (WCAG simplificada)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#0f172a" : "#ffffff";
}

/** Versão translúcida da cor (para fundos suaves). */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Mistura a cor com branco (tint) ou preto (shade). amount 0..1 */
export function mix(hex: string, target: "#fff" | "#000", amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const t = target === "#fff" ? 255 : 0;
  const m = (c: number) => Math.round(c + (t - c) * amount);
  return `rgb(${m(r)}, ${m(g)}, ${m(b)})`;
}
