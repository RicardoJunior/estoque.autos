import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConnectionSettings, ConnectionStatus, ListingStatus } from "@/lib/integrations/types";
import type { PortalId } from "@/lib/types";

// ============================================================
// Leituras das telas de Integrações com o client do USUÁRIO:
// portal_connection_status (RPC definer, sem credenciais) e
// portal_listings (RLS: membro lê). Nada de admin client aqui.
// ============================================================

export interface ConnectionView {
  portal: PortalId;
  status: ConnectionStatus;
  external_account_id: string | null;
  settings: ConnectionSettings;
  last_error: string | null;
  last_ok_at: string | null;
  created_at: string;
}

export async function loadConnectionViews(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<Map<PortalId, ConnectionView>> {
  const { data } = await supabase.rpc("portal_connection_status", { p_tenant: tenantId });
  const rows = (data ?? []) as ConnectionView[];
  return new Map(rows.map((r) => [r.portal, { ...r, settings: r.settings ?? {} }]));
}

export interface ListingCounts {
  active: number;
  queued: number;
  error: number;
  total: number;
}

export async function loadListingCounts(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<Map<PortalId, ListingCounts>> {
  const { data } = await supabase
    .from("portal_listings")
    .select("portal, status, desired")
    .eq("tenant_id", tenantId);
  const out = new Map<PortalId, ListingCounts>();
  for (const r of (data ?? []) as { portal: PortalId; status: ListingStatus; desired: boolean }[]) {
    if (!r.desired) continue;
    const c = out.get(r.portal) ?? { active: 0, queued: 0, error: 0, total: 0 };
    c.total += 1;
    if (r.status === "active") c.active += 1;
    else if (r.status === "queued" || r.status === "publishing") c.queued += 1;
    else if (r.status === "error" || r.status === "rejected") c.error += 1;
    out.set(r.portal, c);
  }
  return out;
}
