"use server";

import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { processLogo } from "@/lib/images";
import { uploadPublic, removePublic, pathFromPublicUrl } from "@/lib/storage";
import {
  tenantCustomizationSchema,
  fieldErrorsFromZod,
} from "@/lib/validation";
import type { TemplateId, TenantColors, TenantSettings } from "@/lib/types";

export interface SiteState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/** Salva template, cores e textos da loja. */
export async function updateSiteAction(
  _prev: SiteState,
  formData: FormData,
): Promise<SiteState> {
  const { tenant } = await requireTenant();

  const parsed = tenantCustomizationSchema.safeParse({
    template_id: formData.get("template_id") || undefined,
    colors: {
      primary: formData.get("primary") || tenant.colors.primary,
      accent: formData.get("accent") || tenant.colors.accent,
    },
    settings: {
      slogan: formData.get("slogan") || undefined,
      about: formData.get("about") || undefined,
      footer_text: formData.get("footer_text") || undefined,
      business_hours: formData.get("business_hours") || undefined,
    },
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const update: {
    template_id?: TemplateId;
    colors?: TenantColors;
    settings?: TenantSettings;
  } = {};
  if (parsed.data.template_id) update.template_id = parsed.data.template_id;
  if (parsed.data.colors) update.colors = parsed.data.colors;
  // merge dos textos com o que já existe
  update.settings = { ...tenant.settings, ...parsed.data.settings };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update(update)
    .eq("id", tenant.id);

  if (error) return { error: "Não foi possível salvar." };

  revalidatePath("/admin/site");
  revalidatePath(`/${tenant.slug}`);
  return { ok: true };
}

export async function uploadLogoAction(
  formData: FormData,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const { tenant } = await requireTenant();
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecione uma imagem." };
  }

  const supabase = await createClient();
  try {
    const buf = await processLogo(file);
    const url = await uploadPublic(
      supabase,
      "logos",
      `${tenant.id}/logo.webp`,
      buf,
    );
    // cache-bust: o path é fixo (upsert), então acrescenta versão
    const versioned = `${url}?v=${Date.now()}`;
    await supabase
      .from("tenants")
      .update({ logo_url: versioned })
      .eq("id", tenant.id);
    revalidatePath("/admin/site");
    revalidatePath(`/${tenant.slug}`);
    return { ok: true, url: versioned };
  } catch {
    return { ok: false, error: "Não foi possível processar a imagem." };
  }
}

export async function removeLogoAction(): Promise<void> {
  const { tenant } = await requireTenant();
  const supabase = await createClient();

  if (tenant.logo_url) {
    const path = pathFromPublicUrl(
      tenant.logo_url.split("?")[0],
      "logos",
    );
    if (path) await removePublic(supabase, "logos", [path]);
  }
  await supabase.from("tenants").update({ logo_url: null }).eq("id", tenant.id);
  revalidatePath("/admin/site");
  revalidatePath(`/${tenant.slug}`);
}
