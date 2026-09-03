import type { SupabaseClient } from "@supabase/supabase-js";
import { CREDENTIALS_KEY_VERSION, decryptJson, encryptJson } from "./crypto";
import type {
  Connection,
  ConnectionRow,
  ConnectionSettings,
  ConnectionStatus,
  Credentials,
  PortalId,
} from "./types";

// ============================================================
// portal_connections: leitura/escrita SÓ com o admin client (service
// role), dentro de actions protegidas por requireStaff() ou no worker.
// Credenciais entram e saem cifradas (crypto.ts).
// ============================================================

export async function toConnection(row: ConnectionRow): Promise<Connection> {
  const { credentials, credentials_iv, ...rest } = row;
  const creds =
    credentials && credentials_iv
      ? await decryptJson<Credentials>(credentials, credentials_iv)
      : {};
  return { ...rest, settings: rest.settings ?? {}, creds };
}

export async function loadConnection(
  admin: SupabaseClient,
  tenantId: string,
  portal: PortalId,
): Promise<Connection | null> {
  const { data } = await admin
    .from("portal_connections")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("portal", portal)
    .maybeSingle();
  return data ? toConnection(data as ConnectionRow) : null;
}

export async function loadConnectionById(
  admin: SupabaseClient,
  id: string,
): Promise<Connection | null> {
  const { data } = await admin
    .from("portal_connections")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? toConnection(data as ConnectionRow) : null;
}

/** Conexão pela conta externa (ML user_id, OLX e-mail, Webmotors CNPJ). */
export async function loadConnectionByAccount(
  admin: SupabaseClient,
  portal: PortalId,
  externalAccountId: string,
): Promise<Connection | null> {
  const { data } = await admin
    .from("portal_connections")
    .select("*")
    .eq("portal", portal)
    .eq("external_account_id", externalAccountId)
    .limit(1)
    .maybeSingle();
  return data ? toConnection(data as ConnectionRow) : null;
}

/** Conexão pelo segredo na URL do webhook (OLX/Webmotors) ou token de feed. */
export async function loadConnectionBySetting(
  admin: SupabaseClient,
  portal: PortalId,
  key: "webhook_secret" | "feed_token",
  value: string,
): Promise<Connection | null> {
  if (!value) return null;
  const { data } = await admin
    .from("portal_connections")
    .select("*")
    .eq("portal", portal)
    .eq(`settings->>${key}`, value)
    .limit(1)
    .maybeSingle();
  return data ? toConnection(data as ConnectionRow) : null;
}

export async function listConnections(
  admin: SupabaseClient,
  filter: { tenantId?: string; portal?: PortalId; status?: ConnectionStatus[] } = {},
): Promise<Connection[]> {
  let q = admin.from("portal_connections").select("*");
  if (filter.tenantId) q = q.eq("tenant_id", filter.tenantId);
  if (filter.portal) q = q.eq("portal", filter.portal);
  if (filter.status) q = q.in("status", filter.status);
  const { data } = await q;
  return Promise.all(((data ?? []) as ConnectionRow[]).map(toConnection));
}

export interface UpsertConnectionInput {
  tenantId: string;
  portal: PortalId;
  creds: Credentials;
  externalAccountId: string | null;
  tokenExpiresAt?: Date | null;
  status?: ConnectionStatus;
  settings?: ConnectionSettings;
}

/** Cria/atualiza a conexão com credenciais cifradas. */
export async function upsertConnection(
  admin: SupabaseClient,
  input: UpsertConnectionInput,
): Promise<ConnectionRow> {
  const { ciphertext, iv } = await encryptJson(input.creds);
  const row = {
    tenant_id: input.tenantId,
    portal: input.portal,
    credentials: ciphertext,
    credentials_iv: iv,
    key_version: CREDENTIALS_KEY_VERSION,
    external_account_id: input.externalAccountId,
    token_expires_at: input.tokenExpiresAt?.toISOString() ?? null,
    status: input.status ?? "active",
    last_error: null,
    last_ok_at: new Date().toISOString(),
    ...(input.settings ? { settings: input.settings } : {}),
  };
  const { data, error } = await admin
    .from("portal_connections")
    .upsert(row, { onConflict: "tenant_id,portal" })
    .select("*")
    .single();
  if (error) throw new Error(`portal_connections upsert: ${error.message}`);
  return data as ConnectionRow;
}

/** Troca só as credenciais (refresh de token). */
export async function saveCredentials(
  admin: SupabaseClient,
  connId: string,
  creds: Credentials,
  tokenExpiresAt?: Date | null,
): Promise<void> {
  const { ciphertext, iv } = await encryptJson(creds);
  const { error } = await admin
    .from("portal_connections")
    .update({
      credentials: ciphertext,
      credentials_iv: iv,
      key_version: CREDENTIALS_KEY_VERSION,
      token_expires_at: tokenExpiresAt?.toISOString() ?? null,
      status: "active",
      last_error: null,
      last_ok_at: new Date().toISOString(),
    })
    .eq("id", connId);
  if (error) throw new Error(`saveCredentials: ${error.message}`);
}

export async function setConnectionStatus(
  admin: SupabaseClient,
  connId: string,
  status: ConnectionStatus,
  lastError: string | null = null,
): Promise<void> {
  await admin
    .from("portal_connections")
    .update({ status, last_error: lastError })
    .eq("id", connId);
}

export async function touchConnection(
  admin: SupabaseClient,
  connId: string,
): Promise<void> {
  await admin
    .from("portal_connections")
    .update({ last_ok_at: new Date().toISOString(), last_error: null })
    .eq("id", connId);
}

export async function updateConnectionSettings(
  admin: SupabaseClient,
  connId: string,
  patch: Partial<ConnectionSettings>,
  current: ConnectionSettings,
): Promise<ConnectionSettings> {
  const next = { ...current, ...patch };
  await admin.from("portal_connections").update({ settings: next }).eq("id", connId);
  return next;
}
