// ============================================================
// FIPE — leitura com cache no Supabase.
//
// Estrutura (brands/models) vem do seed. Years e preço são
// on-demand: lê do banco; se não tem (ou está velho), busca no
// parallelum e CACHEIA. Se a busca live falhar (rate limit/queda),
// serve o cache velho em vez de estourar erro — dado FIPE de
// semanas atrás ainda é melhor que nenhum no meio do cadastro.
//
// A escrita do cache usa o admin client — extensão da exceção
// documentada (dados GLOBAIS de referência, nunca dados de tenant;
// o caller é sempre rota autenticada).
// ============================================================

import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import {
  fetchFipePrice,
  fetchFipeYears,
  parseFipeValor,
} from "./client";
import type {
  FipeBrand,
  FipeModel,
  FipePrice,
  FipeVehicleType,
  FipeYear,
} from "./types";

/** A FIPE só muda na virada do mês e a importação em massa
 *  (seed --prices) + sync mensal renovam o banco; 40 dias cobre a
 *  folga entre importações sem rajadas de fetch live — e a linha
 *  carrega o MesReferencia, que a UI sempre exibe. */
const PRICE_TTL_MS = 40 * 24 * 60 * 60 * 1000;

/** Anos mudam pouco (novo ano-modelo/zero km na virada do mês);
 *  30 dias garante que a lista não fossiliza. */
const YEARS_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** rotas on-demand: retry curto — o usuário está esperando */
const ONDEMAND_RETRY = { retries: 2, baseDelayMs: 500, maxDelayMs: 4_000 };

function isFresh(fetchedAt: string | undefined, ttlMs: number): boolean {
  // linha sem fetched_at (cache antigo, pré-migration) conta como
  // fresca — a coluna tem default now() e converge sozinha
  if (!fetchedAt) return true;
  return Date.now() - new Date(fetchedAt).getTime() < ttlMs;
}

export interface FipeSearchHit {
  brand_id: string;
  brand_name: string;
  model_id: string;
  model_name: string;
}

/** Busca textual marca+modelo no catálogo local ("honda civic"). */
export async function searchFipe(
  type: FipeVehicleType,
  q: string,
): Promise<FipeSearchHit[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fipe_search", {
    p_type: type,
    p_q: term,
  });
  if (error) throw new Error(`fipe_search: ${error.message}`);
  return (data ?? []) as FipeSearchHit[];
}

export async function getFipeBrands(
  type: FipeVehicleType,
): Promise<FipeBrand[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fipe_brands")
    .select("*")
    .eq("vehicle_type", type)
    .order("name");
  if (error) throw new Error(`fipe_brands: ${error.message}`);
  return (data ?? []) as FipeBrand[];
}

export async function getFipeModels(
  type: FipeVehicleType,
  brandId: string,
): Promise<FipeModel[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fipe_models")
    .select("*")
    .eq("vehicle_type", type)
    .eq("brand_id", brandId)
    .order("name");
  if (error) throw new Error(`fipe_models: ${error.message}`);
  return (data ?? []) as FipeModel[];
}

export async function getFipeYears(
  type: FipeVehicleType,
  brandId: string,
  modelId: string,
): Promise<FipeYear[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fipe_years")
    .select("*")
    .eq("vehicle_type", type)
    .eq("brand_id", brandId)
    .eq("model_id", modelId)
    .order("id", { ascending: false });
  if (error) throw new Error(`fipe_years: ${error.message}`);
  const cached = (data ?? []) as FipeYear[];

  // fresco se a linha MAIS ANTIGA ainda está no TTL (todas são
  // gravadas juntas; a mais antiga é o pior caso)
  const fresh =
    cached.length > 0 &&
    cached.every((y) => isFresh(y.fetched_at, YEARS_TTL_MS));
  if (fresh) return cached;

  // ausente ou velho → busca live e cacheia
  let live;
  try {
    live = await fetchFipeYears(type, brandId, modelId, ONDEMAND_RETRY);
  } catch (err) {
    if (cached.length > 0) return cached; // stale > nada
    throw err;
  }
  if (live.length === 0) return cached;

  const now = new Date().toISOString();
  const rows: FipeYear[] = live.map((y) => ({
    vehicle_type: type,
    brand_id: brandId,
    model_id: modelId,
    id: y.codigo,
    name: y.nome,
    fetched_at: now,
  }));
  const admin = createAdminClient();
  const { error: writeError } = await admin
    .from("fipe_years")
    .upsert(rows, { onConflict: "vehicle_type,brand_id,model_id,id" });
  if (writeError) {
    // resposta segue válida; loga p/ aparecer no wrangler tail — um
    // cache que nunca grava era invisível e parecia "não importou"
    console.error(`fipe_years cache write: ${writeError.message}`);
  }
  return rows.sort((a, b) => b.id.localeCompare(a.id));
}

export async function getFipePrice(
  type: FipeVehicleType,
  brandId: string,
  modelId: string,
  yearId: string,
): Promise<FipePrice> {
  const supabase = await createClient();
  const { data: cached } = await supabase
    .from("fipe_prices")
    .select("*")
    .eq("vehicle_type", type)
    .eq("brand_id", brandId)
    .eq("model_id", modelId)
    .eq("year_id", yearId)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cached && isFresh(cached.fetched_at as string, PRICE_TTL_MS)) {
    return cached as FipePrice;
  }

  // ausente ou velho → busca live e cacheia
  let live;
  try {
    live = await fetchFipePrice(type, brandId, modelId, yearId, ONDEMAND_RETRY);
  } catch (err) {
    if (cached) return cached as FipePrice; // stale > nada
    throw err;
  }
  const row: FipePrice = {
    vehicle_type: type,
    brand_id: brandId,
    model_id: modelId,
    year_id: yearId,
    fipe_code: live.CodigoFipe,
    price: parseFipeValor(live.Valor),
    brand_name: live.Marca,
    model_name: live.Modelo,
    year_model: live.AnoModelo,
    fuel: live.Combustivel,
    reference: live.MesReferencia,
    // sem isso, o upsert num mês repetido manteria o fetched_at
    // antigo e o TTL nunca renovaria → live fetch a cada consulta
    fetched_at: new Date().toISOString(),
  };
  const admin = createAdminClient();
  const { error: writeError } = await admin
    .from("fipe_prices")
    .upsert(row, { onConflict: "vehicle_type,brand_id,model_id,year_id,reference" });
  if (writeError) {
    console.error(`fipe_prices cache write: ${writeError.message}`);
  }
  return row;
}
