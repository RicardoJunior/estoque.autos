// ============================================================
// Backfill das variantes JPEG (1920×1440) das fotos antigas. A
// conversão em si usa o binding Cloudflare Images, que só existe
// dentro do Worker — por isso este script apenas ENFILEIRA um job
// photos_jpeg por veículo com foto sem jpeg_url; o worker (cron a
// cada 2 min) faz a conversão e grava jpeg_path/jpeg_url.
//
//   npx tsx scripts/photos-backfill-jpeg.ts [--tenant=<uuid>]
//
// Env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY
// ============================================================

import { createClient } from "@supabase/supabase-js";
import type { VehiclePhoto } from "../src/lib/types";

try {
  process.loadEnvFile(".env.local");
} catch {
  // CI
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
const tenantArg = process.argv.find((a) => a.startsWith("--tenant="))?.slice("--tenant=".length);

async function main() {
  let q = admin
    .from("vehicles")
    .select("id, tenant_id, photos")
    .neq("status", "archived")
    .order("created_at", { ascending: true });
  if (tenantArg) q = q.eq("tenant_id", tenantArg);
  const { data, error } = await q;
  if (error) throw new Error(error.message);

  let enqueued = 0;
  for (const v of data ?? []) {
    const photos = (v.photos as VehiclePhoto[] | null) ?? [];
    if (!photos.some((p) => p.path && !p.jpeg_url)) continue;
    const { error: e } = await admin.rpc("enqueue_portal_job", {
      p_portal: "mercadolivre", // o job não depende do portal; precisa de um valor
      p_kind: "photos_jpeg",
      p_tenant: v.tenant_id,
      p_vehicle: v.id,
      p_payload: {},
      p_run_after: new Date().toISOString(),
    });
    if (e) console.error("  falhou", v.id, e.message);
    else enqueued += 1;
  }
  console.log(`${enqueued} veículos enfileirados para gerar JPEG (o worker processa aos poucos).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
