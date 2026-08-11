"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getLatestSubscription,
  getSession,
  getTenantSubscription,
  requireStaff,
} from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import {
  tenantContactSchema,
  customDomainSchema,
  fieldErrorsFromZod,
  socialSettingsSchema,
  trackingSettingsSchema,
} from "@/lib/validation";
import { SOCIAL_NETWORKS } from "@/lib/types";
import { normalizeDomain, verifyDomainPointing } from "@/lib/domain";
import {
  createCustomHostname,
  getCustomHostnameStatus,
} from "@/lib/cloudflare-saas";

export interface ContactState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function updateContactAction(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const { tenant } = await requireStaff();

  const parsed = tenantContactSchema.safeParse({
    name: formData.get("name") || undefined,
    phone: formData.get("phone") || null,
    whatsapp: formData.get("whatsapp") || null,
    email: formData.get("email") || "",
    address: {
      cep: formData.get("cep") || undefined,
      street: formData.get("street") || undefined,
      number: formData.get("number") || undefined,
      complement: formData.get("complement") || undefined,
      neighborhood: formData.get("neighborhood") || undefined,
      city: formData.get("city") || undefined,
      state: formData.get("state") || undefined,
    },
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      name: parsed.data.name ?? tenant.name,
      phone: parsed.data.phone || null,
      whatsapp: parsed.data.whatsapp || null,
      email: parsed.data.email || null,
      address: parsed.data.address ?? null,
    })
    .eq("id", tenant.id);

  if (error) return { error: "Não foi possível salvar." };

  revalidatePath("/admin/configuracoes");
  revalidatePath(`/${tenant.slug}`);
  return { ok: true };
}

// ============================================================
// Marketing (pixels Pro + redes sociais do footer)
// ============================================================

export interface MarketingState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/** remove chaves vazias; devolve undefined se nada sobrar */
function compact(
  obj: Record<string, string | undefined>,
): Record<string, string> | undefined {
  const entries = Object.entries(obj).filter(
    (e): e is [string, string] => !!e[1],
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export async function updateMarketingAction(
  _prev: MarketingState,
  formData: FormData,
): Promise<MarketingState> {
  const { tenant } = await requireStaff();

  const parsedTracking = trackingSettingsSchema.safeParse({
    facebook_pixel: String(formData.get("facebook_pixel") ?? "").trim(),
    tiktok_pixel: String(formData.get("tiktok_pixel") ?? "").trim(),
    google_analytics: String(formData.get("google_analytics") ?? "").trim(),
  });
  const parsedSocial = socialSettingsSchema.safeParse(
    Object.fromEntries(
      SOCIAL_NETWORKS.map((n) => [n, String(formData.get(`social_${n}`) ?? "").trim()]),
    ),
  );
  if (!parsedTracking.success) {
    return { fieldErrors: fieldErrorsFromZod(parsedTracking.error) };
  }
  if (!parsedSocial.success) {
    return { fieldErrors: fieldErrorsFromZod(parsedSocial.error) };
  }

  const tracking = compact(parsedTracking.data);
  // pixels são recurso Pro — no básico, só aceita LIMPAR (o layout
  // público também não renderiza, dupla garantia)
  if (tracking && tenant.plan !== "pro") {
    return {
      error:
        "Pixels de rastreamento são um recurso do plano Pro. Faça upgrade em Configurações → Assinatura.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      settings: {
        ...tenant.settings,
        tracking,
        social: compact(parsedSocial.data),
      },
    })
    .eq("id", tenant.id);
  if (error) return { error: "Não foi possível salvar." };

  revalidatePath("/admin/configuracoes");
  revalidatePath(`/${tenant.slug}`);
  return { ok: true };
}

// ============================================================
// Assinatura (Stripe Billing Portal)
// ============================================================

/**
 * Abre o Stripe Billing Portal do usuário logado: cancelar, trocar
 * cartão, pagar fatura pendente, baixar faturas, mudar de plano.
 * Sem assinatura gravada → volta pro fluxo de contratação.
 */
export async function createBillingPortalAction() {
  // getSession (e não requireTenant): o portal precisa abrir TAMBÉM com a
  // assinatura da loja suspensa (past_due) — requireTenant redirecionaria.
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/configuracoes");
  if (session.tenant && session.role !== "owner") redirect("/admin");

  const sub = session.tenant
    ? await getTenantSubscription(session.tenant.id)
    : await getLatestSubscription();
  if (!sub) redirect("/cadastro/assinatura");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const portal = await getStripe().billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${appUrl}/admin/configuracoes`,
    locale: "pt-BR",
    // config com troca de plano/cancelamento (scripts/stripe-portal-setup.ts)
    configuration: process.env.STRIPE_PORTAL_CONFIGURATION_ID || undefined,
  });
  redirect(portal.url);
}

// ============================================================
// Domínio próprio
// ============================================================

export interface DomainState {
  ok?: boolean;
  error?: string;
  fieldError?: string;
  /** mensagem da etapa de verificação de apontamento */
  verify?: { active: boolean; message: string };
}

/** Salva/atualiza o domínio próprio (normaliza + valida + registra CF). */
export async function saveDomainAction(
  _prev: DomainState,
  formData: FormData,
): Promise<DomainState> {
  const { tenant } = await requireStaff();
  if (tenant.plan !== "pro") {
    return {
      error:
        "Domínio próprio é um recurso do plano Pro. Faça upgrade em Configurações → Assinatura.",
    };
  }

  const raw = String(formData.get("domain") ?? "");
  const domain = normalizeDomain(raw);

  // domínio vazio = remover apontamento
  if (!domain) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("tenants")
      .update({ custom_domain: null, custom_domain_status: "pending" })
      .eq("id", tenant.id);
    if (error) return { error: "Não foi possível remover o domínio." };
    revalidatePath("/admin/configuracoes");
    return { ok: true };
  }

  const parsed = customDomainSchema.safeParse(domain);
  if (!parsed.success) {
    return { fieldError: fieldErrorsFromZod(parsed.error).domain ?? "Domínio inválido." };
  }

  // Cloudflare for SaaS (opcional): registra o custom hostname. Se os
  // env não estiverem presentes, segue só com instruções DNS.
  const cf = await createCustomHostname(parsed.data);
  const status = cf.status === "active" ? "active" : "pending";

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({ custom_domain: parsed.data, custom_domain_status: status })
    .eq("id", tenant.id);

  if (error) {
    // 23505 = unique_violation (domínio já usado por outra loja)
    if ((error as { code?: string }).code === "23505") {
      return { fieldError: "Este domínio já está em uso por outra loja." };
    }
    return { error: "Não foi possível salvar o domínio." };
  }

  revalidatePath("/admin/configuracoes");
  return { ok: true };
}

/** Verifica o apontamento (CF custom hostname ou DNS/HTTP) e marca ativo. */
export async function verifyDomainAction(
  _prev: DomainState,
  _formData: FormData,
): Promise<DomainState> {
  const { tenant } = await requireStaff();
  if (tenant.plan !== "pro") {
    return {
      verify: {
        active: false,
        message: "Domínio próprio é um recurso do plano Pro.",
      },
    };
  }
  const domain = tenant.custom_domain;
  if (!domain) {
    return { verify: { active: false, message: "Nenhum domínio configurado." } };
  }

  // 1) Se a integração Cloudflare estiver ativa, ela é a fonte da verdade.
  const cf = await getCustomHostnameStatus(domain);
  let active = cf.configured ? cf.status === "active" : false;

  // 2) Sem Cloudflare (ou ainda pendente lá), confere DNS/HTTP direto.
  if (!active) {
    active = await verifyDomainPointing(domain);
  }

  if (active && tenant.custom_domain_status !== "active") {
    const supabase = await createClient();
    await supabase
      .from("tenants")
      .update({ custom_domain_status: "active" })
      .eq("id", tenant.id);
    revalidatePath("/admin/configuracoes");
  }

  return {
    verify: {
      active,
      message: active
        ? "Apontamento confirmado! Seu domínio está ativo."
        : "Ainda não detectamos o apontamento. A propagação de DNS pode levar até algumas horas.",
    },
  };
}
