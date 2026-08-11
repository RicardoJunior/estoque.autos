"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { prepareLogo, prepareHeroImage, LogoError } from "@/lib/logo";
import { findGoogleFont } from "@/lib/google-fonts";
import { uploadPublic, removePublic, pathFromPublicUrl } from "@/lib/storage";
import {
  tenantCustomizationSchema,
  fieldErrorsFromZod,
} from "@/lib/validation";
import type {
  TemplateId,
  TenantColors,
  TenantHero,
  TenantSettings,
} from "@/lib/types";

const MAX_HERO_IMAGES = 6;

export interface SiteState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/** Salva template, cores, fontes e textos da loja. */
export async function updateSiteAction(
  _prev: SiteState,
  formData: FormData,
): Promise<SiteState> {
  const { tenant } = await requireStaff();

  const fontHead = formData.get("font_head");
  const fontBody = formData.get("font_body");
  const rawShowName = formData.get("show_name");

  const parsed = tenantCustomizationSchema.safeParse({
    template_id: formData.get("template_id") || undefined,
    colors: {
      primary: formData.get("primary") || tenant.colors.primary,
      accent: formData.get("accent") || tenant.colors.accent,
      // vazio = voltar ao fundo padrão do template
      background: formData.get("background") || undefined,
    },
    settings: {
      slogan: formData.get("slogan") || undefined,
      about: formData.get("about") || undefined,
      footer_text: formData.get("footer_text") || undefined,
      business_hours: formData.get("business_hours") || undefined,
      fonts:
        fontHead && fontBody
          ? { head: String(fontHead), body: String(fontBody) }
          : undefined,
      show_name: rawShowName == null ? undefined : rawShowName === "true",
      hero: {
        title: formData.get("hero_title") || undefined,
        subtitle: formData.get("hero_subtitle") || undefined,
        media: formData.get("hero_media") || undefined,
        video_url: formData.get("hero_video_url") || undefined,
      },
    },
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  // vídeo escolhido sem link não tem como renderizar
  const heroPatch = parsed.data.settings?.hero;
  if (heroPatch?.media === "video" && !heroPatch.video_url) {
    return {
      fieldErrors: {
        video_url: "Informe o link do vídeo (.mp4 ou .webm).",
      },
    };
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

  // hero: título/subtítulo vazios voltam ao padrão do template; as
  // imagens do carrossel (upload separado) são sempre preservadas
  update.settings.hero = {
    ...tenant.settings.hero,
    title: heroPatch?.title,
    subtitle: heroPatch?.subtitle,
    media: heroPatch?.media ?? tenant.settings.hero?.media,
    video_url: heroPatch?.video_url,
  };

  // fontes: o zod valida a FORMA; a existência é conferida no catálogo
  // (e o nome é canonizado — "playfair display" → "Playfair Display")
  const fonts = parsed.data.settings?.fonts;
  if (fonts) {
    const [head, body] = await Promise.all([
      findGoogleFont(fonts.head),
      findGoogleFont(fonts.body),
    ]);
    if (!head || !body) {
      return { error: "Fonte não reconhecida. Escolha uma fonte da lista." };
    }
    update.settings.fonts = { head: head.f, body: body.f };
    // o id legado deixa de valer quando há escolha nova
    delete update.settings.font;
  }

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

/**
 * Sobe o logo. Rasters chegam JÁ cortados/redimensionados pelo client
 * (canvas preserva transparência); SVG sobe como vetor, sanitizado.
 * Cada upload usa um path novo (cache limpo) e apaga o anterior.
 */
export async function uploadLogoAction(
  formData: FormData,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const { tenant } = await requireStaff();
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecione uma imagem." };
  }

  const supabase = await createClient();
  try {
    const logo = await prepareLogo(file);
    const path = `${tenant.id}/logo-${crypto.randomUUID().slice(0, 8)}.${logo.ext}`;
    const url = await uploadPublic(
      supabase,
      "logos",
      path,
      logo.body,
      logo.contentType,
    );

    const oldPath = tenant.logo_url
      ? pathFromPublicUrl(tenant.logo_url.split("?")[0], "logos")
      : null;

    const { error } = await supabase
      .from("tenants")
      .update({ logo_url: url })
      .eq("id", tenant.id);
    if (error) {
      await removePublic(supabase, "logos", [path]);
      return { ok: false, error: "Não foi possível salvar o logo." };
    }

    if (oldPath && oldPath !== path) {
      await removePublic(supabase, "logos", [oldPath]);
    }

    revalidatePath("/admin/site");
    revalidatePath(`/${tenant.slug}`);
    return { ok: true, url };
  } catch (err) {
    if (err instanceof LogoError) return { ok: false, error: err.message };
    return { ok: false, error: "Não foi possível processar a imagem." };
  }
}

/**
 * Sobe imagens do carrossel da hero (já redimensionadas no client).
 * Como o logo: upload imediato, path único, guarda em settings.hero.
 */
export async function uploadHeroImagesAction(
  formData: FormData,
): Promise<{ ok: boolean; hero?: TenantHero; error?: string }> {
  const { tenant } = await requireStaff();
  const files = formData
    .getAll("images")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { ok: false, error: "Selecione imagens." };

  const existingHero: TenantHero = tenant.settings.hero ?? {};
  const existing = existingHero.images ?? [];
  const room = MAX_HERO_IMAGES - existing.length;
  if (room <= 0) {
    return { ok: false, error: `Máximo de ${MAX_HERO_IMAGES} imagens.` };
  }

  const supabase = await createClient();
  const added: NonNullable<TenantHero["images"]> = [];
  try {
    for (const file of files.slice(0, room)) {
      const img = await prepareHeroImage(file);
      const id = crypto.randomUUID().slice(0, 8);
      const path = `${tenant.id}/hero-${id}.${img.ext}`;
      const url = await uploadPublic(
        supabase,
        "logos",
        path,
        img.body,
        img.contentType,
      );
      added.push({ id, path, url });
    }
  } catch (err) {
    if (added.length === 0) {
      return {
        ok: false,
        error:
          err instanceof LogoError
            ? err.message
            : "Não foi possível enviar as imagens.",
      };
    }
    // sobe o que deu certo; o restante o lojista tenta de novo
  }

  const hero: TenantHero = {
    ...existingHero,
    // subir imagens já ativa o carrossel — menos um passo para o lojista
    media: "images",
    images: [...existing, ...added],
  };
  const { error } = await supabase
    .from("tenants")
    .update({ settings: { ...tenant.settings, hero } })
    .eq("id", tenant.id);
  if (error) {
    await removePublic(supabase, "logos", added.map((a) => a.path));
    return { ok: false, error: "Não foi possível salvar as imagens." };
  }

  revalidatePath("/admin/site");
  revalidatePath(`/${tenant.slug}`);
  return { ok: true, hero };
}

export async function removeHeroImageAction(
  id: string,
): Promise<{ ok: boolean; hero?: TenantHero }> {
  const { tenant } = await requireStaff();
  const existingHero: TenantHero = tenant.settings.hero ?? {};
  const images = existingHero.images ?? [];
  const target = images.find((i) => i.id === id);
  if (!target) return { ok: true, hero: existingHero };

  const supabase = await createClient();
  const hero: TenantHero = {
    ...existingHero,
    images: images.filter((i) => i.id !== id),
  };
  const { error } = await supabase
    .from("tenants")
    .update({ settings: { ...tenant.settings, hero } })
    .eq("id", tenant.id);
  if (error) return { ok: false };

  await removePublic(supabase, "logos", [target.path]);
  revalidatePath("/admin/site");
  revalidatePath(`/${tenant.slug}`);
  return { ok: true, hero };
}

export async function removeLogoAction(): Promise<void> {
  const { tenant } = await requireStaff();
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
