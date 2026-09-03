// ============================================================
// Integração com portais — contrato comum dos adapters.
// Toda diferença de payload, taxonomia e auth fica DENTRO do
// adapter; o resto da plataforma só conhece PortalAdapter.
// (docs/integracoes-portais.md §5.4)
// ============================================================

import type { PortalId, Tenant, Vehicle, VehiclePhoto } from "../types";

export type { PortalId };

export type ConnectionStatus =
  | "pending"
  | "active"
  | "needs_plan"
  | "error"
  | "disconnected";

export type ListingStatus =
  | "queued"
  | "publishing"
  | "active"
  | "paused"
  | "error"
  | "removed"
  | "rejected";

export type JobKind =
  | "publish"
  | "update"
  | "unpublish"
  | "sync_tenant"
  | "refresh_token"
  | "sync_taxonomy"
  | "process_event"
  | "fetch_leads"
  | "renew"
  | "photos_jpeg";

export type JobStatus = "pending" | "running" | "done" | "failed" | "dead";

/** Opções por conexão (portal_connections.settings). */
export interface ConnectionSettings {
  auto_publish?: boolean;
  unpublish_on_reserved?: boolean;
  listing_type?: "silver" | "gold" | "gold_premium";
  phone_override?: string;
  /** feeds (Meta AIA, Usadosbr): token aleatório na URL */
  feed_token?: string;
  /** segredo por conexão na URL do webhook (OLX/Webmotors) */
  webhook_secret?: string;
  /** OLX: token para registrar a URL de leads */
  leads_registered_at?: string;
}

/** Linha de portal_connections (credenciais ainda cifradas). */
export interface ConnectionRow {
  id: string;
  tenant_id: string;
  portal: PortalId;
  status: ConnectionStatus;
  external_account_id: string | null;
  credentials: string | null;
  credentials_iv: string | null;
  key_version: number;
  token_expires_at: string | null;
  settings: ConnectionSettings;
  last_error: string | null;
  last_ok_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Credenciais decifradas — só existem em memória, no servidor. */
export interface Credentials {
  access_token?: string;
  refresh_token?: string;
  /** ISO — quando o access_token vence */
  expires_at?: string;
  /** Webmotors/Chaves na Mão: usuário/senha/token de integração */
  login?: string;
  password?: string;
  api_login?: string;
  api_password?: string;
  token?: string;
}

/** Conexão pronta para uso pelo adapter. */
export interface Connection extends Omit<ConnectionRow, "credentials" | "credentials_iv"> {
  creds: Credentials;
}

export interface ListingRow {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  portal: PortalId;
  desired: boolean;
  status: ListingStatus;
  external_id: string | null;
  external_url: string | null;
  content_hash: string | null;
  payload_snapshot: unknown;
  expires_at: string | null;
  last_error: string | null;
  /** 'mapping': {kind, name, localKey, parent, candidates} para a UI resolver */
  error_details: MappingPending | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MappingPending {
  kind: string;
  name: string;
  localKey: string;
  parent: string | null;
  candidates: { external_id: string; name: string; score: number }[];
}

export interface JobRow {
  id: string;
  tenant_id: string | null;
  portal: PortalId;
  vehicle_id: string | null;
  kind: JobKind;
  payload: Record<string, unknown>;
  status: JobStatus;
  attempts: number;
  run_after: string;
  locked_at: string | null;
  locked_by: string | null;
  last_error: string | null;
  created_at: string;
  finished_at: string | null;
}

export interface PortalEventRow {
  id: string;
  portal: PortalId;
  tenant_id: string | null;
  external_key: string | null;
  headers: Record<string, string> | null;
  body: unknown;
  received_at: string;
  processed_at: string | null;
  status: "pending" | "done" | "ignored" | "failed";
  error: string | null;
}

/** Foto já resolvida para os portais (JPEG quando existir). */
export interface CanonicalPhoto {
  url: string;
  url_webp: string;
}

/**
 * Veículo + loja já resolvidos e normalizados; única entrada dos
 * adapters. `photos` prioriza a variante JPEG 1920×1440.
 */
export interface CanonicalVehicle {
  vehicle: Vehicle;
  tenant: Tenant;
  photos: CanonicalPhoto[];
  /** VDP canônica (domínio próprio ou /{slug}/carros/{id}) */
  storefrontUrl: string;
  /** telefone de contato do anúncio (só dígitos, com DDD) */
  phone: string | null;
  whatsapp: string | null;
  fipe: { code: string; yearId: string } | null;
}

export type PortalPayload = Record<string, unknown>;

export interface PublishResult {
  externalId: string;
  url?: string;
  expiresAt?: Date;
}

export interface InboundLead {
  kind: "lead";
  externalId: string;
  /** id do anúncio no portal (resolve o vehicle_id via portal_listings) */
  externalListingId: string | null;
  externalUrl: string | null;
  channel: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  createdAt: string | null;
  /** quando o portal identifica a loja no próprio payload */
  externalAccountId?: string | null;
}

export interface ListingStatusChange {
  kind: "listing_status";
  externalListingId: string;
  status: ListingStatus;
  reason?: string;
}

export type ParsedEvent = InboundLead | ListingStatusChange | null;

export type PortalErrorKind =
  | "needs_plan"
  | "auth"
  | "validation"
  | "mapping"
  | "rate_limit"
  | "transient"
  | "not_found";

export interface ConnectInput {
  tenant: Tenant;
  /** OAuth: código + verifier; credenciais: campos do formulário */
  code?: string;
  codeVerifier?: string;
  redirectUri?: string;
  fields?: Record<string, string>;
}

export interface ConnectResult {
  externalAccountId: string;
  creds: Credentials;
  tokenExpiresAt?: Date;
}

export interface TenantSyncResult {
  /** anúncios enviados neste lote, por vehicle_id */
  sent: { vehicleId: string; externalId: string; op: "insert" | "delete" }[];
  error?: string;
}

export interface AdapterCapabilities {
  /** publica/atualiza/remove por item (ML, Webmotors, Chaves na Mão) */
  perItem: boolean;
  /** lote por loja (OLX autoupload) */
  batch: boolean;
  leadsWebhook: boolean;
  oauth: boolean;
  /** o portal BUSCA um feed nosso (Meta AIA, Usadosbr) */
  feed: boolean;
  /** limite de fotos por anúncio */
  maxPhotos: number;
}

export interface PortalAdapter {
  id: PortalId;
  label: string;
  capabilities: AdapterCapabilities;
  /** texto de pré-requisito comercial mostrado na UI */
  prerequisite: string;
  /** OAuth (ML/OLX) ou validação de credenciais (Webmotors/Chaves na Mão). */
  connect(input: ConnectInput): Promise<ConnectResult>;
  /** ML: refresh_token de uso único. */
  refreshCredentials?(conn: Connection): Promise<ConnectResult>;
  /** Traduz o canônico para o payload do portal; lança PortalError('mapping'|'validation'). */
  mapVehicle(v: CanonicalVehicle, conn: Connection): Promise<PortalPayload>;
  publish?(conn: Connection, payload: PortalPayload, v: CanonicalVehicle): Promise<PublishResult>;
  update?(
    conn: Connection,
    externalId: string,
    payload: PortalPayload,
    v: CanonicalVehicle,
  ): Promise<PublishResult | void>;
  unpublish?(conn: Connection, externalId: string): Promise<void>;
  /** Anúncio venceu no portal? Devolve o novo estado (ML: 180 dias). */
  renew?(conn: Connection, externalId: string, payload: PortalPayload, v: CanonicalVehicle): Promise<PublishResult | null>;
  /** OLX: um lote por loja (payloads já mapeados pelo worker). */
  syncTenant?(
    conn: Connection,
    desired: { canonical: CanonicalVehicle; listing: ListingRow; payload: PortalPayload }[],
    removed: ListingRow[],
  ): Promise<TenantSyncResult>;
  /**
   * Enche portal_taxonomy. `full=false` (worker): só o que cabe em
   * poucas requisições (marcas/atributos). `full=true` (GitHub
   * Actions, scripts/portal-taxonomy-sync.ts): modelos e versões.
   */
  syncTaxonomy?(ctx: TaxonomySyncContext, full?: boolean): Promise<void>;
  /** Webhook → lead canônico (ou null para eventos que não são lead). */
  parseEvent(event: PortalEventRow, conn?: Connection): Promise<ParsedEvent>;
  /** Resolve a loja de um evento cru (user_id, CNPJ, token na URL…). */
  resolveEventAccount?(event: PortalEventRow): string | null;
  /** Pull de leads como rede de segurança (ML, Webmotors). */
  fetchLeads?(conn: Connection, since: Date): Promise<InboundLead[]>;
  /** Registra a URL de webhook no portal (OLX). */
  registerWebhook?(conn: Connection, url: string): Promise<void>;
}

export interface TaxonomySyncContext {
  upsert(rows: TaxonomyRow[]): Promise<void>;
  /** token de uma conta conectada (OLX exige) */
  connection?: Connection;
  log(msg: string): void;
}

export interface TaxonomyRow {
  portal: PortalId;
  kind: string;
  external_id: string;
  parent_id?: string | null;
  name: string;
  meta?: Record<string, unknown> | null;
}

export type { Tenant, Vehicle, VehiclePhoto };
