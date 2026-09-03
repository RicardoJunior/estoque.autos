import { createAdminClient } from "@/lib/supabase/admin";
import { loadConnectionBySetting } from "@/lib/integrations/connections";
import { enqueue } from "@/lib/integrations/queue";
import { isPortalId, hasAdapter, getAdapter } from "@/lib/integrations/registry";
import { kickWorker } from "@/lib/integrations/kick";
import { sha256Hex } from "@/lib/integrations/crypto";

// ============================================================
// Webhooks dos portais: aceita, valida o que dá (OLX: segredo `t`
// na URL; ML: sem assinatura — o job busca o recurso com o token da
// loja, o que autentica a origem), grava em portal_events e
// responde 200 rápido. Processamento fica no job process_event.
// ============================================================

export const dynamic = "force-dynamic";

const MAX_BODY = 256 * 1024;

/** Rate limit simples por IP na memória da isolate (best-effort). */
const hits = new Map<string, { n: number; t: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 60_000) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  h.n += 1;
  return h.n > 600;
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ portal: string }> },
) {
  const { portal } = await ctx.params;
  if (!isPortalId(portal) || !hasAdapter(portal)) return new Response("not found", { status: 404 });

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "?";
  if (rateLimited(ip)) return new Response("too many", { status: 429 });

  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BODY) return new Response("too large", { status: 413 });
  const text = await req.text();
  if (text.length > MAX_BODY) return new Response("too large", { status: 413 });

  let body: unknown;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    // alguns portais mandam form-encoded
    body = Object.fromEntries(new URLSearchParams(text));
  }

  const admin = createAdminClient();
  const url = new URL(req.url);
  const secret = url.searchParams.get("t") ?? "";

  // tenant pelo segredo da URL (OLX/Webmotors); ML resolve depois por user_id
  let tenantId: string | null = null;
  if (secret) {
    const conn = await loadConnectionBySetting(admin, portal, "webhook_secret", secret);
    if (!conn) return new Response("forbidden", { status: 403 });
    tenantId = conn.tenant_id;
  } else if (portal !== "mercadolivre") {
    return new Response("forbidden", { status: 403 });
  }

  // chave de idempotência
  const adapter = await getAdapter(portal);
  let externalKey: string | null = null;
  if (portal === "mercadolivre") {
    const n = body as { topic?: string; resource?: string; sent?: string };
    externalKey = n?.resource ? `${n.topic ?? "?"}:${n.resource}` : null;
  } else {
    const parsed = await adapter.parseEvent({
      id: "",
      portal,
      tenant_id: tenantId,
      external_key: null,
      headers: null,
      body,
      received_at: new Date().toISOString(),
      processed_at: null,
      status: "pending",
      error: null,
    }).catch(() => null);
    externalKey = parsed?.kind === "lead" ? parsed.externalId : null;
  }
  if (!externalKey) externalKey = await sha256Hex(text || String(Date.now()));

  const headers: Record<string, string> = {};
  for (const k of ["content-type", "user-agent", "x-request-id"]) {
    const v = req.headers.get(k);
    if (v) headers[k] = v;
  }

  const { data, error } = await admin
    .from("portal_events")
    .insert({ portal, tenant_id: tenantId, external_key: externalKey, headers, body })
    .select("id")
    .maybeSingle();

  if (error) {
    // 23505: reenvio de um evento já recebido — 200 para o portal parar
    if ((error as { code?: string }).code === "23505") return Response.json({ ok: true, duplicate: true });
    console.error("portal_events insert:", error.message);
    return new Response("error", { status: 500 });
  }

  if (data?.id) {
    await enqueue(admin, { portal, kind: "process_event", tenantId, payload: { event_id: data.id } });
    if (tenantId) kickWorker(tenantId);
  }
  return Response.json({ ok: true });
}

/** ML valida a URL de notificações com GET/HEAD. */
export async function GET() {
  return new Response("ok");
}
