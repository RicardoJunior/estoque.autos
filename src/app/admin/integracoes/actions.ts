"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { portalsAllowed, PORTALS_PLAN_MESSAGE } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fieldErrorsFromZod, portalSettingsSchema } from "@/lib/validation";
import { randomToken } from "@/lib/integrations/crypto";
import {
  loadConnection,
  updateConnectionSettings,
  upsertConnection,
} from "@/lib/integrations/connections";
import { kickWorker } from "@/lib/integrations/kick";
import { listListings, seedListingsForConnection, updateListing } from "@/lib/integrations/listings";
import { enqueue } from "@/lib/integrations/queue";
import { isPortalId, PORTAL_META } from "@/lib/integrations/registry";
import { saveMapping, searchTaxonomy } from "@/lib/integrations/taxonomy";
import type { PortalId } from "@/lib/types";

// ============================================================
// Actions de Integrações. Todas passam por requireStaff() e usam o
// admin client SÓ para portal_connections/jobs (RLS deny-all), sempre
// escopadas pela loja ativa.
// ============================================================

export interface PortalActionState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

async function guard(portal: string) {
  const { tenant } = await requireStaff();
  if (!isPortalId(portal)) return { tenant, portal: null, error: "Portal inválido." };
  if (tenant.slug === "demo") return { tenant, portal: null, error: "A loja demo não conecta portais." };
  if (!portalsAllowed(tenant.plan)) return { tenant, portal: null, error: PORTALS_PLAN_MESSAGE };
  return { tenant, portal: portal as PortalId, error: null };
}

/** Feeds (Meta, Usadosbr): "conectar" é gerar a URL com token. */
export async function connectFeedAction(portalId: string): Promise<PortalActionState> {
  const { tenant, portal, error } = await guard(portalId);
  if (error || !portal) return { error: error ?? "Portal inválido." };
  if (PORTAL_META[portal].mode !== "feed") return { error: "Este portal conecta por autorização." };
  try {
    const admin = createAdminClient();
    const existing = await loadConnection(admin, tenant.id, portal);
    await upsertConnection(admin, {
      tenantId: tenant.id,
      portal,
      creds: {},
      externalAccountId: null,
      status: "active",
      settings: {
        ...(existing?.settings ?? {}),
        feed_token: existing?.settings.feed_token ?? randomToken(24),
      },
    });
  } catch (err) {
    console.error("connectFeedAction:", err);
    return { error: "Não foi possível gerar o feed." };
  }
  revalidatePath(`/admin/integracoes/${portal}`);
  revalidatePath("/admin/integracoes");
  return { ok: true };
}

/** Desconecta: remove os anúncios do portal e apaga as credenciais. */
export async function disconnectPortalAction(portalId: string): Promise<PortalActionState> {
  const { tenant, portal, error } = await guard(portalId);
  if (error || !portal) return { error: error ?? "Portal inválido." };
  try {
    const admin = createAdminClient();
    const listings = await listListings(admin, { tenantId: tenant.id, portal });
    for (const l of listings) {
      if (l.external_id && l.status !== "removed") {
        await enqueue(admin, {
          portal,
          kind: "unpublish",
          tenantId: tenant.id,
          vehicleId: l.vehicle_id,
          payload: { external_id: l.external_id },
        });
      } else {
        await updateListing(admin, l.id, { desired: false, status: "removed" });
      }
    }
    // credenciais só somem DEPOIS que o worker remover os anúncios:
    // status 'disconnected' bloqueia novas publicações desde já
    await admin
      .from("portal_connections")
      .update({ status: "disconnected", last_error: null })
      .eq("tenant_id", tenant.id)
      .eq("portal", portal);
    if (listings.every((l) => !l.external_id || l.status === "removed")) {
      await admin
        .from("portal_connections")
        .update({ credentials: null, credentials_iv: null, token_expires_at: null })
        .eq("tenant_id", tenant.id)
        .eq("portal", portal);
    }
    kickWorker(tenant.id);
  } catch (err) {
    console.error("disconnectPortalAction:", err);
    return { error: "Não foi possível desconectar." };
  }
  revalidatePath(`/admin/integracoes/${portal}`);
  revalidatePath("/admin/integracoes");
  return { ok: true };
}

/** "Já contratei o plano" / "tentar de novo": reativa e sincroniza tudo. */
export async function syncAllAction(portalId: string): Promise<PortalActionState> {
  const { tenant, portal, error } = await guard(portalId);
  if (error || !portal) return { error: error ?? "Portal inválido." };
  try {
    const admin = createAdminClient();
    const conn = await loadConnection(admin, tenant.id, portal);
    if (!conn || conn.status === "disconnected") return { error: "Conecte o portal primeiro." };
    if (conn.status === "needs_plan" || conn.status === "error") {
      await admin
        .from("portal_connections")
        .update({ status: "active", last_error: null })
        .eq("id", conn.id);
    }
    await admin
      .from("portal_listings")
      .update({ status: "queued", last_error: null, error_details: null })
      .eq("tenant_id", tenant.id)
      .eq("portal", portal)
      .eq("desired", true)
      .in("status", ["error", "rejected"]);
    await seedListingsForConnection(admin, { ...conn, status: "active" });
    kickWorker(tenant.id);
  } catch (err) {
    console.error("syncAllAction:", err);
    return { error: "Não foi possível sincronizar." };
  }
  revalidatePath(`/admin/integracoes/${portal}`);
  return { ok: true };
}

export async function savePortalSettingsAction(
  portalId: string,
  _prev: PortalActionState,
  formData: FormData,
): Promise<PortalActionState> {
  const { tenant, portal, error } = await guard(portalId);
  if (error || !portal) return { error: error ?? "Portal inválido." };
  const parsed = portalSettingsSchema.safeParse({
    auto_publish: formData.get("auto_publish") === "on",
    unpublish_on_reserved: formData.get("unpublish_on_reserved") === "on",
    listing_type: formData.get("listing_type") || undefined,
    phone_override: String(formData.get("phone_override") ?? ""),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  try {
    const admin = createAdminClient();
    const conn = await loadConnection(admin, tenant.id, portal);
    if (!conn) return { error: "Conecte o portal primeiro." };
    await updateConnectionSettings(
      admin,
      conn.id,
      {
        auto_publish: parsed.data.auto_publish,
        unpublish_on_reserved: parsed.data.unpublish_on_reserved,
        listing_type: parsed.data.listing_type,
        phone_override: parsed.data.phone_override || undefined,
      },
      conn.settings,
    );
    // telefone/tipo de anúncio mudam o payload: reenvia o que está no ar
    await enqueue(admin, { portal, kind: "sync_tenant", tenantId: tenant.id });
    kickWorker(tenant.id);
  } catch (err) {
    console.error("savePortalSettingsAction:", err);
    return { error: "Não foi possível salvar." };
  }
  revalidatePath(`/admin/integracoes/${portal}`);
  return { ok: true };
}

export interface TaxonomyOption {
  external_id: string;
  name: string;
  score: number;
}

/** Busca no catálogo do portal (RPC pública para logados). */
export async function searchTaxonomyAction(
  portalId: string,
  kind: string,
  query: string,
  parent: string | null,
): Promise<TaxonomyOption[]> {
  const { portal, error } = await guard(portalId);
  if (error || !portal) return [];
  const supabase = await createClient();
  const rows = await searchTaxonomy(supabase, portal, kind, query.slice(0, 80), parent, 10);
  return rows.map((r) => ({ external_id: r.external_id, name: r.name, score: r.score }));
}

/** Grava a escolha manual (override da loja) e reenfileira o anúncio. */
export async function resolveMappingAction(input: {
  portal: string;
  kind: string;
  localKey: string;
  externalId: string;
  vehicleId: string;
}): Promise<PortalActionState> {
  const { tenant, portal, error } = await guard(input.portal);
  if (error || !portal) return { error: error ?? "Portal inválido." };
  if (!input.externalId || !input.localKey || !input.kind) return { error: "Escolha um valor." };
  try {
    const admin = createAdminClient();
    await saveMapping(admin, {
      portal,
      kind: input.kind,
      localKey: input.localKey,
      externalId: input.externalId,
      confidence: 1,
      source: "manual",
      tenantId: tenant.id,
    });
    await admin
      .from("portal_listings")
      .update({ status: "queued", last_error: null, error_details: null })
      .eq("tenant_id", tenant.id)
      .eq("portal", portal)
      .eq("vehicle_id", input.vehicleId);
    await enqueue(admin, { portal, kind: "publish", tenantId: tenant.id, vehicleId: input.vehicleId });
    kickWorker(tenant.id);
  } catch (err) {
    console.error("resolveMappingAction:", err);
    return { error: "Não foi possível salvar o mapeamento." };
  }
  revalidatePath(`/admin/integracoes/${portal}`);
  return { ok: true };
}

/** Sincroniza o catálogo do portal (marcas/atributos) sob demanda. */
export async function syncTaxonomyAction(portalId: string): Promise<PortalActionState> {
  const { tenant, portal, error } = await guard(portalId);
  if (error || !portal) return { error: error ?? "Portal inválido." };
  try {
    await enqueue(createAdminClient(), { portal, kind: "sync_taxonomy", tenantId: tenant.id });
    kickWorker(tenant.id);
  } catch {
    return { error: "Não foi possível agendar a sincronização." };
  }
  return { ok: true };
}
