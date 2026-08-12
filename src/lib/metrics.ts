import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeadType, VehiclePhoto, VehicleStatus } from "./types";
import { vehicleTitle } from "./format";

/**
 * Agregações do dashboard (home do admin).
 *
 * Os builders são funções puras que recebem `now`/chaves de período — as
 * queries só buscam linhas cruas. Bucketing de dia/mês é feito no fuso da
 * loja (produto BR-only: America/Sao_Paulo, UTC-3 fixo desde 2019), não em
 * UTC — um lead às 23h de sábado conta no sábado.
 */

const TZ = "America/Sao_Paulo";
const DAY_MS = 86_400_000;
/** PostgREST corta qualquer SELECT em 1000 linhas — sempre paginar. */
const PAGE = 1000;
/** Códigos FIPE por request (lista IN vai na querystring; evita URL gigante). */
const CODE_CHUNK = 100;

// ------------------------------------------------------------
// Chaves de período (puras, testáveis)
// ------------------------------------------------------------

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** ISO/Date → "AAAA-MM-DD" no fuso da loja. */
export function dayKey(date: string | Date): string {
  return dayKeyFmt.format(new Date(date));
}

/** ISO/Date → "AAAA-MM" no fuso da loja. */
export function monthKey(date: string | Date): string {
  return dayKey(date).slice(0, 7);
}

/** Últimos `n` meses (chaves "AAAA-MM"), terminando no mês de `now`. */
export function lastMonthKeys(now: Date, n: number): string[] {
  const [y, m] = monthKey(now).split("-").map(Number);
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    // dia 15 UTC: longe de qualquer borda de mês/fuso
    const d = new Date(Date.UTC(y, m - 1 - i, 15));
    keys.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
    );
  }
  return keys;
}

/** Últimos `n` dias (chaves "AAAA-MM-DD"), terminando no dia de `now`. */
export function lastDayKeys(now: Date, n: number): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    keys.push(dayKey(new Date(now.getTime() - i * DAY_MS)));
  }
  return keys;
}

const FIPE_MONTHS: Record<string, string> = {
  janeiro: "01",
  fevereiro: "02",
  março: "03",
  abril: "04",
  maio: "05",
  junho: "06",
  julho: "07",
  agosto: "08",
  setembro: "09",
  outubro: "10",
  novembro: "11",
  dezembro: "12",
};

/**
 * Referência FIPE → chave de mês: "junho de 2026" (fipe_prices.reference)
 * ou "junho/2026" (tabela oficial) → "2026-06". `null` se irreconhecível.
 */
export function fipeReferenceKey(reference: string): string | null {
  const m = reference
    .trim()
    .toLowerCase()
    .match(/^([a-zç]+)(?:\s+de\s+|\/)(\d{4})$/);
  const month = m ? FIPE_MONTHS[m[1]] : undefined;
  return month ? `${m![2]}-${month}` : null;
}

// ------------------------------------------------------------
// Tipos
// ------------------------------------------------------------

export type VehicleRow = {
  id: string;
  price: number;
  status: VehicleStatus;
  created_at: string;
  sold_at: string | null;
  updated_at: string;
  fipe_code: string | null;
  fipe_year_id: string | null;
  fipe_price: number | null;
  fipe_reference: string | null;
};

export type FipeHistRow = {
  fipe_code: string;
  year_id: string;
  price: number;
  reference: string;
};

export type LeadRow = { created_at: string; type: LeadType };

export type RevenuePoint = { month: string; total: number; count: number };

export type StockValuePoint = {
  month: string;
  /** Soma dos preços anunciados ATUAIS dos veículos daquele mês — não há
   *  histórico de preço de anúncio, então meses passados usam o preço de
   *  hoje (a linha FIPE, essa sim, é histórica). 0 = estoque zerado de
   *  verdade; null = havia estoque mas nenhum com FIPE resolvível. */
  listed: number | null;
  /** Soma dos preços FIPE vigentes no mês, dos MESMOS veículos. */
  fipe: number | null;
  /** Veículos que entraram na soma (com FIPE resolvível). */
  vehicles: number;
  /** Veículos em estoque no fim do mês, com ou sem FIPE. */
  stocked: number;
};

export type LeadsDayPoint = {
  day: string;
  proposal: number;
  whatsapp: number;
  phone: number;
};

export type OldestVehicle = {
  id: string;
  title: string;
  days: number;
  price: number;
  photoUrl: string | null;
};

export type DashboardMetrics = {
  revenue: RevenuePoint[];
  revenueTotal12m: number;
  soldCount12m: number;
  stockValue: StockValuePoint[];
  /** Cobertura FIPE do estoque atual (só veículos com FIPE entram no gráfico). */
  stockFipeCoverage: { covered: number; total: number };
  leads: LeadsDayPoint[];
  leadsTotal30d: number;
  leadsPrev30d: number;
  oldest: OldestVehicle[];
  // KPIs derivados das mesmas linhas (evita queries duplicadas na página)
  availableCount: number;
  stockTotal: number;
};

// ------------------------------------------------------------
// Builders (puros)
// ------------------------------------------------------------

/** Momento da venda: trigger só preenche sold_at em UPDATE — veículo já
 *  criado como "vendido" (seed/import) fica sem sold_at; updated_at é o
 *  melhor proxy, mas é instável: qualquer edição posterior move a venda de
 *  mês. Só afeta linhas inseridas fora do app (o form sempre cria
 *  "available"). */
function soldAt(v: VehicleRow): string {
  return v.sold_at ?? v.updated_at;
}

/** Data da venda p/ faturamento — arquivado com sold_at continua sendo
 *  receita (migration 20260812000000 preserva sold_at no arquivamento). */
function revenueSoldAt(v: VehicleRow): string | null {
  if (v.status === "sold") return soldAt(v);
  if (v.status === "archived") return v.sold_at; // sem sold_at = nunca vendeu
  return null;
}

export function buildRevenueSeries(
  vehicles: VehicleRow[],
  months: string[],
): RevenuePoint[] {
  const byMonth = new Map<string, RevenuePoint>(
    months.map((m) => [m, { month: m, total: 0, count: 0 }]),
  );
  for (const v of vehicles) {
    const soldIso = revenueSoldAt(v);
    if (!soldIso) continue;
    const bucket = byMonth.get(monthKey(soldIso));
    if (bucket) {
      bucket.total += Number(v.price);
      bucket.count += 1;
    }
  }
  return months.map((m) => byMonth.get(m)!);
}

/** Estava no estoque no FIM do mês `m`? (snapshot mensal) */
function inStockAtMonthEnd(v: VehicleRow, m: string): boolean {
  // arquivado sem venda: não há data de arquivamento, a saída do estoque
  // não é reconstruível — fica fora do histórico
  if (v.status === "archived" && !v.sold_at) return false;
  if (monthKey(v.created_at) > m) return false;
  const exitIso =
    v.status === "sold" ? soldAt(v) : v.status === "archived" ? v.sold_at : null;
  if (exitIso && monthKey(exitIso) <= m) return false;
  return true;
}

export function buildStockValueSeries(
  vehicles: VehicleRow[],
  fipeRows: FipeHistRow[],
  months: string[],
): StockValuePoint[] {
  // Histórico por (fipe_code|year_id): mês → preço. Semeia com o snapshot do
  // próprio veículo (fipe_price @ fipe_reference) — vale quando o histórico
  // global ainda não cobre aquele par.
  const hist = new Map<string, Map<string, number>>();
  const put = (pair: string, refKey: string | null, price: number) => {
    if (!refKey) return;
    let byMonth = hist.get(pair);
    if (!byMonth) hist.set(pair, (byMonth = new Map()));
    if (!byMonth.has(refKey)) byMonth.set(refKey, price);
  };
  for (const r of fipeRows) {
    put(`${r.fipe_code}|${r.year_id}`, fipeReferenceKey(r.reference), Number(r.price));
  }
  for (const v of vehicles) {
    if (v.fipe_code && v.fipe_year_id && v.fipe_price != null && v.fipe_reference) {
      put(
        `${v.fipe_code}|${v.fipe_year_id}`,
        fipeReferenceKey(v.fipe_reference),
        Number(v.fipe_price),
      );
    }
  }
  const sortedKeys = new Map<string, string[]>();
  for (const [pair, byMonth] of hist) {
    sortedKeys.set(pair, [...byMonth.keys()].sort());
  }
  /** Preço FIPE vigente no mês `m`: referência mais recente ≤ m. */
  const priceAt = (pair: string, m: string): number | null => {
    const keys = sortedKeys.get(pair);
    if (!keys) return null;
    for (let i = keys.length - 1; i >= 0; i--) {
      if (keys[i] <= m) return hist.get(pair)!.get(keys[i])!;
    }
    return null;
  };

  const points = months.map((m) => {
    let listed = 0;
    let fipe = 0;
    let count = 0;
    let stocked = 0;
    for (const v of vehicles) {
      if (!inStockAtMonthEnd(v, m)) continue;
      stocked += 1;
      // Série comparável: só veículos com FIPE vinculada — o vão entre as
      // linhas nunca é diferença de cobertura. Atenção: `price` é o preço
      // ATUAL do anúncio (não há histórico), então o ágio de meses passados
      // é aproximado; só o mês corrente compara preços contemporâneos.
      if (!v.fipe_code || !v.fipe_year_id) continue;
      const fipeAt = priceAt(`${v.fipe_code}|${v.fipe_year_id}`, m);
      if (fipeAt == null) continue; // sem FIPE resolvível → fora das DUAS somas
      listed += Number(v.price);
      fipe += fipeAt;
      count += 1;
    }
    // estoque zerado é 0 de verdade; estoque sem cobertura FIPE é lacuna
    const gap = stocked > 0 && count === 0;
    return {
      month: m,
      listed: gap ? null : listed,
      fipe: gap ? null : fipe,
      vehicles: count,
      stocked,
    };
  });

  // corta meses iniciais anteriores ao primeiro estoque da loja
  const first = points.findIndex((p) => p.stocked > 0);
  return first === -1 ? [] : points.slice(first);
}

export function buildLeadsSeries(
  rows: LeadRow[],
  days: string[],
): LeadsDayPoint[] {
  const byDay = new Map<string, LeadsDayPoint>(
    days.map((d) => [d, { day: d, proposal: 0, whatsapp: 0, phone: 0 }]),
  );
  for (const r of rows) {
    const bucket = byDay.get(dayKey(r.created_at));
    if (bucket) bucket[r.type] += 1;
  }
  return days.map((d) => byDay.get(d)!);
}

// ------------------------------------------------------------
// Queries (finas; paginam além do corte de 1000 do PostgREST)
// ------------------------------------------------------------

type PageResult<T> = PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
}>;

async function fetchAll<T>(
  build: (from: number, to: number) => PageResult<T>,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    out.push(...rows);
    if (rows.length < PAGE) return out;
  }
}

function fetchVehicles(supabase: SupabaseClient, tenantId: string) {
  return fetchAll<VehicleRow>((from, to) =>
    supabase
      .from("vehicles")
      .select(
        "id,price,status,created_at,sold_at,updated_at,fipe_code,fipe_year_id,fipe_price,fipe_reference",
      )
      .eq("tenant_id", tenantId)
      // desempate por id: paginação instável sem ordem única
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to),
  );
}

async function fetchFipeHistory(
  supabase: SupabaseClient,
  vehicles: VehicleRow[],
): Promise<FipeHistRow[]> {
  const pairs = new Set(
    vehicles
      .filter((v) => v.fipe_code && v.fipe_year_id)
      .map((v) => `${v.fipe_code}|${v.fipe_year_id}`),
  );
  const codes = [...new Set([...pairs].map((p) => p.split("|")[0]))];
  const chunks: string[][] = [];
  for (let i = 0; i < codes.length; i += CODE_CHUNK) {
    chunks.push(codes.slice(i, i + CODE_CHUNK));
  }
  const results = await Promise.all(
    chunks.map((chunk) =>
      fetchAll<FipeHistRow>((from, to) =>
        supabase
          .from("fipe_prices")
          .select("fipe_code,year_id,price,reference")
          .in("fipe_code", chunk)
          .order("id", { ascending: true })
          .range(from, to),
      ),
    ),
  );
  // fipe_code sozinho não é único entre anos-modelo — filtra pelos pares reais
  return results.flat().filter((r) => pairs.has(`${r.fipe_code}|${r.year_id}`));
}

function fetchLeads(supabase: SupabaseClient, tenantId: string, sinceIso: string) {
  return fetchAll<LeadRow>((from, to) =>
    supabase
      .from("leads")
      .select("created_at,type")
      .eq("tenant_id", tenantId)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to),
  );
}

async function fetchOldest(
  supabase: SupabaseClient,
  tenantId: string,
  now: Date,
): Promise<OldestVehicle[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("id,brand,model,version,year_model,price,created_at,photos")
    .eq("tenant_id", tenantId)
    .in("status", ["available", "reserved"])
    .order("created_at", { ascending: true })
    .limit(7);
  if (error) throw new Error(error.message);
  type Row = {
    id: string;
    brand: string;
    model: string;
    version: string | null;
    year_model: number | null;
    price: number;
    created_at: string;
    photos: VehiclePhoto[];
  };
  return ((data ?? []) as Row[]).map((v) => ({
    id: v.id,
    title: vehicleTitle(v),
    days: Math.max(
      0,
      Math.floor((now.getTime() - Date.parse(v.created_at)) / DAY_MS),
    ),
    price: Number(v.price),
    photoUrl: v.photos?.[0]?.url ?? null,
  }));
}

// ------------------------------------------------------------
// Orquestrador
// ------------------------------------------------------------

export async function getDashboardMetrics(
  supabase: SupabaseClient,
  tenantId: string,
  now = new Date(),
): Promise<DashboardMetrics> {
  const months = lastMonthKeys(now, 12);
  const days = lastDayKeys(now, 30);
  const prevDays = lastDayKeys(new Date(now.getTime() - 30 * DAY_MS), 30);
  // 61 dias de folga p/ cobrir a janela anterior inteira em qualquer fuso
  const leadsSince = new Date(now.getTime() - 61 * DAY_MS).toISOString();

  const [vehicles, leadRows, oldest] = await Promise.all([
    fetchVehicles(supabase, tenantId),
    fetchLeads(supabase, tenantId, leadsSince),
    fetchOldest(supabase, tenantId, now),
  ]);
  const fipeRows = await fetchFipeHistory(supabase, vehicles);

  const revenue = buildRevenueSeries(vehicles, months);
  const leads = buildLeadsSeries(leadRows, days);
  const prevSet = new Set(prevDays);
  const inStock = vehicles.filter(
    (v) => v.status === "available" || v.status === "reserved",
  );

  return {
    revenue,
    revenueTotal12m: revenue.reduce((s, p) => s + p.total, 0),
    soldCount12m: revenue.reduce((s, p) => s + p.count, 0),
    stockValue: buildStockValueSeries(vehicles, fipeRows, months),
    stockFipeCoverage: {
      covered: inStock.filter((v) => v.fipe_code && v.fipe_year_id).length,
      total: inStock.length,
    },
    leads,
    leadsTotal30d: leads.reduce(
      (s, p) => s + p.proposal + p.whatsapp + p.phone,
      0,
    ),
    leadsPrev30d: leadRows.filter((r) => prevSet.has(dayKey(r.created_at)))
      .length,
    oldest,
    availableCount: vehicles.filter((v) => v.status === "available").length,
    stockTotal: inStock.reduce((s, v) => s + Number(v.price), 0),
  };
}
