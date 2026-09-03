import { createAdminClient } from "@/lib/supabase/admin";
import { loadTenantCanonicals } from "@/lib/integrations/canonical";
import { loadConnectionBySetting } from "@/lib/integrations/connections";
import { buildMetaAiaCsv } from "@/lib/integrations/feeds/meta-aia";
import { buildUsadosbrXml } from "@/lib/integrations/feeds/usadosbr-xml";
import type { PortalId } from "@/lib/types";

// ============================================================
// Feeds por loja (o portal busca): token aleatório na URL
// (portal_connections.settings.feed_token). Cache de 1 h.
// ============================================================

export const dynamic = "force-dynamic";

const FILES: Record<string, { portal: PortalId; type: string }> = {
  "meta-vehicles.csv": { portal: "meta_catalog", type: "text/csv; charset=utf-8" },
  "usadosbr.xml": { portal: "usadosbr", type: "application/xml; charset=utf-8" },
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string; file: string }> },
) {
  const { token, file } = await ctx.params;
  const spec = FILES[file];
  if (!spec || !/^[A-Za-z0-9_-]{16,64}$/.test(token)) return new Response("not found", { status: 404 });

  const admin = createAdminClient();
  const conn = await loadConnectionBySetting(admin, spec.portal, "feed_token", token);
  if (!conn || conn.status === "disconnected") return new Response("not found", { status: 404 });

  // loja precisa estar com assinatura vigente (mesmo gate da vitrine)
  const { data: sub } = await admin
    .from("subscriptions")
    .select("status")
    .eq("tenant_id", conn.tenant_id)
    .maybeSingle();
  const status = sub?.status ?? null;
  if (!status || !["active", "trialing", "past_due"].includes(status)) {
    return new Response("not found", { status: 404 });
  }

  const { tenant, items } = await loadTenantCanonicals(admin, conn.tenant_id, conn.settings.phone_override);
  const body =
    spec.portal === "meta_catalog"
      ? buildMetaAiaCsv(items)
      : buildUsadosbrXml(items, tenant);

  await admin
    .from("portal_connections")
    .update({ last_ok_at: new Date().toISOString(), status: "active", last_error: null })
    .eq("id", conn.id);

  return new Response(body, {
    headers: {
      "Content-Type": spec.type,
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": "noindex",
    },
  });
}
