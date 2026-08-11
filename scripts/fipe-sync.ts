// ============================================================
// Sync mensal FIPE (API oficial): a tabela muda todo mês — este
// script cabe no cron de 30 min do GitHub Actions:
//  1. renova o CATÁLOGO (marcas + modelos, com poda dos removidos):
//     sem isso o catálogo fossiliza e modelos novos nunca aparecem
//  2. renova o preço dos códigos em uso por veículos cadastrados
//     e propaga o novo valor para o snapshot fipe_* dos veículos
//
// A TABELA DE PREÇOS inteira é refresh à parte (horas, resumable):
//   npx tsx scripts/seed-fipe.ts --prices
//
// Roda fora do Worker (GitHub Actions cron mensal ou manual):
//   npx tsx scripts/fipe-sync.ts
//
// Env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { parseFipeValor, randomDelay } from "../src/lib/fipe/client";
import { importFipeStructure } from "../src/lib/fipe/import";
import { fetchFipeReference, officialFetchPrice } from "../src/lib/fipe/official";
import type { FipeVehicleType } from "../src/lib/fipe/types";

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

async function main() {
  // 0. catálogo: re-importa marcas+modelos (força + poda) — mantém
  //    a estrutura completa mês a mês
  console.log("── catálogo (marcas + modelos) ──");
  const structure = await importFipeStructure(supabase, { force: true });

  // 1. códigos FIPE em uso por veículos não-arquivados
  console.log("\n── preços em uso ──");
  const { data: inUse, error } = await supabase
    .from("vehicles")
    .select("fipe_code, fipe_year_id")
    .not("fipe_code", "is", null)
    .neq("status", "archived");
  if (error) throw new Error(error.message);

  const unique = new Map<string, { code: string; yearId: string }>();
  for (const v of inUse ?? []) {
    if (v.fipe_code && v.fipe_year_id) {
      unique.set(`${v.fipe_code}|${v.fipe_year_id}`, {
        code: v.fipe_code,
        yearId: v.fipe_year_id,
      });
    }
  }
  console.log(`${unique.size} códigos FIPE em uso`);

  const ref = await fetchFipeReference();
  const references = new Map<FipeVehicleType, string>();
  let updated = 0;

  for (const { code, yearId } of unique.values()) {
    // 2. caminho da API vem do cache de preços (sempre existe: o
    //    form só grava snapshot depois de consultar o preço)
    const { data: known } = await supabase
      .from("fipe_prices")
      .select("vehicle_type, brand_id, model_id, year_id")
      .eq("fipe_code", code)
      .eq("year_id", yearId)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!known) {
      console.warn(`  sem caminho cacheado p/ ${code} ${yearId} — pulando`);
      continue;
    }

    await randomDelay(700, 1_100);
    try {
      const live = await officialFetchPrice(
        known.vehicle_type as FipeVehicleType,
        ref,
        known.brand_id,
        known.model_id,
        known.year_id,
      );
      const price = parseFipeValor(live.Valor);

      // 3. grava a referência nova (idempotente por unique constraint)
      await supabase.from("fipe_prices").upsert(
        {
          vehicle_type: known.vehicle_type,
          brand_id: known.brand_id,
          model_id: known.model_id,
          year_id: known.year_id,
          fipe_code: live.CodigoFipe,
          price,
          brand_name: live.Marca,
          model_name: live.Modelo,
          year_model: live.AnoModelo,
          fuel: live.Combustivel,
          reference: live.MesReferencia,
          // atualiza a idade mesmo quando o mês de referência repete
          // (senão o TTL do cache on-demand nunca renova)
          fetched_at: new Date().toISOString(),
        },
        { onConflict: "vehicle_type,brand_id,model_id,year_id,reference" },
      );

      // 4. propaga para o snapshot dos veículos com esse código
      await supabase
        .from("vehicles")
        .update({ fipe_price: price, fipe_reference: live.MesReferencia })
        .eq("fipe_code", code)
        .eq("fipe_year_id", yearId);

      references.set(known.vehicle_type as FipeVehicleType, live.MesReferencia);
      updated++;
      console.log(`  ✓ ${code} ${yearId} → R$ ${price} (${live.MesReferencia})`);
    } catch (err) {
      console.error(`  erro em ${code} ${yearId}: ${(err as Error).message}`);
    }
  }

  // 5. marca a referência vigente por tipo
  for (const [type, reference] of references) {
    await supabase.from("fipe_sync_meta").upsert(
      { vehicle_type: type, reference, synced_at: new Date().toISOString() },
      { onConflict: "vehicle_type" },
    );
  }

  console.log(`\nSync FIPE concluído: ${updated}/${unique.size} códigos atualizados.`);

  if (structure.problems.length > 0) {
    console.error(`\nCatálogo com ${structure.problems.length} pendências:`);
    for (const p of structure.problems) console.error(`  • ${p}`);
    process.exit(1); // cron acusa a falha; preços já foram sincronizados
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
