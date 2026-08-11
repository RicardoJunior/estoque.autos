// ============================================================
// FIPE — client da API parallelum v2 (fipe.parallelum.com.br).
// Roda no Worker e em scripts Node (fetch nativo).
//
// v2 porque a v1 anônima (parallelum.com.br/fipe/api/v1) tem cota
// por IP minúscula e compartilhada — no Worker, o egress da
// Cloudflare divide IP com outros apps e vive em 429. A v2 aceita
// token (header X-Subscription-Token, grátis em https://fipe.api.br,
// 1.000 req/dia; sem token, 500/dia por IP): defina FIPE_API_TOKEN
// no ambiente (secret no Worker, .env.local nos scripts).
//
// Respostas são normalizadas para os shapes internos em pt
// (codigo/nome, Valor/Marca/…) — o resto do app não muda.
//
// Todo request passa por retry com backoff exponencial + jitter,
// honrando Retry-After. Erros 4xx (exceto 429) não são re-tentados.
// Ritmo em lote fica em quem chama (import usa fila + delay; a API
// recomenda ≤50-60 req/min).
// ============================================================

import type { FipeVehicleType } from "./types";

const BASE_URL = "https://fipe.parallelum.com.br/api/v2";
const TIMEOUT_MS = 15_000;

/** carros/motos/caminhoes (nosso domínio) → recurso da v2 */
const V2_TYPE: Record<FipeVehicleType, string> = {
  carros: "cars",
  motos: "motorcycles",
  caminhoes: "trucks",
};

export interface RetryOptions {
  /** tentativas ALÉM da primeira (default 4 → até 5 requests) */
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

const DEFAULT_RETRY: Required<RetryOptions> = {
  retries: 4,
  baseDelayMs: 1_000,
  maxDelayMs: 30_000,
};

interface V2Ref {
  code: string;
  name: string;
}

interface V2Price {
  price: string; // "R$ 30.000,00"
  brand: string;
  model: string;
  modelYear: number;
  fuel: string;
  codeFipe: string;
  referenceMonth: string;
  fuelAcronym: string;
}

/** shape interno (herdado da v1) — cache e sync consomem este */
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

export class FipeHttpError extends Error {
  constructor(
    public readonly status: number,
    path: string,
  ) {
    super(`FIPE API HTTP ${status} em ${path}`);
    this.name = "FipeHttpError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** backoff exponencial com jitter (±50%), limitado a maxDelayMs */
function backoffDelay(attempt: number, opts: Required<RetryOptions>): number {
  const exp = Math.min(opts.maxDelayMs, opts.baseDelayMs * 2 ** attempt);
  return exp * (0.5 + Math.random());
}

/** Retry-After em segundos (quando o 429 informa) → ms, ou null */
function retryAfterMs(res: Response): number | null {
  const raw = res.headers.get("retry-after");
  if (!raw) return null;
  const secs = Number(raw);
  return Number.isFinite(secs) && secs >= 0 ? secs * 1000 : null;
}

/** lido a cada request: scripts carregam .env.local depois do import */
function authHeaders(): Record<string, string> {
  const token =
    typeof process !== "undefined" ? process.env.FIPE_API_TOKEN : undefined;
  return token
    ? { accept: "application/json", "X-Subscription-Token": token }
    : { accept: "application/json" };
}

/** Motor de retry compartilhado (usado também pelo provider oficial
 *  em official.ts): re-tenta 429/5xx/timeout/rede com backoff. */
export async function fipeRequest<T>(
  url: string,
  init: RequestInit,
  retry: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULT_RETRY, ...retry };
  let lastError: Error = new Error(`FIPE: sem tentativa em ${url}`);

  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    let hinted: number | null = null;
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        ...init,
      });
      if (res.ok) return (await res.json()) as T;

      const err = new FipeHttpError(res.status, url);
      // 429/5xx são transitórios; outros 4xx não melhoram re-tentando
      if (res.status !== 429 && res.status < 500) throw err;
      if (res.status === 429) hinted = retryAfterMs(res);
      lastError = err;
    } catch (err) {
      if (err instanceof FipeHttpError) throw err;
      // timeout (TimeoutError/AbortError), falha de rede (TypeError)
      // ou body inválido (SyntaxError) — todos transitórios
      lastError = err as Error;
    }
    if (attempt < opts.retries) {
      await sleep(hinted ?? backoffDelay(attempt, opts));
    }
  }
  throw lastError;
}

export function fipeGet<T>(path: string, retry: RetryOptions = {}): Promise<T> {
  return fipeRequest<T>(
    `${BASE_URL}/${path}`,
    { headers: authHeaders() },
    retry,
  );
}

function toRef(items: V2Ref[]): Array<{ codigo: string; nome: string }> {
  return (items ?? []).map((i) => ({ codigo: String(i.code), nome: i.name }));
}

export async function fetchFipeBrands(
  type: FipeVehicleType,
  retry?: RetryOptions,
) {
  return toRef(await fipeGet<V2Ref[]>(`${V2_TYPE[type]}/brands`, retry));
}

export async function fetchFipeModels(
  type: FipeVehicleType,
  brandId: string,
  retry?: RetryOptions,
) {
  return toRef(
    await fipeGet<V2Ref[]>(`${V2_TYPE[type]}/brands/${brandId}/models`, retry),
  );
}

export async function fetchFipeYears(
  type: FipeVehicleType,
  brandId: string,
  modelId: string,
  retry?: RetryOptions,
) {
  return toRef(
    await fipeGet<V2Ref[]>(
      `${V2_TYPE[type]}/brands/${brandId}/models/${modelId}/years`,
      retry,
    ),
  );
}

export async function fetchFipePrice(
  type: FipeVehicleType,
  brandId: string,
  modelId: string,
  yearCode: string,
  retry?: RetryOptions,
): Promise<ParallelumPrice> {
  const p = await fipeGet<V2Price>(
    `${V2_TYPE[type]}/brands/${brandId}/models/${modelId}/years/${yearCode}`,
    retry,
  );
  return {
    Valor: p.price,
    Marca: p.brand,
    Modelo: p.model,
    AnoModelo: p.modelYear,
    Combustivel: p.fuel,
    CodigoFipe: p.codeFipe,
    MesReferencia: p.referenceMonth,
    SiglaCombustivel: p.fuelAcronym,
  };
}

/** "R$ 30.000,00" → 30000.00 */
export function parseFipeValor(valor: string): number {
  const cleaned = valor.replace(/[^\d,]/g, "").replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n) || cleaned === "") {
    throw new Error(`Valor FIPE inválido: ${valor}`);
  }
  return n;
}

/** Delay aleatório entre requests (educação com o rate limit). */
export function randomDelay(minMs: number, maxMs: number): Promise<void> {
  return sleep(minMs + Math.random() * (maxMs - minMs));
}
