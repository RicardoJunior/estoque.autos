import type { SupabaseClient } from "@supabase/supabase-js";
import { PortalError } from "./errors";
import type { PortalId, TaxonomyRow } from "./types";

// ============================================================
// Taxonomia dos portais (marca/modelo/versão com ids próprios).
// Estratégia em camadas (docs §5.7): chave local → cache de
// mapeamento → match exato normalizado → trigram (≥ 0,8 grava
// automático; entre 0,6 e 0,8 vira pendência) → pendência manual.
// ============================================================

export const AUTO_CONFIDENCE = 0.8;

/** "Chevrolet Onix 1.0 Turbo" → "chevrolet onix 1 0 turbo" */
export function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export interface TaxonomyMatch {
  externalId: string;
  name: string;
  confidence: number;
  source: "map" | "exact" | "fuzzy";
}

export interface ResolveInput {
  portal: PortalId;
  kind: string;
  /** chave local estável (id FIPE) ou nome normalizado */
  localKey: string;
  /** nome humano para o match por texto */
  name: string;
  parentExternalId?: string | null;
  tenantId?: string | null;
}

async function lookupMap(
  admin: SupabaseClient,
  input: ResolveInput,
): Promise<{ external_id: string; confidence: number } | null> {
  // override da loja tem precedência sobre o global
  const { data } = await admin
    .from("portal_taxonomy_map")
    .select("external_id, confidence, tenant_id")
    .eq("portal", input.portal)
    .eq("kind", input.kind)
    .eq("local_key", input.localKey);
  const rows = (data ?? []) as { external_id: string; confidence: number; tenant_id: string | null }[];
  const own = input.tenantId ? rows.find((r) => r.tenant_id === input.tenantId) : null;
  const global = rows.find((r) => r.tenant_id === null);
  const hit = own ?? global;
  return hit ? { external_id: hit.external_id, confidence: Number(hit.confidence) } : null;
}

async function nameOf(
  admin: SupabaseClient,
  portal: PortalId,
  kind: string,
  externalId: string,
): Promise<string> {
  const { data } = await admin
    .from("portal_taxonomy")
    .select("name")
    .eq("portal", portal)
    .eq("kind", kind)
    .eq("external_id", externalId)
    .maybeSingle();
  return data?.name ?? externalId;
}

export async function searchTaxonomy(
  client: SupabaseClient,
  portal: PortalId,
  kind: string,
  query: string,
  parentExternalId?: string | null,
  limit = 10,
): Promise<{ external_id: string; parent_id: string | null; name: string; score: number }[]> {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await client.rpc("portal_taxonomy_search", {
    p_portal: portal,
    p_kind: kind,
    p_query: q,
    p_parent: parentExternalId ?? null,
    p_limit: limit,
  });
  if (error) return [];
  return (data ?? []) as { external_id: string; parent_id: string | null; name: string; score: number }[];
}

/**
 * Resolve um valor local para o id do portal. `null` quando não há
 * catálogo carregado para esse (portal, kind) — o adapter decide se
 * envia o nome cru ou falha.
 */
export async function resolveTaxonomy(
  admin: SupabaseClient,
  input: ResolveInput,
): Promise<TaxonomyMatch | null> {
  const mapped = await lookupMap(admin, input);
  if (mapped) {
    return {
      externalId: mapped.external_id,
      name: await nameOf(admin, input.portal, input.kind, mapped.external_id),
      confidence: mapped.confidence,
      source: "map",
    };
  }

  // catálogo existe para esse tipo?
  const { count } = await admin
    .from("portal_taxonomy")
    .select("external_id", { count: "exact", head: true })
    .eq("portal", input.portal)
    .eq("kind", input.kind);
  if (!count) return null;

  const wanted = normalizeName(input.name);
  const candidates = await searchTaxonomy(
    admin,
    input.portal,
    input.kind,
    input.name,
    input.parentExternalId,
    15,
  );
  const exact = candidates.find((c) => normalizeName(c.name) === wanted);
  if (exact) {
    await saveMapping(admin, { ...input, externalId: exact.external_id, confidence: 1, source: "auto" });
    return { externalId: exact.external_id, name: exact.name, confidence: 1, source: "exact" };
  }
  const best = candidates[0];
  if (best && best.score >= AUTO_CONFIDENCE) {
    await saveMapping(admin, {
      ...input,
      externalId: best.external_id,
      confidence: Math.round(best.score * 100) / 100,
      source: "auto",
    });
    return { externalId: best.external_id, name: best.name, confidence: best.score, source: "fuzzy" };
  }
  throw new PortalError(
    "mapping",
    `${kindLabel(input.kind)} "${input.name}" não encontrado no catálogo do portal`,
    {
      kind: input.kind,
      name: input.name,
      localKey: input.localKey,
      parent: input.parentExternalId ?? null,
      candidates: candidates.slice(0, 5).map((c) => ({ external_id: c.external_id, name: c.name, score: c.score })),
    },
  );
}

export function kindLabel(kind: string): string {
  return (
    { brand: "marca", model: "modelo", version: "versão", color: "cor", body: "carroceria" }[kind] ??
    kind
  );
}

export async function saveMapping(
  admin: SupabaseClient,
  input: {
    portal: PortalId;
    kind: string;
    localKey: string;
    externalId: string;
    confidence: number;
    source: "auto" | "manual";
    tenantId?: string | null;
  },
): Promise<void> {
  // unique index é em expressão (coalesce) — PostgREST não infere;
  // apaga o anterior e insere
  let del = admin
    .from("portal_taxonomy_map")
    .delete()
    .eq("portal", input.portal)
    .eq("kind", input.kind)
    .eq("local_key", input.localKey);
  del = input.tenantId ? del.eq("tenant_id", input.tenantId) : del.is("tenant_id", null);
  await del;
  await admin.from("portal_taxonomy_map").insert({
    portal: input.portal,
    kind: input.kind,
    local_key: input.localKey,
    external_id: input.externalId,
    confidence: input.confidence,
    source: input.source,
    tenant_id: input.tenantId ?? null,
  });
}

/** Upsert em lote no catálogo (sync semanal ou sob demanda). */
export async function upsertTaxonomy(
  admin: SupabaseClient,
  rows: TaxonomyRow[],
): Promise<void> {
  const now = new Date().toISOString();
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500).map((r) => ({
      portal: r.portal,
      kind: r.kind,
      external_id: r.external_id,
      parent_id: r.parent_id ?? null,
      name: r.name,
      meta: r.meta ?? null,
      synced_at: now,
    }));
    const { error } = await admin
      .from("portal_taxonomy")
      .upsert(chunk, { onConflict: "portal,kind,external_id" });
    if (error) throw new Error(`portal_taxonomy upsert: ${error.message}`);
  }
}

/** Idade do catálogo (para decidir ressincronizar). `null` = vazio. */
export async function taxonomyAge(
  admin: SupabaseClient,
  portal: PortalId,
  kind: string,
): Promise<number | null> {
  const { data } = await admin
    .from("portal_taxonomy")
    .select("synced_at")
    .eq("portal", portal)
    .eq("kind", kind)
    .order("synced_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return Date.now() - Date.parse(data.synced_at);
}
