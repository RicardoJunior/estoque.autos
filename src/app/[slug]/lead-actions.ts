"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendLeadNotificationEmail } from "@/lib/email";
import { vehicleTitle } from "@/lib/format";
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
 * Avisa o lojista por e-mail sobre o lead novo. Destinatário:
 * e-mail de contato do tenant e, se vazio, o e-mail de login do
 * dono (profiles → auth). O admin client entra SÓ nessa leitura;
 * o veículo vem da view pública com o client anônimo. Erro só
 * loga — a notificação nunca quebra o lead já criado.
 */
async function notifyStoreByEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vehicleId: string,
  leadId: string,
  lead: { name: string; phone?: string; email?: string; message?: string },
): Promise<void> {
  try {
    const { data: vehicle } = await supabase
      .from("vehicles_public")
      .select("tenant_id, brand, model, version, year_model")
      .eq("id", vehicleId)
      .maybeSingle();
    if (!vehicle) return;

    const admin = createAdminClient();
    const { data: tenant } = await admin
      .from("tenants")
      .select("name, email")
      .eq("id", vehicle.tenant_id)
      .maybeSingle();
    if (!tenant) return;

    let to: string | null = tenant.email?.trim() || null;
    if (!to) {
      // dono atual via memberships (transferível — profiles.tenant_id é legado)
      const { data: owner } = await admin
        .from("memberships")
        .select("user_id")
        .eq("tenant_id", vehicle.tenant_id)
        .eq("role", "owner")
        .maybeSingle();
      if (owner) {
        const { data } = await admin.auth.admin.getUserById(owner.user_id);
        to = data.user?.email ?? null;
      }
    }
    if (!to) return;

    await sendLeadNotificationEmail({
      to,
      storeName: tenant.name,
      lead: { ...lead, vehicleTitle: vehicleTitle(vehicle) },
      leadId,
    });
  } catch (err) {
    console.error("Notificação de lead por e-mail falhou:", err);
  }
}

/**
 * Cria um lead público. Usa a RPC create_lead (whitelist server-side:
 * tenant derivado do veículo, status/notes forçados — anon nunca forja).
 * Funciona para o formulário de proposta E para cliques de WhatsApp/telefone.
 */
/**
 * O diálogo envia o carro da troca em campos estruturados
 * (trade_brand/model/year/color/km) — compõe o texto único que a
 * coluna trade_vehicle guarda: "Fiat Argo 2019 · Prata · 45.000 km".
 */
function tradeVehicleText(formData: FormData): string | undefined {
  const get = (key: string) => String(formData.get(key) ?? "").trim();
  const name = [get("trade_brand"), get("trade_model")]
    .filter(Boolean)
    .join(" ");
  const km = get("trade_km").replace(/\D/g, "");
  const parts = [
    [name, get("trade_year")].filter(Boolean).join(" "),
    get("trade_color"),
    km ? `${Number(km).toLocaleString("pt-BR")} km` : "",
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ").slice(0, 200) : undefined;
}

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
    trade_vehicle:
      formData.get("trade_vehicle") || tradeVehicleText(formData),
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

  const { data: leadId, error } = await supabase.rpc("create_lead", {
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

  // notificação por e-mail DEPOIS da resposta (after): o visitante
  // não espera o Resend; lead sem nome (clique) não gera aviso.
  const name = parsed.data.name?.trim();
  if (leadId && name) {
    const { vehicle_id, phone, email, message } = parsed.data;
    after(() =>
      notifyStoreByEmail(supabase, vehicle_id, String(leadId), {
        name,
        phone,
        email: email || undefined,
        message,
      }),
    );
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
