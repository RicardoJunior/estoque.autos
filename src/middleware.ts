import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Sessão Supabase + proteção das rotas /admin + domínio próprio.
 *
 * NOTA: no Next 16 o arquivo passou a se chamar `proxy.ts` (com `export proxy`),
 * mas o adapter @opennextjs/cloudflare ainda NÃO builda essa convenção nova
 * (opennextjs/opennextjs-cloudflare#962, #1213). Por isso mantemos o nome
 * legado `middleware.ts` (deprecado, porém funcional no Next 16) — é o caminho
 * suportado pelo OpenNext, rodando no Worker com nodejs_compat. Reverter para
 * `proxy.ts` quando o adapter ganhar suporte.
 */

/** Host (sem porta) do app a partir de NEXT_PUBLIC_APP_URL. */
function appHost(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? "";
  try {
    return raw ? new URL(raw).host.toLowerCase() : "";
  } catch {
    return raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
  }
}

/**
 * Resolve domínio próprio → slug via RPC pública custom_domain_lookup
 * (SECURITY DEFINER, devolve só o slug). Lookup por requisição: sem
 * cache persistente entre invocações do Worker — ok por ora.
 */
async function resolveCustomDomain(host: string): Promise<string | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return null;
  try {
    const res = await fetch(`${base}/rest/v1/rpc/custom_domain_lookup`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ p_host: host }),
    });
    if (!res.ok) return null;
    const slug = (await res.json()) as string | null;
    return typeof slug === "string" && slug.length > 0 ? slug : null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  // ── Domínio próprio: host ≠ host do app → reescreve para /{slug} ──
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  const self = appHost();

  // www do próprio app → 301 para o apex (canônico/SEO)
  if (host === `www.${self}`) {
    const url = request.nextUrl.clone();
    url.host = self;
    return NextResponse.redirect(url, 301);
  }

  const isCustomHost =
    !!host &&
    host !== self &&
    host !== "localhost" &&
    host !== "127.0.0.1" &&
    !host.endsWith(".localhost") &&
    !host.endsWith(".workers.dev");

  if (isCustomHost) {
    const { pathname } = request.nextUrl;
    // rotas do app não pertencem à vitrine de um domínio custom
    const isAppRoute =
      pathname.startsWith("/admin") ||
      pathname.startsWith("/onboarding") ||
      pathname.startsWith("/api") ||
      pathname === "/login" ||
      pathname === "/cadastro" ||
      pathname.startsWith("/cadastro/");
    if (!isAppRoute) {
      const slug = await resolveCustomDomain(host);
      if (slug) {
        // evita prefixo duplicado em requisições internas/RSC já reescritas
        const prefix = `/${slug}`;
        if (pathname !== prefix && !pathname.startsWith(`${prefix}/`)) {
          const url = request.nextUrl.clone();
          url.pathname = `${prefix}${pathname === "/" ? "" : pathname}`;
          return NextResponse.rewrite(url);
        }
      }
    }
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: não remover — getClaims() valida/renova a sessão.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const { pathname } = request.nextUrl;
  const isAdminRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/onboarding");
  const isAuthRoute = pathname === "/login" || pathname === "/cadastro";

  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Tudo exceto assets estáticos e otimização de imagem
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3)$).*)",
  ],
};
