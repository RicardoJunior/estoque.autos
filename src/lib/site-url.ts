// URL canônica da plataforma — fallback ÚNICO para todo o app (metadata,
// canonical, sitemap, robots e JSON-LD). Evita divergência de host
// (estoque.autos vs app.estoque.autos vs localhost) quando
// NEXT_PUBLIC_APP_URL não está setado no build.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://estoque.autos"
).replace(/\/+$/, "");

/** Perfis sociais oficiais — usados em sameAs do JSON-LD Organization. */
export const SOCIAL_PROFILES = ["https://www.instagram.com/estoque.autos"];

/** Hosts da própria plataforma (não são domínio próprio de lojista). */
export function isPlatformHost(host: string | null | undefined): boolean {
  const h = (host ?? "").toLowerCase().split(":")[0];
  return (
    h === "estoque.autos" ||
    h === "www.estoque.autos" ||
    h === "app.estoque.autos" ||
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === ""
  );
}

/**
 * URL pública canônica de uma vitrine, considerando domínio próprio (Pro).
 * - Domínio próprio serve a loja na RAIZ: https://sualoja.com.br{path}
 * - Plataforma serve em /{slug}: https://estoque.autos/{slug}{path}
 * `path` deve começar com "/" (ex.: "/carros/123", "/sobre") ou ser "".
 */
export function storefrontUrl(
  host: string | null | undefined,
  slug: string,
  path = "",
): string {
  if (host && !isPlatformHost(host)) {
    const clean = host.split(":")[0];
    return `https://${clean}${path}`;
  }
  return `${SITE_URL}/${slug}${path}`;
}
