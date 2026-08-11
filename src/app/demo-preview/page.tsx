import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontView } from "@/components/storefront/registry";
import {
  demoStorefront,
  filterDemoVehicles,
  isTemplateId,
} from "@/lib/demo-store";
import { resolveStorefrontFonts, findGoogleFont } from "@/lib/google-fonts";
import {
  themeVars,
  fontVars,
  surfaceVars,
} from "@/components/storefront/theme";
import { HERO_MEDIA_TYPES, type HeroMediaType } from "@/lib/types";

/**
 * Prévia AO VIVO usada pelo admin e pelo onboarding dentro de um
 * <iframe>: renderiza o template REAL com a loja demo + overrides de
 * marca vindos da query. Como a URL é pública, todo override passa por
 * validação estrita (hex, catálogo de fontes, origem dos assets) —
 * nada chega cru em style/src.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

const HEX = /^#[0-9a-fA-F]{6}$/;
const VIDEO = /^https:\/\/\S+\.(mp4|webm)(\?\S*)?$/i;

type SP = Record<string, string | string[] | undefined>;

function str(sp: SP, key: string, max = 200): string | undefined {
  const v = sp[key];
  return typeof v === "string" && v.trim() ? v.slice(0, max) : undefined;
}

function hex(sp: SP, key: string): string | undefined {
  const v = str(sp, key, 7);
  return v && HEX.test(v) ? v : undefined;
}

/** Só assets nossos (storage do Supabase, /public) ou blob: do iframe. */
function safeAssetUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  if (raw.startsWith("blob:")) return raw;
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (supabase && raw.startsWith(`${supabase}/storage/v1/object/public/`)) {
    return raw;
  }
  return undefined;
}

export default async function DemoPreviewPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const template = str(sp, "template", 20);
  if (!template || !isTemplateId(template)) notFound();

  const store = demoStorefront(template);

  const name = str(sp, "name", 80);
  if (name) store.name = name;
  const slogan = str(sp, "slogan", 120);
  if (slogan) store.settings.slogan = slogan;

  const primary = hex(sp, "primary");
  const accent = hex(sp, "accent");
  if (primary) store.colors.primary = primary;
  if (accent) store.colors.accent = accent;
  store.colors.background = hex(sp, "background");

  const logo = safeAssetUrl(str(sp, "logo", 500));
  store.logo_url = logo ?? null;
  store.settings.show_name = str(sp, "show_name", 5) === "true";

  const head = str(sp, "head", 80);
  const body = str(sp, "body", 80);
  if (head && body) {
    const [h, b] = await Promise.all([findGoogleFont(head), findGoogleFont(body)]);
    if (h && b) store.settings.fonts = { head: h.f, body: b.f };
  }

  // hero: textos + mídia (imagens em lista separada por vírgula)
  const media = str(sp, "hero_media", 10);
  const heroImages = (str(sp, "hero_imgs", 3000) ?? "")
    .split(",")
    .map((u) => safeAssetUrl(u.trim()))
    .filter((u): u is string => Boolean(u))
    .slice(0, 6)
    .map((url, i) => ({ id: `p${i}`, path: "", url }));
  const video = str(sp, "hero_video", 300);
  store.settings.hero = {
    ...store.settings.hero,
    title: str(sp, "hero_title", 90) ?? store.settings.hero?.title,
    subtitle: str(sp, "hero_subtitle", 200) ?? store.settings.hero?.subtitle,
    media:
      media && (HERO_MEDIA_TYPES as readonly string[]).includes(media)
        ? (media as HeroMediaType)
        : store.settings.hero?.media,
    video_url: video && VIDEO.test(video) ? video : undefined,
    images: heroImages.length > 0 ? heroImages : store.settings.hero?.images,
  };

  const fonts = await resolveStorefrontFonts(store.settings);

  return (
    <div
      style={{
        ...themeVars(store.colors),
        ...surfaceVars(store.colors.background),
        ...fontVars(fonts),
        fontFamily: "var(--sf-font)",
      }}
    >
      {fonts.href && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link rel="stylesheet" href={fonts.href} precedence="default" />
        </>
      )}
      <StorefrontView store={store} vehicles={filterDemoVehicles()} />
    </div>
  );
}
