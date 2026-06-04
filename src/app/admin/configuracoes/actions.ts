"use server";

import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  tenantContactSchema,
  customDomainSchema,
  fieldErrorsFromZod,
} from "@/lib/validation";
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
  const { tenant } = await requireTenant();

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
  const { tenant } = await requireTenant();

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
  const { tenant } = await requireTenant();
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
