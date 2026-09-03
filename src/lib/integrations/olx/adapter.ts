import { createAdminClient } from "../../supabase/admin";
import { PortalError } from "../errors";
import { normalizeName, resolveTaxonomy } from "../taxonomy";
import type {
  CanonicalVehicle,
  ConnectInput,
  ConnectResult,
  Connection,
  ListingRow,
  PortalAdapter,
  PortalPayload,
  TaxonomyRow,
  TaxonomySyncContext,
  TenantSyncResult,
} from "../types";
import { classifyOlxStatus, olxFetch, type OlxResponse } from "./client";
import { isOlxLead, leadFromOlx } from "./leads";
import {
  buildOlxAd,
  buildOlxDelete,
  chunkAds,
  olxAdId,
  OLX_MAX_PHOTOS,
  type OlxTaxonomyIds,
} from "./mapping";
import { basicUserInfo, exchangeCode } from "./oauth";

// ============================================================
// Adapter OLX — Autoupload em lote por loja (PUT /autoupload/import).
// publish/update/unpublish por item viram sync_tenant no worker.
// ============================================================

interface CatalogEntry {
  id?: string | number;
  value?: string | number;
  name?: string;
  label?: string;
  description?: string;
}

function entries(raw: unknown): { id: string; name: string }[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? ((raw as Record<string, unknown>).data ??
        (raw as Record<string, unknown>).values ??
        (raw as Record<string, unknown>).result ??
        [])
      : [];
  if (!Array.isArray(list)) return [];
  return list
    .map((e: CatalogEntry) => ({
      id: String(e.id ?? e.value ?? ""),
      name: String(e.name ?? e.label ?? e.description ?? ""),
    }))
    .filter((e) => e.id && e.name);
}

async function resolveIds(v: CanonicalVehicle): Promise<OlxTaxonomyIds> {
  const admin = createAdminClient();
  const { vehicle, tenant } = v;
  const brand = await resolveTaxonomy(admin, {
    portal: "olx",
    kind: "brand",
    localKey: normalizeName(vehicle.brand),
    name: vehicle.brand,
    tenantId: tenant.id,
  });
  if (!brand) {
    throw new PortalError(
      "mapping",
      "catálogo da OLX ainda não sincronizado (marca/modelo/versão) — rode a sincronização de catálogo",
    );
  }
  const model = await resolveTaxonomy(admin, {
    portal: "olx",
    kind: "model",
    localKey: `${brand.externalId}:${normalizeName(vehicle.model)}`,
    name: vehicle.model,
    parentExternalId: brand.externalId,
    tenantId: tenant.id,
  });
  if (!model) {
    throw new PortalError("mapping", `modelos da marca "${vehicle.brand}" não sincronizados no catálogo da OLX`);
  }
  let version: string | null = null;
  if (vehicle.version) {
    const hit = await resolveTaxonomy(admin, {
      portal: "olx",
      kind: "version",
      localKey: `${model.externalId}:${normalizeName(vehicle.version)}`,
      name: vehicle.version,
      parentExternalId: model.externalId,
      tenantId: tenant.id,
    });
    version = hit?.externalId ?? null;
  }
  return { brand: brand.externalId, model: model.externalId, version };
}

async function importBatch(conn: Connection, ads: PortalPayload[]): Promise<OlxResponse> {
  const res = await olxFetch<OlxResponse>(conn, "/autoupload/import", {
    method: "PUT",
    body: { ad_list: ads },
  });
  const err = classifyOlxStatus(res ?? {});
  if (err) throw err;
  return res;
}

export const olxAdapter: PortalAdapter = {
  id: "olx",
  label: "OLX",
  capabilities: {
    perItem: false,
    batch: true,
    leadsWebhook: true,
    oauth: true,
    feed: false,
    maxPhotos: OLX_MAX_PHOTOS,
  },
  prerequisite: "Plano Empresa (Essencial, Plus ou Premium Empresa) contratado com a OLX.",

  async connect(input: ConnectInput): Promise<ConnectResult> {
    if (!input.code || !input.redirectUri) {
      throw new PortalError("auth", "código de autorização ausente");
    }
    const tokens = await exchangeCode({ code: input.code, redirectUri: input.redirectUri });
    let account = "";
    try {
      const info = await basicUserInfo(tokens.access_token);
      account = String(info.user_email ?? info.user_id ?? "");
    } catch {
      // sem basic_user_info a conexão ainda funciona; a conta fica pelo tenant
    }
    return {
      externalAccountId: account || `tenant:${input.tenant.id}`,
      creds: { access_token: tokens.access_token },
      tokenExpiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
    };
  },

  async mapVehicle(v: CanonicalVehicle): Promise<PortalPayload> {
    const ids = await resolveIds(v);
    return buildOlxAd(v, ids);
  },

  async syncTenant(conn, desired, removed): Promise<TenantSyncResult> {
    const ads: PortalPayload[] = [];
    const sent: TenantSyncResult["sent"] = [];
    for (const { listing, payload } of desired) {
      ads.push(payload);
      sent.push({ vehicleId: listing.vehicle_id, externalId: olxAdId(listing.vehicle_id), op: "insert" });
    }
    for (const l of removed) {
      ads.push(buildOlxDelete(l.vehicle_id));
      sent.push({ vehicleId: l.vehicle_id, externalId: olxAdId(l.vehicle_id), op: "delete" });
    }
    if (ads.length === 0) return { sent: [] };
    for (const chunk of chunkAds(ads)) await importBatch(conn, chunk);
    return { sent };
  },

  async unpublish(conn, externalId): Promise<void> {
    await importBatch(conn, [{ id: externalId, operation: "delete" }]);
  },

  async syncTaxonomy(ctx: TaxonomySyncContext, full = false): Promise<void> {
    const conn = ctx.connection;
    if (!conn) throw new PortalError("auth", "sincronização do catálogo da OLX exige uma conta conectada");
    const brands = entries(await olxFetch(conn, "/autoupload/car_info", { body: {} }));
    const rows: TaxonomyRow[] = brands.map((b) => ({
      portal: "olx",
      kind: "brand",
      external_id: b.id,
      name: b.name,
    }));
    await ctx.upsert(rows);
    ctx.log(`olx: ${brands.length} marcas`);
    if (!full) return;
    for (const b of brands) {
      const models = entries(await olxFetch(conn, `/autoupload/car_info/${b.id}`, { body: {} }));
      const modelRows: TaxonomyRow[] = models.map((m) => ({
        portal: "olx",
        kind: "model",
        external_id: m.id,
        parent_id: b.id,
        name: m.name,
      }));
      await ctx.upsert(modelRows);
      for (const m of models) {
        const versions = entries(
          await olxFetch(conn, `/autoupload/car_info/${b.id}/${m.id}`, { body: {} }),
        );
        await ctx.upsert(
          versions.map((ver) => ({
            portal: "olx" as const,
            kind: "version",
            external_id: ver.id,
            parent_id: m.id,
            name: ver.name,
          })),
        );
      }
      ctx.log(`olx: ${b.name} — ${models.length} modelos`);
    }
  },

  async parseEvent(event) {
    if (!isOlxLead(event.body)) return null;
    return leadFromOlx(event.body);
  },

  async registerWebhook(conn, url): Promise<void> {
    // nome do campo da URL não está na doc pública: envia os dois
    await olxFetch(conn, "/autoservice/v1/lead", { body: { url, webhook_url: url } });
  },
};

export type { ListingRow };
