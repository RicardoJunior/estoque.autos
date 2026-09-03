import { safeEqual } from "@/lib/integrations/crypto";
import { runWorker } from "@/lib/integrations/worker";

// ============================================================
// Processador de jobs dos portais. Chamado pelo Cron Trigger do
// Worker (worker.ts na raiz, a cada 2 min) com x-cron-secret.
// Sem sessão: a autenticação é o segredo compartilhado.
// ============================================================

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.INTEGRATIONS_CRON_SECRET;
  const given = req.headers.get("x-cron-secret") ?? "";
  if (!secret || !given || !safeEqual(secret, given)) {
    return new Response("unauthorized", { status: 401 });
  }

  let body: { tenantId?: string; limit?: number; maintenance?: boolean } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    // corpo vazio (cron)
  }

  const report = await runWorker({
    tenantId: typeof body.tenantId === "string" ? body.tenantId : undefined,
    limit: Math.min(Math.max(Number(body.limit) || 15, 1), 50),
    budgetMs: 25_000,
    maintenance: body.maintenance !== false,
  });
  return Response.json(report);
}
