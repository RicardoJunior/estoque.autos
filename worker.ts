// ============================================================
// Worker custom (wrangler.jsonc "main"): reexporta o handler gerado
// pelo OpenNext e adiciona o `scheduled` do Cron Trigger, que aciona
// o processador de jobs dos portais (/api/integrations/worker).
//
// Este arquivo fica FORA do tsconfig/eslint (importa um artefato de
// build que só existe depois de `opennextjs-cloudflare build`).
// Validar local: `wrangler dev --test-scheduled` +
//   curl "http://localhost:8787/__scheduled?cron=*/2+*+*+*+*"
// ============================================================

// @ts-ignore — gerado pelo build
import openNext from "./.open-next/worker.js";
// @ts-ignore — gerado pelo build
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";

interface Env {
  NEXT_PUBLIC_APP_URL?: string;
  INTEGRATIONS_CRON_SECRET?: string;
}

export default {
  fetch: openNext.fetch,

  async scheduled(
    _event: { cron: string; scheduledTime: number },
    env: Env,
    ctx: { waitUntil(p: Promise<unknown>): void },
  ) {
    const base = (env.NEXT_PUBLIC_APP_URL ?? "https://estoque.autos").replace(/\/+$/, "");
    const secret = env.INTEGRATIONS_CRON_SECRET;
    if (!secret) {
      console.warn("cron: INTEGRATIONS_CRON_SECRET ausente — worker de portais desligado");
      return;
    }
    ctx.waitUntil(
      fetch(`${base}/api/integrations/worker`, {
        method: "POST",
        headers: { "x-cron-secret": secret, "content-type": "application/json" },
        body: JSON.stringify({ maintenance: true, limit: 15 }),
      })
        .then(async (res) => {
          if (!res.ok) console.error("cron: worker respondeu", res.status, await res.text());
        })
        .catch((err) => console.error("cron: falha ao chamar o worker", err)),
    );
  },
};
