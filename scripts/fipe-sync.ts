// ============================================================
// Sync mensal FIPE: a tabela muda todo mês — este script renova o
// preço APENAS dos códigos em uso por veículos cadastrados (conjunto
// pequeno; nada de crawl da tabela inteira) e propaga o novo valor
// para o snapshot fipe_* dos veículos.
//
// Roda fora do Worker (GitHub Actions cron mensal ou manual):
//   npx tsx scripts/fipe-sync.ts
//
// Env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY
// ============================================================

import { createClient } from "@supabase/supabase-js";
import {
  fetchFipePrice,
  parseFipeValor,
  randomDelay,
} from "../src/lib/fipe/client";
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
  // 1. códigos FIPE em uso por veículos não-arquivados
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

    await randomDelay(200, 500);
    try {
      const live = await fetchFipePrice(
        known.vehicle_type as FipeVehicleType,
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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
