import { after } from "next/server";

/**
 * Disparo imediato do worker depois de uma server action (não espera
 * o cron de 2 min). `after()` roda no waitUntil do Worker; o import
 * dinâmico mantém os adapters fora do bundle das actions.
 */
export function kickWorker(tenantId: string): void {
  try {
    after(async () => {
      try {
        const { runWorker } = await import("./worker");
        await runWorker({ tenantId, budgetMs: 20_000, limit: 10 });
      } catch (err) {
        console.error("kickWorker:", err);
      }
    });
  } catch {
    // fora de request (testes) — o cron cobre
  }
}
