// ============================================================
// FIPE — client da API parallelum (proxy público da tabela FIPE).
// Portado de legacy/crawler (axios → fetch: roda no Worker e em
// scripts Node). Throttling fica em quem chama (seed usa pLimit+
// randomDelay; rotas on-demand fazem 1 request por interação).
// ============================================================

import type { FipeVehicleType } from "./types";

const BASE_URL = "https://parallelum.com.br/fipe/api/v1";
const TIMEOUT_MS = 15_000;

interface ParallelumRef {
  codigo: string;
  nome: string;
}

export interface ParallelumPrice {
  Valor: string; // "R$ 30.000,00"
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  Combustivel: string;
  CodigoFipe: string;
  MesReferencia: string;
  SiglaCombustivel: string;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}/${path}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`parallelum HTTP ${res.status} em ${path}`);
  }
  return (await res.json()) as T;
}

export function fetchFipeBrands(type: FipeVehicleType) {
  return get<ParallelumRef[]>(`${type}/marcas`);
}

export async function fetchFipeModels(type: FipeVehicleType, brandId: string) {
  // o endpoint devolve { modelos: [...], anos: [...] } — só modelos importa
  const data = await get<{ modelos: ParallelumRef[] }>(
    `${type}/marcas/${brandId}/modelos`,
  );
  return data.modelos;
}

export function fetchFipeYears(
  type: FipeVehicleType,
  brandId: string,
  modelId: string,
) {
  return get<ParallelumRef[]>(
    `${type}/marcas/${brandId}/modelos/${modelId}/anos`,
  );
}

export function fetchFipePrice(
  type: FipeVehicleType,
  brandId: string,
  modelId: string,
  yearCode: string,
) {
  return get<ParallelumPrice>(
    `${type}/marcas/${brandId}/modelos/${modelId}/anos/${yearCode}`,
  );
}

/** "R$ 30.000,00" → 30000.00 */
export function parseFipeValor(valor: string): number {
  const cleaned = valor.replace(/[^\d,]/g, "").replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) throw new Error(`Valor FIPE inválido: ${valor}`);
  return n;
}

/** Delay aleatório entre requests (educação com o rate limit). */
export function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
