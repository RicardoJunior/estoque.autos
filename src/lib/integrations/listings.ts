import type { SupabaseClient } from "@supabase/supabase-js";
import type { PortalId, Vehicle, VehicleStatus } from "../types";
import { listConnections } from "./connections";
import { enqueue } from "./queue";
import { isPublishingPortal } from "./registry";
import type { Connection, ListingRow } from "./types";

// ============================================================
// portal_listings + gatilhos que enfileiram (docs §5.5). Chamado
// pelas server actions de veículo (após requireStaff) e pelo worker.
// ============================================================

export async function listListings(
  client: SupabaseClient,
  filter: { tenantId: string; portal?: PortalId; vehicleId?: string },
): Promise<ListingRow[]> {
  let q = client.from("portal_listings").select("*").eq("tenant_id", filter.tenantId);
  if (filter.portal) q = q.eq("portal", filter.portal);
  if (filter.vehicleId) q = q.eq("vehicle_id", filter.vehicleId);
  const { data } = await q.order("created_at", { ascending: true });
  return (data ?? []) as ListingRow[];
}

export async function getListing(
  admin: SupabaseClient,
  vehicleId: string,
  portal: PortalId,
): Promise<ListingRow | null> {
  const { data } = await admin
    .from("portal_listings")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .eq("portal", portal)
    .maybeSingle();
  return (data as ListingRow | null) ?? null;
}

export async function updateListing(
  admin: SupabaseClient,
  id: string,
  patch: Partial<
    Pick<
      ListingRow,
      | "status"
      | "external_id"
      | "external_url"
      | "content_hash"
      | "payload_snapshot"
      | "expires_at"
      | "last_error"
      | "error_details"
      | "last_synced_at"
      | "desired"
    >
  >,
): Promise<void> {
  await admin.from("portal_listings").update(patch).eq("id", id);
}

/** Conexões ativas da loja que publicam por item/lote (não feeds). */
export async function publishingConnections(
  admin: SupabaseClient,
  tenantId: string,
): Promise<Connection[]> {
  const conns = await listConnections(admin, {
    tenantId,
    status: ["active", "needs_plan", "error"],
  });
  return conns.filter((c) => isPublishingPortal(c.portal));
}

/**
 * Aplica a escolha "Publicar em" do formulário: portais marcados viram
 * desired=true (+publish/update), desmarcados viram desired=false
 * (+unpublish se havia anúncio). Portais sem conexão são ignorados.
 */
export async function applyDesiredPortals(
  admin: SupabaseClient,
  tenantId: string,
  vehicleId: string,
  wanted: PortalId[],
  opts: { vehicleActive: boolean },
): Promise<void> {
  const conns = await publishingConnections(admin, tenantId);
  if (conns.length === 0) return;
  const existing = await listListings(admin, { tenantId, vehicleId });
  const byPortal = new Map(existing.map((l) => [l.portal, l]));

  for (const conn of conns) {
    const want = wanted.includes(conn.portal);
    const current = byPortal.get(conn.portal);

    if (want) {
      if (!current) {
        await admin.from("portal_listings").insert({
          tenant_id: tenantId,
          vehicle_id: vehicleId,
          portal: conn.portal,
          desired: true,
          status: "queued",
        });
      } else if (!current.desired) {
        await updateListing(admin, current.id, { desired: true, status: "queued", last_error: null });
      }
      if (opts.vehicleActive) {
        await enqueue(admin, {
          portal: conn.portal,
          kind: current?.external_id ? "update" : "publish",
          tenantId,
          vehicleId,
        });
      }
    } else if (current?.desired) {
      await updateListing(admin, current.id, { desired: false });
      if (current.external_id) {
        await enqueue(admin, {
          portal: conn.portal,
          kind: "unpublish",
          tenantId,
          vehicleId,
          payload: { external_id: current.external_id },
        });
      } else {
        await updateListing(admin, current.id, { status: "removed" });
      }
    }
  }
}

/** Veículo editado (ficha, fotos, preço): reenvia onde está marcado. */
export async function enqueueVehicleUpdate(
  admin: SupabaseClient,
  tenantId: string,
  vehicleId: string,
): Promise<void> {
  const listings = await listListings(admin, { tenantId, vehicleId });
  for (const l of listings) {
    if (!l.desired) continue;
    await enqueue(admin, {
      portal: l.portal,
      kind: l.external_id ? "update" : "publish",
      tenantId,
      vehicleId,
    });
  }
}

/**
 * Mudança de status do veículo: sold/archived removem dos portais;
 * reserved segue a opção da conexão; available (re)publica os marcados.
 */
export async function enqueueForStatus(
  admin: SupabaseClient,
  tenantId: string,
  vehicleId: string,
  status: VehicleStatus,
): Promise<void> {
  const listings = await listListings(admin, { tenantId, vehicleId });
  if (listings.length === 0) return;
  const conns = await publishingConnections(admin, tenantId);
  const settings = new Map(conns.map((c) => [c.portal, c.settings]));

  for (const l of listings) {
    if (!l.desired) continue;
    const remove =
      status === "sold" ||
      status === "archived" ||
      (status === "reserved" && settings.get(l.portal)?.unpublish_on_reserved === true);
    if (remove) {
      if (l.external_id) {
        await enqueue(admin, {
          portal: l.portal,
          kind: "unpublish",
          tenantId,
          vehicleId,
          payload: { external_id: l.external_id, keep_desired: true },
        });
      }
    } else {
      await enqueue(admin, {
        portal: l.portal,
        kind: l.external_id ? "update" : "publish",
        tenantId,
        vehicleId,
      });
    }
  }
}

/**
 * Antes de EXCLUIR o veículo: enfileira a remoção com o external_id no
 * payload e vehicle_id nulo (a linha some com o cascade; o job sobrevive).
 */
export async function enqueueUnpublishBeforeDelete(
  admin: SupabaseClient,
  tenantId: string,
  vehicleId: string,
): Promise<void> {
  const listings = await listListings(admin, { tenantId, vehicleId });
  for (const l of listings) {
    if (!l.external_id) continue;
    await enqueue(admin, {
      portal: l.portal,
      kind: "unpublish",
      tenantId,
      vehicleId: null,
      payload: { external_id: l.external_id, deleted_vehicle_id: vehicleId },
    });
  }
}

/**
 * Conexão criada: cria listings para o estoque ativo (desired conforme
 * auto_publish) e enfileira sync_tenant.
 */
export async function seedListingsForConnection(
  admin: SupabaseClient,
  conn: Connection,
): Promise<number> {
  if (!isPublishingPortal(conn.portal)) return 0;
  const desired = conn.settings.auto_publish !== false;
  const { data } = await admin
    .from("vehicles")
    .select("id")
    .eq("tenant_id", conn.tenant_id)
    .in("status", ["available", "reserved"]);
  const ids = ((data ?? []) as Pick<Vehicle, "id">[]).map((v) => v.id);
  if (ids.length > 0) {
    await admin.from("portal_listings").upsert(
      ids.map((id) => ({
        tenant_id: conn.tenant_id,
        vehicle_id: id,
        portal: conn.portal,
        desired,
        status: "queued",
      })),
      { onConflict: "vehicle_id,portal", ignoreDuplicates: true },
    );
  }
  await enqueue(admin, { portal: conn.portal, kind: "sync_tenant", tenantId: conn.tenant_id });
  return ids.length;
}

/** Assinatura caiu / downgrade: remove tudo dos portais e desconecta. */
export async function unpublishAllForTenant(
  admin: SupabaseClient,
  tenantId: string,
  disconnect: boolean,
): Promise<void> {
  const listings = await listListings(admin, { tenantId });
  for (const l of listings) {
    if (!l.external_id || l.status === "removed") continue;
    await enqueue(admin, {
      portal: l.portal,
      kind: "unpublish",
      tenantId,
      vehicleId: l.vehicle_id,
      payload: { external_id: l.external_id, keep_desired: true },
    });
  }
  if (disconnect) {
    await admin
      .from("portal_connections")
      .update({ status: "disconnected", last_error: "Assinatura encerrada ou plano sem portais." })
      .eq("tenant_id", tenantId)
      .in("status", ["active", "needs_plan", "error", "pending"]);
  }
}
