import { createAdminClient } from "../../supabase/admin";
import { PortalError } from "../errors";
import { normalizeName, resolveTaxonomy } from "../taxonomy";
import type {
  CanonicalVehicle,
  ConnectInput,
  ConnectResult,
  Connection,
  PortalAdapter,
  PortalPayload,
  PublishResult,
  TaxonomySyncContext,
} from "../types";
import { mlFetch } from "./client";
import { fetchLeadFromEvent, fetchRecentLeads, notificationKey, parseNotification } from "./leads";
import { buildMlDescription, buildMlItem, ML_CATEGORY, ML_MAX_PHOTOS } from "./mapping";
import { exchangeCode, expiresAt, refreshTokens } from "./oauth";

// ============================================================
// Adapter Mercado Livre — anúncio classificado de veículo.
// ============================================================

interface MlItem {
  id: string;
  permalink?: string;
  status?: string;
  sub_status?: string[];
  stop_time?: string;
  date_created?: string;
}

interface MlCategoryAttribute {
  id: string;
  name: string;
  values?: { id: string; name: string }[];
  tags?: Record<string, boolean>;
}

const CATALOG_KIND_BRAND = "brand";
const CATALOG_KIND_ATTRIBUTE = "attribute";

async function mappingContext(v: CanonicalVehicle) {
  const admin = createAdminClient();
  const { vehicle, tenant } = v;
  // BRAND: catálogo (value_id) quando carregado; senão value_name
  let brandValueId: string | null = null;
  try {
    const hit = await resolveTaxonomy(admin, {
      portal: "mercadolivre",
      kind: CATALOG_KIND_BRAND,
      localKey: normalizeName(vehicle.brand),
      name: vehicle.brand,
      tenantId: tenant.id,
    });
    brandValueId = hit?.externalId ?? null;
  } catch (err) {
    if (err instanceof PortalError && err.kind === "mapping") throw err;
    // catálogo indisponível: segue por nome
  }
  const { data } = await admin
    .from("portal_taxonomy")
    .select("external_id")
    .eq("portal", "mercadolivre")
    .eq("kind", CATALOG_KIND_ATTRIBUTE);
  const knownAttributes = new Set(((data ?? []) as { external_id: string }[]).map((r) => r.external_id));
  return { brandValueId, knownAttributes };
}

async function putDescription(conn: Connection, itemId: string, text: string): Promise<void> {
  try {
    await mlFetch(conn, `/items/${itemId}/description`, {
      method: "PUT",
      body: { plain_text: text },
    });
  } catch (err) {
    // item recém-criado ainda sem descrição: POST cria
    if (err instanceof PortalError && (err.kind === "not_found" || err.kind === "validation")) {
      await mlFetch(conn, `/items/${itemId}/description`, {
        method: "POST",
        body: { plain_text: text },
      });
      return;
    }
    throw err;
  }
}

function resultFromItem(item: MlItem): PublishResult {
  return {
    externalId: item.id,
    url: item.permalink,
    expiresAt: item.stop_time ? new Date(item.stop_time) : undefined,
  };
}

export const mercadoLivreAdapter: PortalAdapter = {
  id: "mercadolivre",
  label: "Mercado Livre",
  capabilities: {
    perItem: true,
    batch: false,
    leadsWebhook: true,
    oauth: true,
    feed: false,
    maxPhotos: ML_MAX_PHOTOS,
  },
  prerequisite:
    "Pacote de publicação de veículos contratado com o time comercial do Mercado Livre.",

  async connect(input: ConnectInput): Promise<ConnectResult> {
    if (!input.code || !input.redirectUri) {
      throw new PortalError("auth", "código de autorização ausente");
    }
    const tokens = await exchangeCode({
      code: input.code,
      redirectUri: input.redirectUri,
      codeVerifier: input.codeVerifier,
    });
    return {
      externalAccountId: String(tokens.user_id),
      creds: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt(tokens).toISOString(),
      },
      tokenExpiresAt: expiresAt(tokens),
    };
  },

  async refreshCredentials(conn: Connection): Promise<ConnectResult> {
    if (!conn.creds.refresh_token) {
      throw new PortalError("auth", "conexão sem refresh_token — reconecte");
    }
    const tokens = await refreshTokens(conn.creds.refresh_token);
    return {
      externalAccountId: String(tokens.user_id ?? conn.external_account_id),
      creds: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt(tokens).toISOString(),
      },
      tokenExpiresAt: expiresAt(tokens),
    };
  },

  async mapVehicle(v: CanonicalVehicle, conn: Connection): Promise<PortalPayload> {
    const ctx = await mappingContext(v);
    const item = buildMlItem(v, conn, ctx);
    return { item, description: buildMlDescription(v) };
  },

  async publish(conn, payload): Promise<PublishResult> {
    const item = await mlFetch<MlItem>(conn, "/items", {
      method: "POST",
      body: payload.item,
    });
    if (!item?.id) throw new PortalError("transient", "resposta sem id do anúncio", item);
    await putDescription(conn, item.id, String(payload.description ?? ""));
    return resultFromItem(item);
  },

  async update(conn, externalId, payload): Promise<PublishResult> {
    const full = payload.item as Record<string, unknown>;
    // campos imutáveis depois de criado (categoria, tipo de anúncio,
    // buying_mode) ficam fora do PUT
    const body: Record<string, unknown> = {
      title: full.title,
      price: full.price,
      pictures: full.pictures,
      attributes: full.attributes,
      seller_contact: full.seller_contact,
      location: full.location,
    };
    if (full.video_id) body.video_id = full.video_id;

    let item: MlItem;
    try {
      item = await mlFetch<MlItem>(conn, `/items/${externalId}`, { method: "PUT", body });
    } catch (err) {
      // anúncio fechado/expirado não aceita edição — reabre publicando de novo
      if (err instanceof PortalError && err.kind === "validation" && /closed|status/i.test(err.message)) {
        const current = await mlFetch<MlItem>(conn, `/items/${externalId}`);
        if (current?.status === "closed") {
          throw new PortalError("not_found", `anúncio ${externalId} está fechado`);
        }
      }
      throw err;
    }
    await putDescription(conn, externalId, String(payload.description ?? ""));
    return resultFromItem({ ...item, id: externalId });
  },

  async unpublish(conn, externalId): Promise<void> {
    try {
      await mlFetch(conn, `/items/${externalId}`, { method: "PUT", body: { status: "closed" } });
    } catch (err) {
      if (err instanceof PortalError && err.kind === "not_found") return;
      // já fechado: o ML devolve validation ("item already closed")
      if (err instanceof PortalError && err.kind === "validation" && /closed/i.test(err.message)) return;
      throw err;
    }
  },

  async renew(conn, externalId, payload, v): Promise<PublishResult | null> {
    const item = await mlFetch<MlItem>(conn, `/items/${externalId}`, {
      query: { attributes: "id,status,sub_status,stop_time,permalink" },
    });
    if (item?.status === "active") return resultFromItem(item);
    // venceu (closed/expired): publica de novo
    return mercadoLivreAdapter.publish!(conn, payload, v);
  },

  async syncTaxonomy(ctx: TaxonomySyncContext): Promise<void> {
    // uma requisição por categoria: atributos aceitos + valores de BRAND
    for (const category of new Set(Object.values(ML_CATEGORY))) {
      const attrs = await mlFetch<MlCategoryAttribute[]>(null, `/categories/${category}/attributes`, {
        anonymous: true,
      });
      const rows = [];
      for (const a of attrs ?? []) {
        rows.push({
          portal: "mercadolivre" as const,
          kind: CATALOG_KIND_ATTRIBUTE,
          external_id: a.id,
          parent_id: category,
          name: a.name,
          meta: a.tags ?? null,
        });
        if (a.id === "BRAND") {
          for (const v of a.values ?? []) {
            rows.push({
              portal: "mercadolivre" as const,
              kind: CATALOG_KIND_BRAND,
              external_id: v.id,
              parent_id: category,
              name: v.name,
            });
          }
        }
      }
      await ctx.upsert(rows);
      ctx.log(`mercadolivre ${category}: ${rows.length} linhas`);
    }
  },

  resolveEventAccount(event) {
    const n = parseNotification(event.body);
    return n?.user_id != null ? String(n.user_id) : null;
  },

  async parseEvent(event, conn) {
    const n = parseNotification(event.body);
    if (!n || !conn) return null;
    const topic = n.topic ?? "";
    if (topic !== "vis_leads" && topic !== "questions" && !n.resource?.startsWith("/vis/leads/")) {
      return null;
    }
    const lead = await fetchLeadFromEvent(event, conn);
    if (!lead) return null;
    // chave de idempotência = tópico + resource (a mesma da rota do webhook)
    return { ...lead, externalId: lead.externalId || notificationKey(n) };
  },

  fetchLeads(conn, since) {
    return fetchRecentLeads(conn, since);
  },
};
