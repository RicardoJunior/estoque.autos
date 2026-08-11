// Injeção idempotente de stylesheets de fonte no client (previews do
// editor de marca). Cada href entra uma única vez por sessão de página.

const injected = new Set<string>();

export function injectFontCss(href: string): void {
  if (typeof document === "undefined" || injected.has(href)) return;
  injected.add(href);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}
