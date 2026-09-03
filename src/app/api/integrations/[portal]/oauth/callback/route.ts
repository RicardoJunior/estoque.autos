import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertConnection, loadConnection } from "@/lib/integrations/connections";
import { seedListingsForConnection } from "@/lib/integrations/listings";
import { OAUTH_COOKIE, unpackCookie, verifyState } from "@/lib/integrations/oauth-state";
import { enqueue } from "@/lib/integrations/queue";
import { getAdapter, isPortalId } from "@/lib/integrations/registry";
import { randomToken } from "@/lib/integrations/crypto";
import { kickWorker } from "@/lib/integrations/kick";
import { SITE_URL } from "@/lib/site-url";
import type { Tenant } from "@/lib/types";

// ============================================================
// Callback do OAuth: valida state + cookie (CSRF), troca o código,
// grava a conexão cifrada, cria os anúncios desejados e enfileira
// sync_tenant. Redireciona para a página do portal no admin.
// ============================================================

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ portal: string }> },
) {
  const { portal } = await ctx.params;
  const url = new URL(req.url);
  const back = (q: string) => NextResponse.redirect(`${SITE_URL}/admin/integracoes/${portal}?${q}`);
  if (!isPortalId(portal)) return new Response("portal inválido", { status: 404 });

  const jar = await cookies();
  const cookie = await unpackCookie(jar.get(OAUTH_COOKIE)?.value);
  jar.delete({ name: OAUTH_COOKIE, path: "/api/integrations" });

  const state = await verifyState(url.searchParams.get("state"), cookie?.nonce);
  if (!state || state.portal !== portal) return back("erro=state");

  // a sessão precisa ser a mesma loja que iniciou (defesa extra ao state)
  const session = await getSession();
  if (!session?.tenant || session.tenant.id !== state.tenantId) return back("erro=sessao");
  if (session.role !== "owner" && session.role !== "admin") return back("erro=sessao");

  if (url.searchParams.get("error")) {
    return back(`erro=${encodeURIComponent(url.searchParams.get("error") ?? "negado")}`);
  }
  const code = url.searchParams.get("code");
  if (!code) return back("erro=code");

  try {
    const adapter = await getAdapter(portal);
    const result = await adapter.connect({
      tenant: session.tenant as Tenant,
      code,
      codeVerifier: cookie?.verifier,
      redirectUri: `${SITE_URL}/api/integrations/${portal}/oauth/callback`,
    });

    const admin = createAdminClient();
    const existing = await loadConnection(admin, session.tenant.id, portal);
    await upsertConnection(admin, {
      tenantId: session.tenant.id,
      portal,
      creds: result.creds,
      externalAccountId: result.externalAccountId,
      tokenExpiresAt: result.tokenExpiresAt ?? null,
      status: "active",
      settings: {
        auto_publish: true,
        unpublish_on_reserved: false,
        ...(existing?.settings ?? {}),
        webhook_secret: existing?.settings.webhook_secret ?? randomToken(24),
      },
    });
    const conn = (await loadConnection(admin, session.tenant.id, portal))!;

    // OLX: registra a URL de leads com o segredo da conexão
    if (adapter.registerWebhook) {
      try {
        await adapter.registerWebhook(
          conn,
          `${SITE_URL}/api/integrations/${portal}/webhook?t=${conn.settings.webhook_secret}`,
        );
        await admin
          .from("portal_connections")
          .update({ settings: { ...conn.settings, leads_registered_at: new Date().toISOString() } })
          .eq("id", conn.id);
      } catch (err) {
        console.error("registerWebhook falhou:", err);
      }
    }

    // token com vencimento (ML: 6h) → refresh agendado
    if (result.tokenExpiresAt && adapter.refreshCredentials) {
      await enqueue(admin, {
        portal,
        kind: "refresh_token",
        tenantId: session.tenant.id,
        runAfter: new Date(result.tokenExpiresAt.getTime() - 30 * 60_000),
      });
    }
    // catálogo leve (marcas/atributos) se ainda não houver
    await enqueue(admin, { portal, kind: "sync_taxonomy", tenantId: session.tenant.id });
    await seedListingsForConnection(admin, conn);
    kickWorker(session.tenant.id);
    return back("ok=1");
  } catch (err) {
    console.error("oauth/callback:", err);
    const msg = err instanceof Error ? err.message : "falha";
    return back(`erro=${encodeURIComponent(msg.slice(0, 120))}`);
  }
}
