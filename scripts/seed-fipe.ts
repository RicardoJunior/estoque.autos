// ============================================================
// Seed da ESTRUTURA FIPE no Supabase: brands + models dos 3 tipos
// (carros, motos, caminhões). Years/preços são on-demand no app —
// crawl completo de years é pesado e desnecessário (rate limit).
//
// Uso (local/CI — nunca no Worker):
//   npx tsx scripts/seed-fipe.ts
//
// Env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY
// (carrega .env.local automaticamente se existir).
//
// Idempotente (upsert). Reaproveita o throttling do crawler legado:
// concorrência 3 + delay aleatório entre requests.
// ============================================================

import { createClient } from "@supabase/supabase-js";
import {
  fetchFipeBrands,
  fetchFipeModels,
  randomDelay,
} from "../src/lib/fipe/client";
import { FIPE_VEHICLE_TYPES } from "../src/lib/fipe/types";

try {
  process.loadEnvFile(".env.local");
} catch {
  // sem .env.local (CI) — env já vem do ambiente
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY.");
  process.exit(1);
}
const supabase = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

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

async function upsertChunks<T extends Record<string, unknown>>(
  table: string,
  rows: T[],
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

async function main() {
  const limit = pLimit(3);

  for (const type of FIPE_VEHICLE_TYPES) {
    console.log(`\n── ${type} ──`);
    const brands = await fetchFipeBrands(type);
    await upsertChunks(
      "fipe_brands",
      brands.map((b) => ({ vehicle_type: type, id: b.codigo, name: b.nome })),
      "vehicle_type,id",
    );
    console.log(`${brands.length} marcas`);

    let done = 0;
    let modelCount = 0;
    await Promise.all(
      brands.map((brand) =>
        limit(async () => {
          await randomDelay(300, 800);
          try {
            const models = await fetchFipeModels(type, brand.codigo);
            await upsertChunks(
              "fipe_models",
              models.map((m) => ({
                vehicle_type: type,
                brand_id: brand.codigo,
                id: String(m.codigo),
                name: m.nome,
              })),
              "vehicle_type,brand_id,id",
            );
            modelCount += models.length;
          } catch (err) {
            console.error(`  erro em ${brand.nome}: ${(err as Error).message}`);
          }
          done++;
          if (done % 10 === 0 || done === brands.length) {
            console.log(`  ${done}/${brands.length} marcas processadas`);
          }
        }),
      ),
    );
    console.log(`${modelCount} modelos`);
  }

  console.log("\nSeed da estrutura FIPE concluído.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
