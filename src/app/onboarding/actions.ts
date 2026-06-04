"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { processLogo } from "@/lib/images";
import { uploadPublic } from "@/lib/storage";
import {
  createTenantSchema,
  fieldErrorsFromZod,
  slugSchema,
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

  const customization = tenantCustomizationSchema.safeParse({
    template_id: formData.get("template_id") || undefined,
    colors: {
      primary: formData.get("primary") || DEFAULT_COLORS.primary,
      accent: formData.get("accent") || DEFAULT_COLORS.accent,
    },
    settings: {
      font: formData.get("font") || undefined,
    },
  });

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

  // 2) logo opcional
  let logoUrl: string | null = null;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    try {
      const buf = await processLogo(logo);
      logoUrl = await uploadPublic(
        supabase,
        "logos",
        `${tenant.id}/logo.webp`,
        buf,
      );
    } catch {
      // logo é opcional — segue sem ela em caso de falha
    }
  }

  // 3) template + cores + fonte + logo
  const update: Record<string, unknown> = {};
  if (customization.success) {
    if (customization.data.template_id)
      update.template_id = customization.data.template_id as TemplateId;
    if (customization.data.colors) update.colors = customization.data.colors;
    if (customization.data.settings) update.settings = customization.data.settings;
  }
  if (logoUrl) update.logo_url = logoUrl;

  if (Object.keys(update).length > 0) {
    await supabase.from("tenants").update(update).eq("id", tenant.id);
  }

  redirect(`/onboarding/pronto?slug=${encodeURIComponent(base.data.slug)}`);
}
