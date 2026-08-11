// Reproduz o caminho de escrita do getFipePrice com o service key.
import { createClient } from "@supabase/supabase-js";
import { fetchFipePrice, parseFipeValor } from "../src/lib/fipe/client";
try { process.loadEnvFile(".env.local"); } catch {}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
async function main() {
  // um year real do cache: pega o primeiro fipe_years
  const { data: y } = await s.from("fipe_years").select("*").limit(1).single();
  console.log("year de teste:", JSON.stringify(y));
  const live = await fetchFipePrice(y!.vehicle_type, y!.brand_id, y!.model_id, y!.id);
  const row = {
    vehicle_type: y!.vehicle_type, brand_id: y!.brand_id, model_id: y!.model_id,
    year_id: y!.id, fipe_code: live.CodigoFipe, price: parseFipeValor(live.Valor),
    brand_name: live.Marca, model_name: live.Modelo, year_model: live.AnoModelo,
    fuel: live.Combustivel, reference: live.MesReferencia,
    fetched_at: new Date().toISOString(),
  };
  const { error } = await s.from("fipe_prices").upsert(row, { onConflict: "vehicle_type,brand_id,model_id,year_id,reference" });
  console.log("upsert:", error ? `ERRO: ${error.message}` : "OK");
  const { count } = await s.from("fipe_prices").select("*", { count: "exact", head: true });
  console.log("fipe_prices count agora:", count);
}
main().catch((e) => { console.error("FALHA:", e.message); process.exit(1); });
