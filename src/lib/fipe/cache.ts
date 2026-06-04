// ============================================================
// FIPE — leitura com cache no Supabase.
//
// Estrutura (brands/models) vem do seed. Years e preço são
// on-demand: lê do banco; se não tem (ou preço velho), busca no
// parallelum e CACHEIA. A escrita do cache usa o admin client —
// extensão da exceção documentada (dados GLOBAIS de referência,
// nunca dados de tenant; o caller é sempre rota autenticada).
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

/** Preço vale por 7 dias — o cron mensal renova os códigos em uso;
 *  isso cobre o intervalo entre viradas de MesReferencia. */
const PRICE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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
  if (data && data.length > 0) return data as FipeYear[];

  // cache miss → busca live e cacheia
  const live = await fetchFipeYears(type, brandId, modelId);
  if (live.length === 0) return [];

  const rows: FipeYear[] = live.map((y) => ({
    vehicle_type: type,
    brand_id: brandId,
    model_id: modelId,
    id: y.codigo,
    name: y.nome,
  }));
  const admin = createAdminClient();
  await admin
    .from("fipe_years")
    .upsert(rows, { onConflict: "vehicle_type,brand_id,model_id,id" });
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

  if (
    cached &&
    Date.now() - new Date(cached.fetched_at as string).getTime() < PRICE_TTL_MS
  ) {
    return cached as FipePrice;
  }

  // ausente ou velho → busca live e cacheia
  const live = await fetchFipePrice(type, brandId, modelId, yearId);
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
  };
  const admin = createAdminClient();
  await admin
    .from("fipe_prices")
    .upsert(row, { onConflict: "vehicle_type,brand_id,model_id,year_id,reference" });
  return row;
}
