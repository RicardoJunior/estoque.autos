import type { InboundLead } from "../types";

// ============================================================
// Webhook de leads da OLX (POST por lead): source (whatsapp,
// telefone, chat, financing, olx), listId, linkAd, name, email,
// phone, message, createdAt, adId (o NOSSO id) e adsInfo.
// ============================================================

export interface OlxLeadBody {
  source?: string;
  listId?: string | number;
  linkAd?: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  createdAt?: string;
  adId?: string;
  leadId?: string | number;
  id?: string | number;
  adsInfo?: Record<string, unknown>;
}

export function isOlxLead(body: unknown): body is OlxLeadBody {
  if (!body || typeof body !== "object") return false;
  const b = body as OlxLeadBody;
  return !!(b.adId || b.listId) && !!(b.name || b.email || b.phone || b.message || b.source);
}

/** Chave de idempotência: id do lead quando houver; senão adId+contato+data. */
export function olxLeadKey(b: OlxLeadBody): string {
  if (b.leadId != null) return `lead:${b.leadId}`;
  if (b.id != null) return `lead:${b.id}`;
  const contact = (b.phone ?? b.email ?? b.name ?? "").toLowerCase().replace(/\s+/g, "");
  return `${b.adId ?? b.listId}:${contact}:${b.createdAt ?? ""}`;
}

export function leadFromOlx(b: OlxLeadBody): InboundLead {
  return {
    kind: "lead",
    externalId: olxLeadKey(b),
    externalListingId: b.adId ?? null,
    externalUrl: b.linkAd ?? null,
    channel: b.source ?? null,
    name: b.name ?? null,
    phone: b.phone ?? null,
    email: b.email ?? null,
    message: b.message ?? (b.source === "chat" ? "Nova conversa no chat da OLX — responda pelo app da OLX." : null),
    createdAt: b.createdAt ?? null,
  };
}
