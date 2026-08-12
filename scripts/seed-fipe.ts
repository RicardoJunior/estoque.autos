// ============================================================
// Importação FIPE no Supabase, direto da API OFICIAL da FIPE
// (veiculos.fipe.org.br — gratuita, sem token): brands + models dos
// 3 tipos e, opcionalmente, anos e a TABELA DE PREÇOS inteira.
// A lógica mora em src/lib/fipe/import.ts (compartilhada com o
// sync mensal, que renova o catálogo pra ele não fossilizar).
//
// Uso (local/CI — nunca no Worker):
//   npx tsx scripts/seed-fipe.ts [--type=carros] [--force] [--years] [--prices]
//
//   --type=X  só um tipo (carros | motos | caminhoes)
//   --force   re-busca marcas já preenchidas e poda modelos que
//             saíram da FIPE (default: resume — só busca o que falta)
//   --years   crawleia os anos de cada modelo (~11 mil requests)
//   --prices  crawleia o preço de cada versão na referência do mês
//             (~50 mil requests; implica --years). A ~2 req/s leva
//             algumas horas — interrompeu, re-roda: resume pula o
//             que já tem preço no mês vigente.
//   --mes=julho/2026  HISTÓRICO: importa a tabela de preços daquele
//             mês sobre o catálogo de anos já importado (~10-12h por
//             mês; resume por versão+mês; versões que não existiam
//             no mês são puladas). Ignora as outras flags exceto
//             --type. Rode a importação corrente ANTES.
//
// Env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY
// (carrega .env.local automaticamente se existir).
//
// Sai com exit 1 se a verificação final achar buraco (marca sem
// modelo, modelo sem ano, versão sem preço) — nada de terminar
// "ok" com a tabela pela metade.
// ============================================================

import { createClient } from "@supabase/supabase-js";
import {
  importFipePricesForReference,
  importFipeStructure,
} from "../src/lib/fipe/import";
import { fetchFipeReferenceList } from "../src/lib/fipe/official";
import { FIPE_VEHICLE_TYPES, type FipeVehicleType } from "../src/lib/fipe/types";

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

const argv = process.argv.slice(2);
const onlyType = argv.find((a) => a.startsWith("--type="))?.slice("--type=".length);
if (onlyType && !(FIPE_VEHICLE_TYPES as readonly string[]).includes(onlyType)) {
  console.error(`--type inválido: ${onlyType} (use carros|motos|caminhoes)`);
  process.exit(1);
}

async function main() {
  const mes = argv.find((a) => a.startsWith("--mes="))?.slice("--mes=".length);
  if (mes) {
    const refs = await fetchFipeReferenceList();
    const ref = refs.find((r) => r.mes.toLowerCase() === mes.toLowerCase());
    if (!ref) {
      console.error(
        `--mes inválido: "${mes}". Disponíveis (recentes): ${refs.slice(0, 12).map((r) => r.mes).join(", ")}`,
      );
      process.exit(1);
    }
    // --fatia=K/N: paraleliza entre máquinas de IPs distintos (CI)
    const fatiaRaw = argv.find((a) => a.startsWith("--fatia="))?.slice("--fatia=".length);
    let fatia: { k: number; n: number } | undefined;
    if (fatiaRaw) {
      const m = fatiaRaw.match(/^([1-9]\d*)\/([1-9]\d*)$/);
      if (!m || Number(m[1]) > Number(m[2])) {
        console.error(`--fatia inválida: "${fatiaRaw}" (use K/N, ex.: 1/2)`);
        process.exit(1);
      }
      fatia = { k: Number(m[1]), n: Number(m[2]) };
    }
    const report = await importFipePricesForReference(supabase, ref, {
      types: onlyType ? [onlyType as FipeVehicleType] : FIPE_VEHICLE_TYPES,
      fatia,
    });
    console.log(
      `\n${report.reference}: ${report.prices} preços importados, ${report.skipped} versões não existiam no mês`,
    );
    if (report.problems.length > 0) {
      console.error(`INCOMPLETO — ${report.problems.length} pendências (re-rode p/ completar)`);
      process.exit(1);
    }
    console.log("Importação histórica concluída e verificada.");
    return;
  }

  const report = await importFipeStructure(supabase, {
    force: argv.includes("--force"),
    crawlYears: argv.includes("--years"),
    crawlPrices: argv.includes("--prices"),
    types: onlyType ? [onlyType as FipeVehicleType] : FIPE_VEHICLE_TYPES,
  });

  console.log(
    `\n${report.models} modelos, ${report.prices} preços (${report.reference})`,
  );
  if (report.problems.length > 0) {
    console.error(`\nImportação INCOMPLETA — ${report.problems.length} pendências:`);
    for (const p of report.problems.slice(0, 50)) console.error(`  • ${p}`);
    if (report.problems.length > 50) {
      console.error(`  … +${report.problems.length - 50}`);
    }
    console.error("\nRode de novo para completar (resume automático).");
    process.exit(1);
  }
  console.log("Importação FIPE concluída e verificada — completa.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
