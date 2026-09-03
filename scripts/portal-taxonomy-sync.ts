// ============================================================
// Sincronização COMPLETA dos catálogos dos portais (marcas, modelos,
// versões). Milhares de requisições — roda fora do Worker (GitHub
// Actions semanal ou manual):
//
//   npx tsx scripts/portal-taxonomy-sync.ts --portal=mercadolivre
//   npx tsx scripts/portal-taxonomy-sync.ts --portal=olx
//
// Env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY + INTEGRATIONS_KMS_KEY
// (a OLX exige o token de uma conta conectada: usa a primeira conexão
// ativa — de preferência a conta OLX da própria estoque.autos).
//
// Alerta se o volume de um tipo cair mais de 20% em relação ao que já
// existia (sinal de reequalização de ids, como a da OLX em 25/09/2025).
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { listConnections } from "../src/lib/integrations/connections";
import { getAdapter } from "../src/lib/integrations/registry";
import { upsertTaxonomy } from "../src/lib/integrations/taxonomy";
import type { PortalId, TaxonomyRow } from "../src/lib/integrations/types";

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
const admin = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const arg = process.argv.find((a) => a.startsWith("--portal="))?.slice("--portal=".length);
const portals: PortalId[] = arg ? [arg as PortalId] : ["mercadolivre", "olx"];

async function countBy(portal: PortalId): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  for (const kind of ["brand", "model", "version", "attribute"]) {
    const { count } = await admin
      .from("portal_taxonomy")
      .select("external_id", { count: "exact", head: true })
      .eq("portal", portal)
      .eq("kind", kind);
    out.set(kind, count ?? 0);
  }
  return out;
}

async function main() {
  for (const portal of portals) {
    console.log(`── ${portal} ──`);
    const adapter = await getAdapter(portal);
    if (!adapter.syncTaxonomy) {
      console.log("  sem catálogo para sincronizar");
      continue;
    }
    const before = await countBy(portal);
    const [connection] = await listConnections(admin, { portal, status: ["active"] });
    const seen = new Map<string, Set<string>>();
    const started = new Date().toISOString();

    await adapter.syncTaxonomy(
      {
        connection,
        upsert: async (rows: TaxonomyRow[]) => {
          for (const r of rows) {
            if (!seen.has(r.kind)) seen.set(r.kind, new Set());
            seen.get(r.kind)!.add(r.external_id);
          }
          await upsertTaxonomy(admin, rows);
        },
        log: (msg) => console.log("  " + msg),
      },
      true,
    );

    // poda: ids que não vieram nesta rodada (só dos tipos sincronizados)
    for (const [kind, ids] of seen) {
      const prev = before.get(kind) ?? 0;
      if (prev > 0 && ids.size < prev * 0.8) {
        console.warn(
          `  ⚠ ${portal}/${kind}: ${ids.size} ids agora vs ${prev} antes (queda > 20%) — possível reequalização; poda pulada`,
        );
        continue;
      }
      const { count } = await admin
        .from("portal_taxonomy")
        .delete({ count: "exact" })
        .eq("portal", portal)
        .eq("kind", kind)
        .lt("synced_at", started);
      console.log(`  ${kind}: ${ids.size} ids · ${count ?? 0} removidos`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
