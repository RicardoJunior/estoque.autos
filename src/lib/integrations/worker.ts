import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "../supabase/admin";
import type { PortalId } from "../types";
import { contentHash, isVehicleActive, loadCanonical, loadTenantCanonicals } from "./canonical";
import {
  loadConnection,
  loadConnectionByAccount,
  saveCredentials,
  setConnectionStatus,
  touchConnection,
  listConnections,
} from "./connections";
import { humanMessage, isRetryable, PortalError, toPortalError } from "./errors";
import { ingestLead } from "./leads";
import { getListing, listListings, updateListing } from "./listings";
import { ensureJpegVariants } from "./photos";
import { claimJobs, enqueue, finishJob, retryJob } from "./queue";
import { getAdapter, hasAdapter } from "./registry";
import { upsertTaxonomy } from "./taxonomy";
import type {
  Connection,
  JobRow,
  ListingRow,
  PortalAdapter,
  PortalEventRow,
  TaxonomySyncContext,
} from "./types";

// ============================================================
// Worker de sincronização: reclama jobs da fila (skip locked),
// processa em série por portal dentro de um orçamento de tempo e
// aplica retry/backoff. Acionado pelo Cron Trigger (a cada 2 min,
// via /api/integrations/worker) e por after() nas actions.
// (docs/integracoes-portais.md §5.5)
// ============================================================

export interface RunOptions {
  tenantId?: string;
  budgetMs?: number;
  limit?: number;
  workerId?: string;
  /** manutenção (refresh de token, renovação, retenção) — só no cron */
  maintenance?: boolean;
}

export interface RunReport {
  claimed: number;
  done: number;
  retried: number;
  failed: number;
  ms: number;
}

const REFRESH_AHEAD_MS = 30 * 60_000;
const RENEW_AHEAD_MS = 7 * 86_400_000;
const FETCH_LEADS_EVERY_MS = 60 * 60_000;

function log(entry: Record<string, unknown>): void {
  console.log(JSON.stringify({ scope: "portals", ...entry }));
}

export async function runWorker(opts: RunOptions = {}): Promise<RunReport> {
  const started = Date.now();
  const budget = opts.budgetMs ?? 25_000;
  const admin = createAdminClient();
  const workerId = opts.workerId ?? `w-${Math.random().toString(36).slice(2, 8)}`;
  const report: RunReport = { claimed: 0, done: 0, retried: 0, failed: 0, ms: 0 };

  if (opts.maintenance) {
    try {
      await admin.rpc("release_stale_portal_jobs");
      await scheduleMaintenance(admin);
    } catch (err) {
      log({ event: "maintenance_error", error: (err as Error).message });
    }
  }

  const jobs = await claimJobs(admin, opts.limit ?? 10, workerId, opts.tenantId);
  report.claimed = jobs.length;
  // série por portal (rate limit); a ordem entre portais não importa
  jobs.sort((a, b) => a.portal.localeCompare(b.portal));

  for (const job of jobs) {
    if (Date.now() - started > budget) {
      // devolve o que não deu tempo, sem contar tentativa
      await admin
        .from("portal_sync_jobs")
        .update({ status: "pending", locked_at: null, locked_by: null, attempts: job.attempts - 1 })
        .eq("id", job.id);
      continue;
    }
    const t0 = Date.now();
    try {
      await processJob(admin, job);
      await finishJob(admin, job.id, "done");
      report.done += 1;
      log({ event: "job_done", portal: job.portal, tenant: job.tenant_id, job: job.id, kind: job.kind, ms: Date.now() - t0 });
    } catch (err) {
      const pe = toPortalError(err);
      const msg = humanMessage(pe);
      if (isRetryable(pe.kind)) {
        const again = await retryJob(admin, job, msg);
        if (again) report.retried += 1;
        else report.failed += 1;
      } else {
        await finishJob(admin, job.id, "failed", msg);
        report.failed += 1;
      }
      log({ event: "job_error", portal: job.portal, tenant: job.tenant_id, job: job.id, kind: job.kind, error_kind: pe.kind, error: pe.message.slice(0, 300), ms: Date.now() - t0 });
    }
  }

  report.ms = Date.now() - started;
  return report;
}

// ------------------------------------------------------------
// Dispatcher
// ------------------------------------------------------------

async function processJob(admin: SupabaseClient, job: JobRow): Promise<void> {
  switch (job.kind) {
    case "publish":
    case "update":
      return handleListingSync(admin, job);
    case "unpublish":
      return handleUnpublish(admin, job);
    case "sync_tenant":
      return handleSyncTenant(admin, job);
    case "refresh_token":
      return handleRefreshToken(admin, job);
    case "process_event":
      return handleEvent(admin, job);
    case "fetch_leads":
      return handleFetchLeads(admin, job);
    case "renew":
      return handleRenew(admin, job);
    case "photos_jpeg":
      return handlePhotosJpeg(admin, job);
    case "sync_taxonomy":
      return handleSyncTaxonomy(admin, job);
  }
}

// ------------------------------------------------------------
// Helpers de estado
// ------------------------------------------------------------

/** Conexão pronta para chamadas; `null` (com listing marcado) se não dá. */
async function usableConnection(
  admin: SupabaseClient,
  tenantId: string,
  portal: PortalId,
): Promise<Connection | null> {
  const conn = await loadConnection(admin, tenantId, portal);
  if (!conn || conn.status === "disconnected") return null;
  return conn;
}

/** Aplica o erro ao anúncio e à conexão; retorna se o job deve tentar de novo. */
async function applyListingError(
  admin: SupabaseClient,
  listing: ListingRow | null,
  conn: Connection | null,
  pe: PortalError,
): Promise<void> {
  const msg = humanMessage(pe);
  if (listing) {
    const status =
      pe.kind === "validation" ? "rejected"
      : pe.kind === "not_found" ? "removed"
      : isRetryable(pe.kind) ? "queued"
      : "error";
    await updateListing(admin, listing.id, {
      status,
      last_error: msg,
      error_details: pe.kind === "mapping" ? ((pe.details as ListingRow["error_details"]) ?? null) : null,
    });
  }
  if (conn && (pe.kind === "needs_plan" || pe.kind === "auth")) {
    await setConnectionStatus(admin, conn.id, pe.kind === "needs_plan" ? "needs_plan" : "error", msg);
  }
}

async function ensurePhotos(admin: SupabaseClient, vehicleId: string, phoneOverride?: string) {
  const canonical = await loadCanonical(admin, vehicleId, phoneOverride);
  if (!canonical) return null;
  const needs = canonical.vehicle.photos?.some((p) => !p.jpeg_url);
  if (needs) {
    const photos = await ensureJpegVariants(admin, canonical.vehicle);
    canonical.vehicle.photos = photos;
    canonical.photos = photos.map((p) => ({ url: p.jpeg_url ?? p.url, url_webp: p.url }));
  }
  return canonical;
}

// ------------------------------------------------------------
// publish / update
// ------------------------------------------------------------

async function handleListingSync(admin: SupabaseClient, job: JobRow): Promise<void> {
  if (!job.tenant_id || !job.vehicle_id) return;
  const listing = await getListing(admin, job.vehicle_id, job.portal);
  if (!listing || !listing.desired) return;

  const conn = await usableConnection(admin, job.tenant_id, job.portal);
  if (!conn) {
    await updateListing(admin, listing.id, { status: "error", last_error: "Portal desconectado — conecte em Integrações." });
    return;
  }
  if (conn.status === "needs_plan" || conn.status === "error") {
    await updateListing(admin, listing.id, {
      status: "error",
      last_error: conn.last_error ?? "Conexão precisa de atenção em Integrações.",
    });
    return;
  }

  const adapter = await getAdapter(job.portal);
  if (adapter.capabilities.batch) {
    // OLX: tudo vai num lote por loja
    await enqueue(admin, { portal: job.portal, kind: "sync_tenant", tenantId: job.tenant_id });
    return;
  }

  const canonical = await ensurePhotos(admin, job.vehicle_id, conn.settings.phone_override);
  if (!canonical) return;
  if (!isVehicleActive(canonical.vehicle)) {
    if (listing.external_id) {
      await enqueue(admin, {
        portal: job.portal,
        kind: "unpublish",
        tenantId: job.tenant_id,
        vehicleId: job.vehicle_id,
        payload: { external_id: listing.external_id, keep_desired: true },
      });
    }
    return;
  }

  try {
    const payload = await adapter.mapVehicle(canonical, conn);
    const hash = await contentHash(payload);
    if (listing.external_id && listing.status === "active" && listing.content_hash === hash) {
      await updateListing(admin, listing.id, { last_synced_at: new Date().toISOString() });
      return;
    }

    await updateListing(admin, listing.id, { status: "publishing", last_error: null });
    let result;
    if (listing.external_id && adapter.update) {
      try {
        result = (await adapter.update(conn, listing.external_id, payload, canonical)) ?? {
          externalId: listing.external_id,
          url: listing.external_url ?? undefined,
        };
      } catch (err) {
        // anúncio sumiu/fechou no portal: publica de novo
        if (err instanceof PortalError && err.kind === "not_found" && adapter.publish) {
          result = await adapter.publish(conn, payload, canonical);
        } else {
          throw err;
        }
      }
    } else if (adapter.publish) {
      result = await adapter.publish(conn, payload, canonical);
    } else {
      throw new PortalError("validation", "portal não publica por item");
    }

    await updateListing(admin, listing.id, {
      status: "active",
      external_id: result.externalId,
      external_url: result.url ?? listing.external_url,
      content_hash: hash,
      payload_snapshot: payload,
      expires_at: result.expiresAt?.toISOString() ?? listing.expires_at,
      last_error: null,
      error_details: null,
      last_synced_at: new Date().toISOString(),
    });
    await touchConnection(admin, conn.id);
  } catch (err) {
    const pe = toPortalError(err);
    await applyListingError(admin, listing, conn, pe);
    throw pe;
  }
}

// ------------------------------------------------------------
// unpublish
// ------------------------------------------------------------

async function handleUnpublish(admin: SupabaseClient, job: JobRow): Promise<void> {
  if (!job.tenant_id) return;
  const listing = job.vehicle_id ? await getListing(admin, job.vehicle_id, job.portal) : null;
  const externalId = (job.payload.external_id as string | undefined) ?? listing?.external_id ?? null;
  const keepDesired = job.payload.keep_desired === true;

  if (!externalId) {
    if (listing) await updateListing(admin, listing.id, { status: "removed" });
    return;
  }
  // desconectar remove os anúncios ANTES de apagar as credenciais: aqui a
  // conexão pode estar 'disconnected' e ainda ter token
  const conn = await loadConnection(admin, job.tenant_id, job.portal);
  const hasCreds = !!conn && Object.keys(conn.creds).length > 0;
  if (!conn || !hasCreds) {
    if (listing) await updateListing(admin, listing.id, { status: "removed", last_error: "Portal desconectado." });
    return;
  }
  const adapter = await getAdapter(job.portal);
  try {
    if (adapter.unpublish) await adapter.unpublish(conn, externalId);
    if (listing) {
      await updateListing(admin, listing.id, {
        status: "removed",
        last_error: null,
        last_synced_at: new Date().toISOString(),
        ...(keepDesired ? {} : { desired: false }),
      });
    }
    await touchConnection(admin, conn.id);
  } catch (err) {
    const pe = toPortalError(err);
    if (pe.kind === "not_found") {
      if (listing) await updateListing(admin, listing.id, { status: "removed" });
      return;
    }
    await applyListingError(admin, listing, conn, pe);
    throw pe;
  }
}

// ------------------------------------------------------------
// sync_tenant (lote OLX · re-enfileira por item nos demais)
// ------------------------------------------------------------

async function handleSyncTenant(admin: SupabaseClient, job: JobRow): Promise<void> {
  if (!job.tenant_id) return;
  const conn = await usableConnection(admin, job.tenant_id, job.portal);
  if (!conn || conn.status !== "active") return;
  const adapter = await getAdapter(job.portal);
  const listings = await listListings(admin, { tenantId: job.tenant_id, portal: job.portal });

  if (!adapter.capabilities.batch) {
    for (const l of listings) {
      if (!l.desired) continue;
      await enqueue(admin, {
        portal: job.portal,
        kind: l.external_id ? "update" : "publish",
        tenantId: job.tenant_id,
        vehicleId: l.vehicle_id,
      });
    }
    return;
  }

  // lote: tudo que a loja quer no ar + remoções pendentes
  const { items } = await loadTenantCanonicals(admin, job.tenant_id, conn.settings.phone_override);
  const activeById = new Map(items.map((c) => [c.vehicle.id, c]));
  type Desired = { canonical: NonNullable<typeof items[number]>; listing: ListingRow; payload: Record<string, unknown>; hash: string };
  const desired: Desired[] = [];
  const removed: ListingRow[] = [];
  const skipped: { listing: ListingRow; error: PortalError }[] = [];

  for (const l of listings) {
    const canonical = activeById.get(l.vehicle_id);
    const wantsOnline = l.desired && !!canonical && !(canonical.vehicle.status === "reserved" && conn.settings.unpublish_on_reserved);
    if (wantsOnline && canonical) {
      // fotos JPEG antes de mandar a URL
      const withPhotos = await ensurePhotos(admin, l.vehicle_id, conn.settings.phone_override);
      if (!withPhotos) continue;
      try {
        const payload = await adapter.mapVehicle(withPhotos, conn);
        desired.push({ canonical: withPhotos, listing: l, payload, hash: await contentHash(payload) });
      } catch (err) {
        skipped.push({ listing: l, error: toPortalError(err) });
      }
    } else if (l.external_id && l.status !== "removed") {
      removed.push(l);
    }
  }

  for (const s of skipped) await applyListingError(admin, s.listing, null, s.error);
  // nada mudou desde o último lote? não gasta chamada
  const changed = desired.some((d) => d.listing.status !== "active" || d.listing.content_hash !== d.hash);
  if ((desired.length === 0 || !changed) && removed.length === 0) return;

  try {
    for (const d of desired) await updateListing(admin, d.listing.id, { status: "publishing", last_error: null });
    const result = await adapter.syncTenant!(conn, desired, removed);
    const now = new Date().toISOString();
    for (const s of result.sent) {
      const l = listings.find((x) => x.vehicle_id === s.vehicleId);
      if (!l) continue;
      if (s.op === "insert") {
        const d = desired.find((x) => x.listing.id === l.id);
        await updateListing(admin, l.id, {
          status: "active",
          external_id: s.externalId,
          content_hash: d?.hash ?? l.content_hash,
          payload_snapshot: d?.payload ?? l.payload_snapshot,
          last_error: null,
          last_synced_at: now,
        });
      } else {
        await updateListing(admin, l.id, { status: "removed", last_synced_at: now });
      }
    }
    await touchConnection(admin, conn.id);
  } catch (err) {
    const pe = toPortalError(err);
    for (const d of desired) await applyListingError(admin, d.listing, null, pe);
    if (pe.kind === "needs_plan" || pe.kind === "auth") {
      await setConnectionStatus(admin, conn.id, pe.kind === "needs_plan" ? "needs_plan" : "error", humanMessage(pe));
    }
    throw pe;
  }
}

// ------------------------------------------------------------
// refresh_token (ML: refresh de uso único — um job por conexão)
// ------------------------------------------------------------

async function handleRefreshToken(admin: SupabaseClient, job: JobRow): Promise<void> {
  if (!job.tenant_id) return;
  const conn = await loadConnection(admin, job.tenant_id, job.portal);
  if (!conn || conn.status === "disconnected") return;
  const adapter = await getAdapter(job.portal);
  if (!adapter.refreshCredentials) return;
  try {
    const result = await adapter.refreshCredentials(conn);
    await saveCredentials(admin, conn.id, result.creds, result.tokenExpiresAt ?? null);
    if (result.tokenExpiresAt) {
      await enqueue(admin, {
        portal: job.portal,
        kind: "refresh_token",
        tenantId: job.tenant_id,
        runAfter: new Date(result.tokenExpiresAt.getTime() - REFRESH_AHEAD_MS),
      });
    }
  } catch (err) {
    const pe = toPortalError(err);
    if (pe.kind === "auth") {
      await setConnectionStatus(admin, conn.id, "error", humanMessage(pe));
    }
    throw pe;
  }
}

// ------------------------------------------------------------
// process_event (webhook → lead / status do anúncio)
// ------------------------------------------------------------

async function handleEvent(admin: SupabaseClient, job: JobRow): Promise<void> {
  const eventId = job.payload.event_id as string | undefined;
  if (!eventId) return;
  const { data } = await admin.from("portal_events").select("*").eq("id", eventId).maybeSingle();
  const event = data as PortalEventRow | null;
  if (!event || event.status !== "pending") return;

  const adapter = await getAdapter(job.portal);
  let conn: Connection | null = null;
  let tenantId = event.tenant_id;
  if (!tenantId && adapter.resolveEventAccount) {
    const account = adapter.resolveEventAccount(event);
    if (account) {
      conn = await loadConnectionByAccount(admin, job.portal, account);
      tenantId = conn?.tenant_id ?? null;
    }
  } else if (tenantId) {
    conn = await loadConnection(admin, tenantId, job.portal);
  }

  if (!tenantId) {
    await admin
      .from("portal_events")
      .update({ status: "ignored", error: "loja não identificada", processed_at: new Date().toISOString() })
      .eq("id", event.id);
    return;
  }

  try {
    const parsed = await adapter.parseEvent(event, conn ?? undefined);
    if (!parsed) {
      await admin
        .from("portal_events")
        .update({ status: "ignored", tenant_id: tenantId, processed_at: new Date().toISOString() })
        .eq("id", event.id);
      return;
    }
    if (parsed.kind === "lead") {
      await ingestLead(admin, tenantId, job.portal, parsed, event.body);
    } else {
      const { data: l } = await admin
        .from("portal_listings")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("portal", job.portal)
        .eq("external_id", parsed.externalListingId)
        .maybeSingle();
      if (l) await updateListing(admin, l.id, { status: parsed.status, last_error: parsed.reason ?? null });
    }
    await admin
      .from("portal_events")
      .update({ status: "done", tenant_id: tenantId, processed_at: new Date().toISOString() })
      .eq("id", event.id);
    if (conn) await touchConnection(admin, conn.id);
  } catch (err) {
    const pe = toPortalError(err);
    await admin
      .from("portal_events")
      .update({
        status: isRetryable(pe.kind) ? "pending" : "failed",
        tenant_id: tenantId,
        error: pe.message.slice(0, 500),
      })
      .eq("id", event.id);
    if (conn && pe.kind === "auth") await setConnectionStatus(admin, conn.id, "error", humanMessage(pe));
    throw pe;
  }
}

// ------------------------------------------------------------
// fetch_leads (pull de segurança)
// ------------------------------------------------------------

async function handleFetchLeads(admin: SupabaseClient, job: JobRow): Promise<void> {
  if (!job.tenant_id) return;
  const conn = await usableConnection(admin, job.tenant_id, job.portal);
  if (!conn || conn.status !== "active") return;
  const adapter = await getAdapter(job.portal);
  if (!adapter.fetchLeads) return;
  const since = new Date(Date.now() - 2 * 86_400_000);
  const leads = await adapter.fetchLeads(conn, since);
  for (const lead of leads) await ingestLead(admin, job.tenant_id, job.portal, lead, lead);
  await admin
    .from("portal_connections")
    .update({ settings: { ...conn.settings, leads_fetched_at: new Date().toISOString() } })
    .eq("id", conn.id);
}

// ------------------------------------------------------------
// renew (ML: anúncio de 180 dias)
// ------------------------------------------------------------

async function handleRenew(admin: SupabaseClient, job: JobRow): Promise<void> {
  if (!job.tenant_id || !job.vehicle_id) return;
  const listing = await getListing(admin, job.vehicle_id, job.portal);
  if (!listing?.external_id || !listing.desired) return;
  const conn = await usableConnection(admin, job.tenant_id, job.portal);
  if (!conn || conn.status !== "active") return;
  const adapter = await getAdapter(job.portal);
  if (!adapter.renew) return;
  const canonical = await ensurePhotos(admin, job.vehicle_id, conn.settings.phone_override);
  if (!canonical || !isVehicleActive(canonical.vehicle)) return;
  try {
    const payload = await adapter.mapVehicle(canonical, conn);
    const result = await adapter.renew(conn, listing.external_id, payload, canonical);
    if (result) {
      await updateListing(admin, listing.id, {
        status: "active",
        external_id: result.externalId,
        external_url: result.url ?? listing.external_url,
        expires_at: result.expiresAt?.toISOString() ?? null,
        last_synced_at: new Date().toISOString(),
        last_error: null,
      });
    }
  } catch (err) {
    const pe = toPortalError(err);
    await applyListingError(admin, listing, conn, pe);
    throw pe;
  }
}

// ------------------------------------------------------------
// photos_jpeg (backfill de fotos antigas)
// ------------------------------------------------------------

async function handlePhotosJpeg(admin: SupabaseClient, job: JobRow): Promise<void> {
  if (!job.vehicle_id) return;
  const { data } = await admin
    .from("vehicles")
    .select("id, tenant_id, photos")
    .eq("id", job.vehicle_id)
    .maybeSingle();
  if (!data) return;
  await ensureJpegVariants(admin, data);
}

// ------------------------------------------------------------
// sync_taxonomy (versão leve; a completa roda no GitHub Actions)
// ------------------------------------------------------------

export function taxonomyContext(admin: SupabaseClient, connection?: Connection): TaxonomySyncContext {
  return {
    connection,
    upsert: (rows) => upsertTaxonomy(admin, rows),
    log: (msg) => log({ event: "taxonomy", msg }),
  };
}

async function handleSyncTaxonomy(admin: SupabaseClient, job: JobRow): Promise<void> {
  const adapter = await getAdapter(job.portal);
  if (!adapter.syncTaxonomy) return;
  let conn: Connection | undefined;
  if (job.tenant_id) conn = (await loadConnection(admin, job.tenant_id, job.portal)) ?? undefined;
  if (!conn) {
    const any = await listConnections(admin, { portal: job.portal, status: ["active"] });
    conn = any[0];
  }
  await adapter.syncTaxonomy(taxonomyContext(admin, conn), job.payload.full === true);
}

// ------------------------------------------------------------
// Manutenção periódica (cron): refresh de token, renovação de
// anúncios, pull de leads, retenção
// ------------------------------------------------------------

async function scheduleMaintenance(admin: SupabaseClient): Promise<void> {
  const conns = await listConnections(admin, { status: ["active"] });
  const now = Date.now();
  for (const conn of conns) {
    if (!hasAdapter(conn.portal)) continue;
    const adapter: PortalAdapter = await getAdapter(conn.portal);

    if (adapter.refreshCredentials && conn.token_expires_at) {
      const exp = Date.parse(conn.token_expires_at);
      if (exp - now < REFRESH_AHEAD_MS + 5 * 60_000) {
        await enqueue(admin, { portal: conn.portal, kind: "refresh_token", tenantId: conn.tenant_id });
      }
    }
    if (adapter.fetchLeads) {
      const last = Date.parse((conn.settings as { leads_fetched_at?: string }).leads_fetched_at ?? "") || 0;
      if (now - last > FETCH_LEADS_EVERY_MS) {
        await enqueue(admin, { portal: conn.portal, kind: "fetch_leads", tenantId: conn.tenant_id });
      }
    }
  }

  // anúncios vencendo (ML: 180 dias)
  const { data: expiring } = await admin
    .from("portal_listings")
    .select("tenant_id, vehicle_id, portal")
    .eq("status", "active")
    .eq("desired", true)
    .not("expires_at", "is", null)
    .lt("expires_at", new Date(now + RENEW_AHEAD_MS).toISOString())
    .limit(50);
  for (const l of (expiring ?? []) as Pick<ListingRow, "tenant_id" | "vehicle_id" | "portal">[]) {
    await enqueue(admin, { portal: l.portal, kind: "renew", tenantId: l.tenant_id, vehicleId: l.vehicle_id });
  }

  // eventos que ficaram sem job (webhook aceitou mas o enqueue falhou)
  const { data: orphans } = await admin
    .from("portal_events")
    .select("id, portal")
    .eq("status", "pending")
    .lt("received_at", new Date(now - 5 * 60_000).toISOString())
    .limit(50);
  for (const e of (orphans ?? []) as Pick<PortalEventRow, "id" | "portal">[]) {
    await enqueue(admin, { portal: e.portal, kind: "process_event", payload: { event_id: e.id } });
  }

  // conexões desconectadas cujos anúncios já saíram: apaga as credenciais
  const { data: gone } = await admin
    .from("portal_connections")
    .select("id, tenant_id, portal")
    .eq("status", "disconnected")
    .not("credentials", "is", null)
    .limit(20);
  for (const c of (gone ?? []) as { id: string; tenant_id: string; portal: PortalId }[]) {
    const { count } = await admin
      .from("portal_listings")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", c.tenant_id)
      .eq("portal", c.portal)
      .not("external_id", "is", null)
      .neq("status", "removed");
    const { count: pendingJobs } = await admin
      .from("portal_sync_jobs")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", c.tenant_id)
      .eq("portal", c.portal)
      .eq("kind", "unpublish")
      .in("status", ["pending", "running"]);
    if ((count ?? 0) === 0 && (pendingJobs ?? 0) === 0) {
      await admin
        .from("portal_connections")
        .update({ credentials: null, credentials_iv: null, token_expires_at: null })
        .eq("id", c.id);
    }
  }

  // retenção (LGPD): uma vez por dia, às 03h UTC
  const d = new Date(now);
  if (d.getUTCHours() === 3 && d.getUTCMinutes() < 2) {
    await admin.rpc("portal_retention_sweep");
  }
}
