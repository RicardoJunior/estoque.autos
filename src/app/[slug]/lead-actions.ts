"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { publicLeadSchema, fieldErrorsFromZod } from "@/lib/validation";

export interface LeadFormState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function detectDevice(ua: string): string {
  return /mobile|android|iphone|ipad/i.test(ua) ? "mobile" : "desktop";
}

/** IP do cliente quando há proxy confiável à frente (best-effort). */
function clientIp(h: Headers): string | null {
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip");
}

/**
 * Cria um lead público. Usa a RPC create_lead (whitelist server-side:
 * tenant derivado do veículo, status/notes forçados — anon nunca forja).
 * Funciona para o formulário de proposta E para cliques de WhatsApp/telefone.
 */
export async function submitLeadAction(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const parsed = publicLeadSchema.safeParse({
    vehicle_id: formData.get("vehicle_id"),
    type: formData.get("type"),
    name: formData.get("name") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    message: formData.get("message") || undefined,
    proposal_value: formData.get("proposal_value") || undefined,
    trade_vehicle: formData.get("trade_vehicle") || undefined,
    website: formData.get("website") || undefined, // honeypot
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  // honeypot preenchido = bot. Finge sucesso, não grava.
  if (parsed.data.website) return { ok: true };

  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  const supabase = await createClient();

  const utm: Record<string, string> = {};
  for (const k of ["source", "medium", "campaign"]) {
    const v = formData.get(`utm_${k}`);
    if (v) utm[k] = String(v);
  }

  const { error } = await supabase.rpc("create_lead", {
    p_vehicle_id: parsed.data.vehicle_id,
    p_type: parsed.data.type,
    p_name: parsed.data.name ?? null,
    p_phone: parsed.data.phone ?? null,
    p_email: parsed.data.email || null,
    p_message: parsed.data.message ?? null,
    p_proposal_value: parsed.data.proposal_value ?? null,
    p_trade_vehicle: parsed.data.trade_vehicle ?? null,
    p_utm: Object.keys(utm).length ? utm : null,
    p_device: detectDevice(ua),
    p_client_ip: clientIp(h),
  });

  if (error) {
    if (error.message?.includes("rate_limited")) {
      return { error: "Muitas tentativas. Aguarde alguns minutos." };
    }
    return { error: "Não foi possível enviar. Tente novamente." };
  }
  return { ok: true };
}

/**
 * Registra um lead de clique (WhatsApp/telefone) — sem formulário.
 * Na v1 esses leads eram perdidos porque o backend exigia e-mail.
 * Aqui a RPC aceita clique sem dados de contato.
 */
export async function logClickLeadAction(
  vehicleId: string,
  type: "whatsapp" | "phone",
): Promise<void> {
  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  const supabase = await createClient();
  // erros (inclui rate_limited) são silenciosos: não devem travar o
  // redirecionamento do usuário para o WhatsApp/telefone.
  await supabase.rpc("create_lead", {
    p_vehicle_id: vehicleId,
    p_type: type,
    p_name: null,
    p_phone: null,
    p_email: null,
    p_message: null,
    p_proposal_value: null,
    p_trade_vehicle: null,
    p_utm: null,
    p_device: detectDevice(ua),
    p_client_ip: clientIp(h),
  });
}
