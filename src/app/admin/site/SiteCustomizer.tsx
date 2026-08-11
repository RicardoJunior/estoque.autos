"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { TEMPLATES } from "@/lib/templates";
import type { HeroMediaType, TemplateId, TenantHero } from "@/lib/types";
import { selectedStoreFonts, type FontPairing } from "@/lib/fonts";
import {
  getFontCatalog,
  previewHref,
  type GoogleFont,
} from "@/lib/google-fonts";
import { injectFontCss } from "@/lib/font-css";
import { DemoPreview } from "@/components/brand/DemoPreview";
import { ColorField } from "@/components/brand/ColorField";
import { FontPicker } from "@/components/brand/FontPicker";
import { FontPairings } from "@/components/brand/FontPairings";
import { LogoUploader } from "@/components/brand/LogoUploader";
import { HeroImagesField } from "@/components/brand/HeroImagesField";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  updateSiteAction,
  uploadLogoAction,
  removeLogoAction,
  uploadHeroImagesAction,
  removeHeroImageAction,
  type SiteState,
} from "./actions";
import type { Storefront } from "@/lib/public";

const HERO_MEDIA_OPTIONS: { id: HeroMediaType; label: string; hint: string }[] = [
  { id: "none", label: "Padrão do template", hint: "Fundo desenhado pelo template" },
  { id: "images", label: "Carrossel de fotos", hint: "Suas fotos girando no fundo" },
  { id: "video", label: "Vídeo", hint: "Um vídeo mudo em loop" },
];

export function SiteCustomizer({ store }: { store: Storefront }) {
  const router = useRouter();
  const [template, setTemplate] = useState<TemplateId>(store.template_id);
  const [primary, setPrimary] = useState(store.colors.primary);
  const [accent, setAccent] = useState(store.colors.accent);
  const [background, setBackground] = useState<string | null>(
    store.colors.background ?? null,
  );

  const initialFonts = selectedStoreFonts(store.settings);
  const [fontHead, setFontHead] = useState(initialFonts.head);
  const [fontBody, setFontBody] = useState(initialFonts.body);
  const [sameFont, setSameFont] = useState(
    initialFonts.head === initialFonts.body,
  );
  const effectiveBody = sameFont ? fontHead : fontBody;

  const [logoUrl, setLogoUrl] = useState<string | null>(store.logo_url);
  const [showName, setShowName] = useState(store.settings.show_name === true);

  // hero
  const initialHero = store.settings.hero;
  const [heroTitle, setHeroTitle] = useState(initialHero?.title ?? "");
  const [heroSubtitle, setHeroSubtitle] = useState(initialHero?.subtitle ?? "");
  const [heroMedia, setHeroMedia] = useState<HeroMediaType>(
    initialHero?.media ?? "none",
  );
  const [heroVideoUrl, setHeroVideoUrl] = useState(
    initialHero?.video_url ?? "",
  );
  const [heroImages, setHeroImages] = useState<
    NonNullable<TenantHero["images"]>
  >(initialHero?.images ?? []);

  // textos controlados: o React 19 reseta campos não-controlados do form
  // após a action — num save que falha, o lojista perderia o que digitou
  const [slogan, setSlogan] = useState(store.settings.slogan ?? "");
  const [about, setAbout] = useState(store.settings.about ?? "");
  const [footerText, setFooterText] = useState(store.settings.footer_text ?? "");
  const [businessHours, setBusinessHours] = useState(
    store.settings.business_hours ?? "",
  );

  // catálogo completo do Google Fonts (chunk separado, carrega 1x)
  const [catalog, setCatalog] = useState<GoogleFont[] | null>(null);
  useEffect(() => {
    let active = true;
    getFontCatalog().then((c) => {
      if (active) setCatalog(c);
    });
    return () => {
      active = false;
    };
  }, []);

  // fontes escolhidas carregam completas (pesos reais) para a prévia
  useEffect(() => {
    if (!catalog) return;
    for (const family of [fontHead, effectiveBody]) {
      const meta = catalog.find(
        (f) => f.f.toLowerCase() === family.toLowerCase(),
      );
      if (meta) injectFontCss(previewHref(meta));
    }
  }, [catalog, fontHead, effectiveBody]);

  const [state, formAction] = useActionState<SiteState, FormData>(
    updateSiteAction,
    {},
  );

  function applyPairing(p: FontPairing) {
    setFontHead(p.head);
    setFontBody(p.body);
    setSameFont(p.head === p.body);
  }

  async function handleLogoUpload(fd: FormData) {
    const res = await uploadLogoAction(fd);
    if (res.ok && res.url) {
      setLogoUrl(res.url);
      router.refresh();
    }
    return res;
  }

  async function handleLogoRemove() {
    await removeLogoAction();
    setLogoUrl(null);
    router.refresh();
  }

  const errors = state.fieldErrors ?? {};

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="template_id" value={template} />
        <input type="hidden" name="primary" value={primary} />
        <input type="hidden" name="accent" value={accent} />
        <input type="hidden" name="background" value={background ?? ""} />
        <input type="hidden" name="font_head" value={fontHead} />
        <input type="hidden" name="font_body" value={effectiveBody} />
        <input type="hidden" name="show_name" value={String(showName)} />
        <input type="hidden" name="hero_media" value={heroMedia} />

        {/* Template */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Template</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {TEMPLATES.map((t) => {
                const active = template === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    aria-pressed={active}
                    className={`cursor-pointer rounded-lg border p-3 text-left transition ${
                      active
                        ? "border-primary ring-2 ring-primary bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                    }`}
                  >
                    <div className="text-sm font-semibold text-foreground">
                      {t.name}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {t.vibe}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Cores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ColorField
              label="Cor principal"
              hint="Cabeçalho, links e destaques"
              value={primary}
              onChange={setPrimary}
            />
            <ColorField
              label="Cor de destaque"
              hint="Botões de ação e chamadas"
              value={accent}
              onChange={setAccent}
            />
            <div className="space-y-3 border-t border-border pt-4">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Switch
                  checked={background !== null}
                  onCheckedChange={(on) =>
                    setBackground(on ? (background ?? "#ffffff") : null)
                  }
                />
                Cor de fundo personalizada
              </label>
              {background !== null ? (
                <ColorField
                  label="Cor de fundo"
                  hint="Fundo geral do site (textos se ajustam sozinhos)"
                  value={background}
                  onChange={setBackground}
                />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Usando o fundo padrão do template.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fontes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fontes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Combinações sugeridas
              </p>
              <FontPairings
                head={fontHead}
                body={effectiveBody}
                onSelect={applyPairing}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Fonte dos títulos</Label>
                <FontPicker
                  label="Fonte dos títulos"
                  value={fontHead}
                  catalog={catalog}
                  onChange={(f) => setFontHead(f.f)}
                />
              </div>
              {!sameFont && (
                <div className="grid gap-2">
                  <Label>Fonte dos textos</Label>
                  <FontPicker
                    label="Fonte dos textos"
                    value={fontBody}
                    catalog={catalog}
                    onChange={(f) => setFontBody(f.f)}
                  />
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
              {/* fontBody fica intacto ao ligar — desligar restaura a
                  escolha anterior em vez de descartá-la */}
              <Switch checked={sameFont} onCheckedChange={setSameFont} />
              Usar a mesma fonte em títulos e textos
            </label>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LogoUploader
              logoUrl={logoUrl}
              storeName={store.name}
              onUpload={handleLogoUpload}
              onRemove={handleLogoRemove}
            />
            <label className="flex items-center gap-2 border-t border-border pt-4 text-sm text-foreground">
              <Switch checked={showName} onCheckedChange={setShowName} />
              Mostrar o nome da loja em texto ao lado do logo
            </label>
          </CardContent>
        </Card>

        {/* Hero */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Hero (topo do site)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="hero_title">Título</Label>
              <Input
                id="hero_title"
                name="hero_title"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="Deixe vazio para usar o padrão do template"
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hero_subtitle">Subtítulo</Label>
              <Textarea
                id="hero_subtitle"
                name="hero_subtitle"
                className="min-h-16"
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="Frase de apoio abaixo do título"
              />
              {errors.subtitle && (
                <p className="text-xs text-destructive">{errors.subtitle}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Fundo da hero</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {HERO_MEDIA_OPTIONS.map((opt) => {
                  const active = heroMedia === opt.id;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setHeroMedia(opt.id)}
                      aria-pressed={active}
                      className={`cursor-pointer rounded-lg border p-3 text-left transition ${
                        active
                          ? "border-primary ring-2 ring-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/50"
                      }`}
                    >
                      <div className="text-sm font-semibold text-foreground">
                        {opt.label}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {opt.hint}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {heroMedia === "video" && (
              <div className="grid gap-2">
                <Label htmlFor="hero_video_url">Link do vídeo</Label>
                <Input
                  id="hero_video_url"
                  name="hero_video_url"
                  value={heroVideoUrl}
                  onChange={(e) => setHeroVideoUrl(e.target.value)}
                  placeholder="https://exemplo.com/video.mp4"
                />
                {errors.video_url && (
                  <p className="text-xs text-destructive">{errors.video_url}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Arquivo .mp4 ou .webm hospedado (toca sem som, em loop).
                </p>
              </div>
            )}

            {heroMedia === "images" && (
              <HeroImagesField
                images={heroImages}
                onUpload={uploadHeroImagesAction}
                onRemove={removeHeroImageAction}
                onChanged={(imgs) => {
                  setHeroImages(imgs);
                  router.refresh();
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Textos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Textos da loja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="slogan">Slogan</Label>
              <Input
                id="slogan"
                name="slogan"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Os melhores seminovos da região"
              />
              {errors.slogan && (
                <p className="text-xs text-destructive">{errors.slogan}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="about">Sobre a loja</Label>
              <Textarea
                id="about"
                name="about"
                className="min-h-24"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Conte um pouco sobre a sua loja…"
              />
              {errors.about && (
                <p className="text-xs text-destructive">{errors.about}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="footer_text">Texto do rodapé</Label>
                <Input
                  id="footer_text"
                  name="footer_text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                />
                {errors.footer_text && (
                  <p className="text-xs text-destructive">
                    {errors.footer_text}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="business_hours">Horário de atendimento</Label>
                <Textarea
                  id="business_hours"
                  name="business_hours"
                  className="min-h-16"
                  value={businessHours}
                  onChange={(e) => setBusinessHours(e.target.value)}
                  placeholder="Seg a Sex 9h-18h&#10;Sáb 9h-13h"
                />
                {errors.business_hours && (
                  <p className="text-xs text-destructive">
                    {errors.business_hours}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* feedback junto do botão de salvar (visível sem rolar) */}
        <div aria-live="polite">
          {state.ok && (
            <div
              role="status"
              className="rounded-lg bg-primary/10 px-3.5 py-2.5 text-sm text-primary"
            >
              ✓ Site atualizado.
            </div>
          )}
          {state.error && (
            <div
              role="alert"
              className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
            >
              {state.error}
            </div>
          )}
          {!state.error && state.fieldErrors && (
            <div
              role="alert"
              className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
            >
              Não foi possível salvar — confira os campos destacados acima.
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <SaveButton />
        </div>
      </form>

      {/* Prévia ao vivo — o template REAL num iframe escalado */}
      <div className="hidden lg:block">
        <div className="sticky top-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Prévia ao vivo
          </p>
          <DemoPreview
            template={template}
            name={store.name}
            primary={primary}
            accent={accent}
            background={background}
            fontHead={fontHead}
            fontBody={effectiveBody}
            logoUrl={logoUrl}
            slogan={slogan || undefined}
            showName={showName}
            hero={{
              title: heroTitle || undefined,
              subtitle: heroSubtitle || undefined,
              media: heroMedia,
              videoUrl: heroVideoUrl || undefined,
              images: heroImages.map((i) => i.url),
            }}
          />
          <a
            href={`/${store.slug}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block text-center text-sm font-medium text-primary hover:underline"
          >
            Abrir meu site ↗
          </a>
        </div>
      </div>
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando…" : "Salvar alterações"}
    </Button>
  );
}
