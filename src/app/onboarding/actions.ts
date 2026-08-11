"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { prepareLogo } from "@/lib/logo";
import { findGoogleFont } from "@/lib/google-fonts";
import { uploadPublic } from "@/lib/storage";
import {
  createTenantSchema,
  fieldErrorsFromZod,
  slugSchema,
  tenantContactSchema,
  tenantCustomizationSchema,
} from "@/lib/validation";
import { DEFAULT_COLORS, type TemplateId } from "@/lib/types";

export interface SlugCheck {
  available: boolean;
  reason?: "invalid" | "reserved" | "taken";
}

export async function checkSlugAction(slug: string): Promise<SlugCheck> {
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) return { available: false, reason: "invalid" };

  const supabase = await createClient();

  const { data: reserved } = await supabase
    .from("reserved_slugs")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();
  if (reserved) return { available: false, reason: "reserved" };

  // storefronts é a view pública (anon-readable); consulta sem expor a tabela
  const { data: taken } = await supabase
    .from("storefronts")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();
  if (taken) return { available: false, reason: "taken" };

  return { available: true };
}

export interface OnboardingState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

const RPC_ERROR_MESSAGES: Record<string, string> = {
  slug_taken: "Essa URL já está em uso. Escolha outra.",
  slug_reserved: "Essa URL é reservada. Escolha outra.",
  already_has_tenant: "Você já tem uma loja.",
  not_authenticated: "Sua sessão expirou. Entre novamente.",
};

export async function completeOnboardingAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.tenant) redirect("/admin");

  const base = createTenantSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    phone: formData.get("phone") || undefined,
    whatsapp: formData.get("whatsapp") || undefined,
    email: formData.get("email") || undefined,
  });
  if (!base.success) {
    return { fieldErrors: fieldErrorsFromZod(base.error) };
  }

  const fontHead = formData.get("font_head");
  const fontBody = formData.get("font_body");
  const customization = tenantCustomizationSchema.safeParse({
    template_id: formData.get("template_id") || undefined,
    colors: {
      primary: formData.get("primary") || DEFAULT_COLORS.primary,
      accent: formData.get("accent") || DEFAULT_COLORS.accent,
    },
    settings: {
      business_hours: formData.get("business_hours") || undefined,
      fonts:
        fontHead && fontBody
          ? { head: String(fontHead), body: String(fontBody) }
          : undefined,
    },
  });
  // horário/fonte digitados errados devem voltar para o lojista ANTES
  // de criar a loja (o RPC não é idempotente para o mesmo slug)
  if (!customization.success) {
    return { fieldErrors: fieldErrorsFromZod(customization.error) };
  }

  // endereço (opcional): só entra se algum campo foi preenchido
  const contact = tenantContactSchema.safeParse({
    address: {
      cep: formData.get("cep") || undefined,
      street: formData.get("street") || undefined,
      number: formData.get("number") || undefined,
      neighborhood: formData.get("neighborhood") || undefined,
      city: formData.get("city") || undefined,
      state: formData.get("state") || undefined,
    },
  });
  if (!contact.success) {
    return { fieldErrors: fieldErrorsFromZod(contact.error) };
  }
  const addressEntries = Object.entries(contact.data.address ?? {}).filter(
    ([, v]) => typeof v === "string" && v.trim(),
  );
  const address =
    addressEntries.length > 0 ? Object.fromEntries(addressEntries) : null;

  const supabase = await createClient();

  // 1) cria a loja e vincula o usuário (RPC atômica)
  const { data: tenant, error: rpcError } = await supabase
    .rpc("create_tenant", {
      p_slug: base.data.slug,
      p_name: base.data.name,
      p_phone: base.data.phone ?? null,
      p_whatsapp: base.data.whatsapp ?? null,
      p_email: base.data.email || null,
    })
    .single<{ id: string }>();

  if (rpcError || !tenant) {
    const key = (rpcError?.message ?? "").trim();
    return {
      error: RPC_ERROR_MESSAGES[key] ?? "Não foi possível criar a loja.",
    };
  }

  // 2) logo opcional — rasters já chegam cortados do client (PNG);
  // SVG sobe como vetor sanitizado. Nada de Cloudflare Images aqui.
  let logoUrl: string | null = null;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    try {
      const prepared = await prepareLogo(logo);
      logoUrl = await uploadPublic(
        supabase,
        "logos",
        `${tenant.id}/logo-${crypto.randomUUID().slice(0, 8)}.${prepared.ext}`,
        prepared.body,
        prepared.contentType,
      );
    } catch {
      // logo é opcional — segue sem ela em caso de falha
    }
  }

  // 3) template + cores + fontes + endereço + logo
  const update: Record<string, unknown> = {};
  if (customization.data.template_id)
    update.template_id = customization.data.template_id as TemplateId;
  if (customization.data.colors) update.colors = customization.data.colors;
  const settings = customization.data.settings ?? {};
  // fontes: confere no catálogo e canoniza o nome; se alguma for
  // desconhecida, segue sem fontes (onboarding não deve travar aqui)
  if (settings.fonts) {
    const [head, body] = await Promise.all([
      findGoogleFont(settings.fonts.head),
      findGoogleFont(settings.fonts.body),
    ]);
    settings.fonts = head && body ? { head: head.f, body: body.f } : undefined;
  }
  if (Object.keys(settings).length > 0) update.settings = settings;
  if (address) update.address = address;
  if (logoUrl) update.logo_url = logoUrl;

  if (Object.keys(update).length > 0) {
    await supabase.from("tenants").update(update).eq("id", tenant.id);
  }

  redirect(`/onboarding/pronto?slug=${encodeURIComponent(base.data.slug)}`);
}
