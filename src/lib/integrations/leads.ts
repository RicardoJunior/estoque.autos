import type { SupabaseClient } from "@supabase/supabase-js";
import { sendLeadNotificationEmail } from "../email";
import { vehicleTitle } from "../format";
import { LEAD_SOURCE_LABELS, PORTAL_LABELS, type LeadSource, type PortalId } from "../types";
import type { InboundLead } from "./types";

// ============================================================
// Leads dos portais → tabela leads (type='portal'), com dedupe por
// (tenant, source, external_id), veículo resolvido pelo anúncio e
// notificação por e-mail/realtime iguais às da vitrine.
// ============================================================

export function sourceOf(portal: PortalId): LeadSource {
  return portal === "meta_catalog" ? "meta" : portal;
}

export async function ingestLead(
  admin: SupabaseClient,
  tenantId: string,
  portal: PortalId,
  lead: InboundLead,
  raw: unknown,
): Promise<{ leadId: string | null; created: boolean }> {
  const source = sourceOf(portal);

  let vehicleId: string | null = null;
  if (lead.externalListingId) {
    const { data } = await admin
      .from("portal_listings")
      .select("vehicle_id")
      .eq("tenant_id", tenantId)
      .eq("portal", portal)
      .eq("external_id", lead.externalListingId)
      .maybeSingle();
    vehicleId = data?.vehicle_id ?? null;
  }

  const { data, error } = await admin
    .from("leads")
    .insert({
      tenant_id: tenantId,
      vehicle_id: vehicleId,
      type: "portal",
      source,
      channel: lead.channel,
      external_id: lead.externalId,
      external_url: lead.externalUrl,
      name: lead.name?.slice(0, 120) ?? null,
      phone: lead.phone?.slice(0, 40) ?? null,
      email: lead.email?.slice(0, 160) ?? null,
      message: lead.message?.slice(0, 2000) ?? null,
      raw,
      status: "new",
      ...(lead.createdAt ? { created_at: lead.createdAt } : {}),
    })
    .select("id")
    .single();

  if (error) {
    // 23505 = já processado (reenvio do portal)
    if ((error as { code?: string }).code === "23505") {
      return { leadId: null, created: false };
    }
    throw new Error(`leads insert: ${error.message}`);
  }

  await notifyByEmail(admin, tenantId, data.id, vehicleId, lead, source);
  return { leadId: data.id, created: true };
}

async function notifyByEmail(
  admin: SupabaseClient,
  tenantId: string,
  leadId: string,
  vehicleId: string | null,
  lead: InboundLead,
  source: LeadSource,
): Promise<void> {
  try {
    const { data: tenant } = await admin
      .from("tenants")
      .select("name, email")
      .eq("id", tenantId)
      .maybeSingle();
    if (!tenant) return;

    let to: string | null = tenant.email?.trim() || null;
    if (!to) {
      const { data: owner } = await admin
        .from("memberships")
        .select("user_id")
        .eq("tenant_id", tenantId)
        .eq("role", "owner")
        .maybeSingle();
      if (owner) {
        const { data } = await admin.auth.admin.getUserById(owner.user_id);
        to = data.user?.email ?? null;
      }
    }
    if (!to) return;

    let title: string | null = null;
    if (vehicleId) {
      const { data: v } = await admin
        .from("vehicles")
        .select("brand, model, version, year_model")
        .eq("id", vehicleId)
        .maybeSingle();
      if (v) title = vehicleTitle(v);
    }

    const label = LEAD_SOURCE_LABELS[source];
    await sendLeadNotificationEmail({
      to,
      storeName: tenant.name,
      lead: {
        // portal pode mandar só um clique de WhatsApp sem nome
        name: lead.name?.trim() || `Interessado via ${label}`,
        phone: lead.phone,
        email: lead.email,
        message: [lead.message, lead.externalUrl ? `Anúncio: ${lead.externalUrl}` : null]
          .filter(Boolean)
          .join("\n\n") || null,
        vehicleTitle: title ? `${title} (${label})` : label,
      },
      leadId,
    });
  } catch (err) {
    console.error("notificação de lead de portal falhou:", err);
  }
}

export function portalLabel(portal: PortalId): string {
  return PORTAL_LABELS[portal];
}
