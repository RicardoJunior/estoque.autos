import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobKind, JobRow, PortalId } from "./types";

// ============================================================
// Fila em tabela (portal_sync_jobs). Enfileirar passa pela RPC
// enqueue_portal_job (coalesce: um pendente por chave). Executar é
// papel do worker (worker.ts), acionado por Cron Trigger + after().
// ============================================================

/** Backoff exponencial em minutos: 1, 5, 30, 2h, 12h; depois 'dead'. */
export const BACKOFF_MINUTES = [1, 5, 30, 120, 720] as const;
export const MAX_ATTEMPTS = BACKOFF_MINUTES.length + 1;

/** Espera antes da próxima tentativa, dado o nº de tentativas já feitas. */
export function backoffMs(attempts: number): number | null {
  if (attempts >= MAX_ATTEMPTS) return null;
  const idx = Math.min(Math.max(attempts - 1, 0), BACKOFF_MINUTES.length - 1);
  return BACKOFF_MINUTES[idx] * 60_000;
}

export interface EnqueueInput {
  portal: PortalId;
  kind: JobKind;
  tenantId?: string | null;
  vehicleId?: string | null;
  payload?: Record<string, unknown>;
  runAfter?: Date;
}

export async function enqueue(
  admin: SupabaseClient,
  input: EnqueueInput,
): Promise<string | null> {
  const { data, error } = await admin.rpc("enqueue_portal_job", {
    p_portal: input.portal,
    p_kind: input.kind,
    p_tenant: input.tenantId ?? null,
    p_vehicle: input.vehicleId ?? null,
    p_payload: input.payload ?? {},
    p_run_after: (input.runAfter ?? new Date()).toISOString(),
  });
  if (error) {
    console.error("enqueue_portal_job falhou:", error.message, input);
    return null;
  }
  return (data as string | null) ?? null;
}

export async function enqueueMany(
  admin: SupabaseClient,
  inputs: EnqueueInput[],
): Promise<void> {
  for (const input of inputs) await enqueue(admin, input);
}

export async function claimJobs(
  admin: SupabaseClient,
  limit: number,
  workerId: string,
  tenantId?: string,
): Promise<JobRow[]> {
  const { data, error } = await admin.rpc("claim_portal_jobs", {
    p_limit: limit,
    p_worker: workerId,
    p_tenant: tenantId ?? null,
  });
  if (error) throw new Error(`claim_portal_jobs: ${error.message}`);
  return (data ?? []) as JobRow[];
}

export async function finishJob(
  admin: SupabaseClient,
  jobId: string,
  status: "done" | "failed" | "dead",
  lastError: string | null = null,
): Promise<void> {
  await admin
    .from("portal_sync_jobs")
    .update({
      status,
      last_error: lastError,
      finished_at: new Date().toISOString(),
      locked_at: null,
      locked_by: null,
    })
    .eq("id", jobId);
}

/** Devolve o job para a fila com backoff; `null` quando esgotou. */
export async function retryJob(
  admin: SupabaseClient,
  job: JobRow,
  lastError: string,
): Promise<boolean> {
  const wait = backoffMs(job.attempts);
  if (wait == null) {
    await finishJob(admin, job.id, "dead", lastError);
    return false;
  }
  await admin
    .from("portal_sync_jobs")
    .update({
      status: "pending",
      run_after: new Date(Date.now() + wait).toISOString(),
      last_error: lastError,
      locked_at: null,
      locked_by: null,
    })
    .eq("id", job.id);
  return true;
}

/** Últimos jobs de uma loja (log da página do portal). */
export async function recentJobs(
  admin: SupabaseClient,
  tenantId: string,
  portal: PortalId,
  limit = 50,
): Promise<JobRow[]> {
  const { data } = await admin
    .from("portal_sync_jobs")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("portal", portal)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as JobRow[];
}
