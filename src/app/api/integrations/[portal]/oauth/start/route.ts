import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { portalsAllowed } from "@/lib/billing";
import { createPkce, OAUTH_COOKIE, packCookie, signState } from "@/lib/integrations/oauth-state";
import { isPortalId, PORTAL_META } from "@/lib/integrations/registry";
import { randomToken } from "@/lib/integrations/crypto";
import { SITE_URL } from "@/lib/site-url";

// ============================================================
// Início do OAuth (ML/OLX): exige sessão owner/admin na loja ativa,
// gera state assinado + PKCE e redireciona para o portal.
// ============================================================

export const dynamic = "force-dynamic";

function redirectUriFor(portal: string): string {
  return `${SITE_URL}/api/integrations/${portal}/oauth/callback`;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ portal: string }> },
) {
  const { portal } = await ctx.params;
  if (!isPortalId(portal) || PORTAL_META[portal].mode !== "oauth" || !PORTAL_META[portal].implemented) {
    return new Response("portal inválido", { status: 404 });
  }

  const session = await getSession();
  if (!session?.tenant) return NextResponse.redirect(`${SITE_URL}/login?next=/admin/integracoes`);
  if (session.role !== "owner" && session.role !== "admin") {
    return NextResponse.redirect(`${SITE_URL}/admin`);
  }
  if (!portalsAllowed(session.tenant.plan) || session.tenant.slug === "demo") {
    return NextResponse.redirect(`${SITE_URL}/admin/integracoes?erro=plano`);
  }

  const nonce = randomToken(16);
  const state = await signState({ tenantId: session.tenant.id, portal, nonce });
  const redirectUri = redirectUriFor(portal);

  let url: string;
  try {
    if (portal === "mercadolivre") {
      const { authorizeUrl } = await import("@/lib/integrations/mercadolivre/oauth");
      const pkce = await createPkce();
      url = authorizeUrl({ redirectUri, state, codeChallenge: pkce.challenge });
      const jar = await cookies();
      jar.set(OAUTH_COOKIE, await packCookie({ nonce, verifier: pkce.verifier }), cookieOpts());
    } else {
      const { authorizeUrl } = await import("@/lib/integrations/olx/oauth");
      url = authorizeUrl({ redirectUri, state });
      const jar = await cookies();
      jar.set(OAUTH_COOKIE, await packCookie({ nonce }), cookieOpts());
    }
  } catch (err) {
    console.error("oauth/start:", err);
    return NextResponse.redirect(`${SITE_URL}/admin/integracoes/${portal}?erro=config`);
  }
  return NextResponse.redirect(url);
}

function cookieOpts() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: SITE_URL.startsWith("https://"),
    path: "/api/integrations",
    maxAge: 600,
  };
}
