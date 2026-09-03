import type { Connection, InboundLead, PortalEventRow } from "../types";
import { mlFetch } from "./client";

// ============================================================
// Leads do Mercado Livre: notificação `vis_leads` traz só o
// resource; buscamos o lead com o token da loja (isso também
// autentica a origem, já que a notificação não é assinada).
// ============================================================

export interface MlNotification {
  resource?: string;
  user_id?: number | string;
  topic?: string;
  application_id?: number | string;
  attempts?: number;
  sent?: string;
  received?: string;
}

/** Corpo da notificação (aceita o envelope cru ou já parseado). */
export function parseNotification(body: unknown): MlNotification | null {
  if (!body || typeof body !== "object") return null;
  const n = body as MlNotification;
  if (typeof n.resource !== "string") return null;
  return n;
}

export function notificationKey(n: MlNotification): string {
  return `${n.topic ?? "?"}:${n.resource}`;
}

interface MlLead {
  id?: string | number;
  item_id?: string;
  vis_item_id?: string;
  item?: { id?: string; permalink?: string };
  buyer?: { name?: string; email?: string; phone?: unknown; doc?: string; id?: number };
  name?: string;
  email?: string;
  phone?: unknown;
  contact_type?: string;
  channel?: string;
  action?: string;
  created_at?: string;
  date_created?: string;
  status?: string;
  message?: string;
  question?: string;
  text?: string;
  permalink?: string;
}

function phoneText(p: unknown): string | null {
  if (!p) return null;
  if (typeof p === "string") return p;
  if (typeof p === "object") {
    const o = p as { area_code?: string; number?: string; phone?: string };
    if (o.phone) return o.phone;
    const parts = [o.area_code, o.number].filter(Boolean).join("");
    return parts || null;
  }
  return null;
}

export function leadFromMl(raw: MlLead, fallbackId: string): InboundLead {
  const buyer = raw.buyer ?? {};
  return {
    kind: "lead",
    externalId: String(raw.id ?? fallbackId),
    externalListingId: raw.item_id ?? raw.vis_item_id ?? raw.item?.id ?? null,
    externalUrl: raw.item?.permalink ?? raw.permalink ?? null,
    channel: raw.contact_type ?? raw.action ?? raw.channel ?? null,
    name: buyer.name ?? raw.name ?? null,
    phone: phoneText(buyer.phone ?? raw.phone),
    email: buyer.email ?? raw.email ?? null,
    message: raw.message ?? raw.question ?? raw.text ?? null,
    createdAt: raw.created_at ?? raw.date_created ?? null,
  };
}

interface MlQuestion {
  id?: number | string;
  text?: string;
  item_id?: string;
  date_created?: string;
  from?: { id?: number };
}

export async function fetchLeadFromEvent(
  event: PortalEventRow,
  conn: Connection,
): Promise<InboundLead | null> {
  const n = parseNotification(event.body);
  if (!n) return null;
  const resource = n.resource!;

  if (n.topic === "questions" || resource.startsWith("/questions/")) {
    const q = await mlFetch<MlQuestion>(conn, resource);
    if (!q?.text) return null;
    return {
      kind: "lead",
      externalId: `question:${q.id ?? resource}`,
      externalListingId: q.item_id ?? null,
      externalUrl: null,
      channel: "question",
      name: null,
      phone: null,
      email: null,
      message: q.text,
      createdAt: q.date_created ?? null,
    };
  }

  // vis_leads: /vis/leads/{id}
  const lead = await mlFetch<MlLead>(conn, resource);
  if (!lead) return null;
  return leadFromMl(lead, resource.split("/").pop() ?? resource);
}

/** Pull de segurança: leads dos últimos dias da conta. */
export async function fetchRecentLeads(conn: Connection, since: Date): Promise<InboundLead[]> {
  const userId = conn.external_account_id;
  if (!userId) return [];
  const res = await mlFetch<{ results?: MlLead[]; leads?: MlLead[] } | MlLead[]>(
    conn,
    `/vis/users/${userId}/leads/buyers`,
    {
      query: {
        date_from: since.toISOString(),
        date_to: new Date().toISOString(),
        include_guest: "false",
      },
    },
  );
  const list = Array.isArray(res) ? res : (res?.results ?? res?.leads ?? []);
  return list
    .filter((l) => l && (l.id != null))
    .map((l) => leadFromMl(l, String(l.id)));
}
