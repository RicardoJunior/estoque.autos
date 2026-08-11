// ============================================================
// FIPE — importação em MASSA para as tabelas fipe_*: estrutura
// (marcas + modelos), anos e a TABELA DE PREÇOS inteira. Usado
// pelos scripts (seed/cron) — NUNCA pelo Worker.
//
// Fonte: API OFICIAL da FIPE (official.ts) — gratuita, sem token,
// sem cota paga. O parallelum fica só para o on-demand do app.
//
// Garantias:
//  • todo request re-tenta com backoff (client.ts); o que ainda
//    falhar entra em novas RONDAS até zerar (ou esgotar MAX_ROUNDS)
//  • completude é VERIFICADA no banco ao final e reportada como
//    pendência — nunca termina "ok" com buraco silencioso
//  • resume: re-rodar só busca o que falta (marcas sem modelos,
//    modelos sem anos, anos sem preço NA REFERÊNCIA vigente) —
//    interromper no meio custa nada
//  • force: re-busca tudo e PODA modelos que saíram da FIPE (ids
//    reciclados quebravam a cascata)
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import { parseFipeValor, randomDelay } from "./client";
import {
  fetchFipeReference,
  officialFetchBrands,
  officialFetchModels,
  officialFetchPrice,
  officialFetchYears,
  type FipeReference,
} from "./official";
import { FIPE_VEHICLE_TYPES, type FipeVehicleType } from "./types";

export interface ImportOptions {
  /** re-busca marcas já preenchidas e poda modelos removidos da FIPE */
  force?: boolean;
  /** crawleia anos por modelo (1 request por modelo) */
  crawlYears?: boolean;
  /** crawleia o PREÇO de cada (modelo, ano) na referência vigente
   *  (1 request por versão — a tabela inteira; horas, com resume) */
  crawlPrices?: boolean;
  types?: readonly FipeVehicleType[];
  log?: (msg: string) => void;
}

export interface ImportReport {
  reference: string;
  models: number;
  prices: number;
  /** pendências humanas ("carros: marca 22 (Ford) sem modelos") —
   *  vazio = importação completa e verificada */
  problems: string[];
}

// ~1,3 req/s: o fipe.org.br devolve 429 sustentado acima disso
// (testado: conc 3 + delay 600-1000 tomou throttle em minutos; esta
// config rodou 30 min sem uma falha). A tabela inteira leva ~half-day
// — é o preço de não tomar block.
const CONCURRENCY = 2;
const DELAY_MIN_MS = 700;
const DELAY_MAX_MS = 1_100;
const MAX_ROUNDS = 5;

/** o fipe.org.br abre janelas de 429 de MINUTOS — em lote, o retry
 *  precisa cavalgar a janela (backoff até 2 min, ~6 min no total)
 *  em vez de estourar em ~1 min como o perfil default */
const BULK_RETRY = { retries: 6, baseDelayMs: 2_000, maxDelayMs: 120_000 };

/** Populares primeiro — o dado mais usado aparece nos primeiros
 *  minutos; o resto segue em ordem alfabética. */
const BRAND_PRIORITY: Record<FipeVehicleType, string[]> = {
  carros: [
    "fiat", "vw - volkswagen", "gm - chevrolet", "ford", "toyota",
    "honda", "hyundai", "jeep", "renault", "nissan", "byd",
  ],
  motos: ["honda", "yamaha", "shineray", "haojue", "suzuki", "kawasaki", "bmw"],
  caminhoes: [
    "mercedes-benz", "volvo", "scania", "iveco", "vw - volkswagen",
    "ford", "daf",
  ],
};

function orderBrands(
  type: FipeVehicleType,
  brands: Array<{ codigo: string; nome: string }>,
) {
  const prio = BRAND_PRIORITY[type];
  const rank = (nome: string) => {
    const i = prio.indexOf(nome.toLowerCase());
    return i === -1 ? prio.length : i;
  };
  return [...brands].sort(
    (a, b) => rank(a.nome) - rank(b.nome) || a.nome.localeCompare(b.nome),
  );
}

/** pLimit minimalista (sem dependência). */
function pLimit(concurrency: number) {
  let active = 0;
  const queue: Array<() => void> = [];
  const next = () => {
    active--;
    queue.shift()?.();
  };
  return <T>(fn: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const run = () => {
        active++;
        fn().then(resolve, reject).finally(next);
      };
      if (active < concurrency) run();
      else queue.push(run);
    });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function upsertChunks(
  supabase: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
) {
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error } = await supabase
      .from(table)
      .upsert(chunk as never[], { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

/** select paginado — PostgREST corta em 1000 linhas por request. */
async function selectAll<T>(
  supabase: SupabaseClient,
  table: string,
  columns: string,
  filters: Record<string, string>,
): Promise<T[]> {
  const PAGE = 1000;
  const all: T[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = supabase.from(table).select(columns).range(from, from + PAGE - 1);
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    all.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) return all;
  }
}

/**
 * Processa itens em rondas: falhas de uma ronda viram a fila da
 * próxima, com pausa crescente entre rondas (deixa o rate limit
 * respirar). Devolve os itens que falharam TODAS as rondas.
 */
async function runRounds<T>(
  label: string,
  items: T[],
  describe: (item: T) => string,
  work: (item: T) => Promise<void>,
  log: (msg: string) => void,
): Promise<T[]> {
  let pending = items;
  for (let round = 1; round <= MAX_ROUNDS && pending.length > 0; round++) {
    if (round > 1) {
      const pause = round * 15_000;
      log(`  ronda ${round}: ${pending.length} pendentes — pausa de ${pause / 1000}s`);
      await sleep(pause);
    }
    const limit = pLimit(CONCURRENCY);
    const failures: T[] = [];
    let done = 0;
    await Promise.all(
      pending.map((item) =>
        limit(async () => {
          await randomDelay(DELAY_MIN_MS, DELAY_MAX_MS);
          try {
            await work(item);
          } catch (err) {
            failures.push(item);
            log(`  ✗ ${label} ${describe(item)}: ${(err as Error).message}`);
          }
          done++;
          if (done % 100 === 0 || done === pending.length) {
            log(`  ${done}/${pending.length} ${label}`);
          }
        }),
      ),
    );
    pending = failures;
  }
  return pending;
}

interface ImportContext {
  force: boolean;
  crawlYears: boolean;
  crawlPrices: boolean;
  log: (msg: string) => void;
  ref: FipeReference;
}

async function importType(
  supabase: SupabaseClient,
  type: FipeVehicleType,
  ctx: ImportContext,
): Promise<Omit<ImportReport, "reference">> {
  const { force, crawlYears, crawlPrices, log, ref } = ctx;
  log(`\n── ${type} ──`);

  // 1. marcas (o client já re-tenta; falha aqui aborta o tipo)
  const brands = await officialFetchBrands(type, ref);
  await upsertChunks(
    supabase,
    "fipe_brands",
    brands.map((b) => ({ vehicle_type: type, id: b.codigo, name: b.nome })),
    "vehicle_type,id",
  );
  log(`${brands.length} marcas`);

  // 2. ids de modelo já no banco, por marca (resume + poda)
  const dbModels = await selectAll<{ brand_id: string; id: string }>(
    supabase,
    "fipe_models",
    "brand_id,id",
    { vehicle_type: type },
  );
  const dbByBrand = new Map<string, Set<string>>();
  for (const m of dbModels) {
    (dbByBrand.get(m.brand_id) ?? dbByBrand.set(m.brand_id, new Set()).get(m.brand_id)!).add(m.id);
  }

  const todo = force ? brands : brands.filter((b) => !dbByBrand.has(b.codigo));
  if (todo.length < brands.length) {
    log(`${brands.length - todo.length} marcas já tinham modelos — pulando (resume)`);
  }

  // 3. modelos por marca, em rondas até zerar
  let modelCount = 0;
  let pruned = 0;
  const failedBrands = await runRounds(
    "marcas",
    todo,
    (b) => `${b.codigo} ${b.nome}`,
    async (brand) => {
      const models = await officialFetchModels(type, ref, brand.codigo, BULK_RETRY);
      if (models.length === 0) {
        // toda marca FIPE tem ≥1 modelo — payload vazio é transitório
        throw new Error("0 modelos retornados");
      }
      await upsertChunks(
        supabase,
        "fipe_models",
        models.map((m) => ({
          vehicle_type: type,
          brand_id: brand.codigo,
          id: m.codigo,
          name: m.nome,
        })),
        "vehicle_type,brand_id,id",
      );
      modelCount += models.length;

      // poda modelos que saíram da FIPE (ids reciclados quebravam a
      // cascata) — só com a lista live completa em mãos
      if (force) {
        const liveIds = new Set(models.map((m) => m.codigo));
        const stale = [...(dbByBrand.get(brand.codigo) ?? [])].filter(
          (id) => !liveIds.has(id),
        );
        if (stale.length > 0) {
          const { error } = await supabase
            .from("fipe_models")
            .delete()
            .eq("vehicle_type", type)
            .eq("brand_id", brand.codigo)
            .in("id", stale);
          if (error) throw new Error(`poda fipe_models: ${error.message}`);
          pruned += stale.length;
        }
      }
    },
    log,
  );
  log(`${modelCount} modelos importados${pruned ? `, ${pruned} podados` : ""}`);

  // 4. verificação de completude direto no banco (não confia na
  //    contabilidade em memória): marca sem modelo = pendência
  const after = await selectAll<{ brand_id: string }>(
    supabase,
    "fipe_models",
    "brand_id",
    { vehicle_type: type },
  );
  const covered = new Set(after.map((m) => m.brand_id));
  const problems = brands
    .filter((b) => !covered.has(b.codigo))
    .map((b) => `${type}: marca ${b.codigo} (${b.nome}) sem modelos`);
  if (failedBrands.length > 0) {
    log(`  ${failedBrands.length} marcas falharam todas as ${MAX_ROUNDS} rondas`);
  }

  // 5. anos + preços, MARCA POR MARCA: cada marca termina COMPLETA
  //    (anos de todos os modelos + preço de cada versão no mês
  //    vigente) antes da próxima — progresso visível desde o
  //    primeiro minuto, populares primeiro. Resume em tudo.
  let priceCount = 0;
  if (crawlYears || crawlPrices) {
    const models = await selectAll<{ brand_id: string; id: string }>(
      supabase,
      "fipe_models",
      "brand_id,id",
      { vehicle_type: type },
    );

    // resume: anos já no banco (a idade fica por conta do TTL do app)
    const yearsByModel = new Map<string, string[]>();
    for (const r of await selectAll<{
      brand_id: string;
      model_id: string;
      id: string;
    }>(supabase, "fipe_years", "brand_id,model_id,id", { vehicle_type: type })) {
      const k = `${r.brand_id}|${r.model_id}`;
      (yearsByModel.get(k) ?? yearsByModel.set(k, []).get(k)!).push(r.id);
    }
    // resume: versões já precificadas NESTA referência
    const priced = new Set<string>();
    if (crawlPrices) {
      for (const r of await selectAll<{
        brand_id: string;
        model_id: string;
        year_id: string;
      }>(supabase, "fipe_prices", "brand_id,model_id,year_id", {
        vehicle_type: type,
        reference: refMonthLabel(ref),
      })) {
        priced.add(`${r.brand_id}|${r.model_id}|${r.year_id}`);
      }
    }

    // um modelo completo = anos garantidos + toda versão precificada
    const processModel = async (model: { brand_id: string; id: string }) => {
      const k = `${model.brand_id}|${model.id}`;
      let yearIds = yearsByModel.get(k);
      if (!yearIds || yearIds.length === 0) {
        await randomDelay(DELAY_MIN_MS, DELAY_MAX_MS);
        const years = await officialFetchYears(
          type,
          ref,
          model.brand_id,
          model.id,
          BULK_RETRY,
        );
        if (years.length === 0) throw new Error("0 anos retornados");
        await upsertChunks(
          supabase,
          "fipe_years",
          years.map((y) => ({
            vehicle_type: type,
            brand_id: model.brand_id,
            model_id: model.id,
            id: y.codigo,
            name: y.nome,
            fetched_at: new Date().toISOString(),
          })),
          "vehicle_type,brand_id,model_id,id",
        );
        yearIds = years.map((y) => y.codigo);
        yearsByModel.set(k, yearIds);
      }
      if (!crawlPrices) return;
      for (const yearId of yearIds) {
        if (priced.has(`${k}|${yearId}`)) continue;
        await randomDelay(DELAY_MIN_MS, DELAY_MAX_MS);
        const live = await officialFetchPrice(
          type,
          ref,
          model.brand_id,
          model.id,
          yearId,
          BULK_RETRY,
        );
        const { error } = await supabase.from("fipe_prices").upsert(
          {
            vehicle_type: type,
            brand_id: model.brand_id,
            model_id: model.id,
            year_id: yearId,
            fipe_code: live.CodigoFipe,
            price: parseFipeValor(live.Valor),
            brand_name: live.Marca,
            model_name: live.Modelo,
            year_model: live.AnoModelo,
            fuel: live.Combustivel,
            reference: live.MesReferencia,
            fetched_at: new Date().toISOString(),
          },
          { onConflict: "vehicle_type,brand_id,model_id,year_id,reference" },
        );
        if (error) throw new Error(`fipe_prices: ${error.message}`);
        priced.add(`${k}|${yearId}`);
        priceCount++;
      }
    };

    const byBrand = new Map<string, Array<{ brand_id: string; id: string }>>();
    for (const m of models) {
      (byBrand.get(m.brand_id) ?? byBrand.set(m.brand_id, []).get(m.brand_id)!).push(m);
    }
    const ordered = orderBrands(type, brands);
    log(
      crawlPrices
        ? `anos + preços (${refMonthLabel(ref)}), marca por marca:`
        : "anos, marca por marca:",
    );

    const failedModels: Array<{ brand_id: string; id: string }> = [];
    let brandsDone = 0;
    for (const brand of ordered) {
      const brandModels = byBrand.get(brand.codigo) ?? [];
      brandsDone++;
      if (brandModels.length === 0) continue;
      const before = priceCount;
      const limit = pLimit(CONCURRENCY);
      await Promise.all(
        brandModels.map((m) =>
          limit(async () => {
            try {
              await processModel(m);
            } catch (err) {
              failedModels.push(m);
              log(`  ✗ ${brand.nome} modelo ${m.id}: ${(err as Error).message}`);
            }
          }),
        ),
      );
      log(
        `  ✓ ${brand.nome} completa` +
          (crawlPrices ? `: +${priceCount - before} preços` : "") +
          ` (${brandsDone}/${ordered.length} marcas)`,
      );
    }

    // re-tenta modelos que falharam, em rondas (resume interno pula
    // o que já entrou)
    const stillFailed = await runRounds(
      "modelos (retry)",
      failedModels,
      (m) => `${m.brand_id}/${m.id}`,
      processModel,
      log,
    );
    for (const m of stillFailed) {
      problems.push(`${type}: modelo ${m.brand_id}/${m.id} incompleto (anos/preços)`);
    }
  }

  return { models: modelCount, prices: priceCount, problems };
}

/** "agosto/2026" (tabela de referência) → "agosto de 2026" (campo
 *  MesReferencia dos preços) — é assim que fipe_prices.reference fica */
function refMonthLabel(ref: FipeReference): string {
  return ref.mes.replace("/", " de ");
}

/** Importa/renova estrutura, anos e preços FIPE. Devolve pendências
 *  verificadas no banco — chamador decide o exit code / alerta. */
export async function importFipeStructure(
  supabase: SupabaseClient,
  options: ImportOptions = {},
): Promise<ImportReport> {
  const {
    force = false,
    crawlYears = false,
    crawlPrices = false,
    types = FIPE_VEHICLE_TYPES,
    log = console.log,
  } = options;

  const ref = await fetchFipeReference();
  log(`referência vigente: ${ref.mes} (tabela ${ref.codigo})`);

  const report: ImportReport = {
    reference: refMonthLabel(ref),
    models: 0,
    prices: 0,
    problems: [],
  };
  for (const type of types) {
    const r = await importType(supabase, type, {
      force,
      crawlYears,
      crawlPrices,
      log,
      ref,
    });
    report.models += r.models;
    report.prices += r.prices;
    report.problems.push(...r.problems);
  }
  return report;
}
