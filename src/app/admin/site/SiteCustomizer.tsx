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
import { TEMPLATE_TEXT_DEFAULTS } from "@/lib/template-texts";
import { DemoPreview } from "@/components/brand/DemoPreview";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ColorField } from "@/components/brand/ColorField";
import { FontPicker } from "@/components/brand/FontPicker";
import { FontPairings } from "@/components/brand/FontPairings";
import { LogoUploader } from "@/components/brand/LogoUploader";
import { HeroImagesField } from "@/components/brand/HeroImagesField";
import { FormBanner } from "@/components/admin/FormBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  updateSiteAction,
  uploadLogoAction,
  removeLogoAction,
  uploadHeroImagesAction,
  removeHeroImageAction,
  type SiteState,
} from "./actions";
import type { Storefront } from "@/lib/public";

const HERO_MEDIA_OPTIONS: { id: HeroMediaType; label: string; hint: string }[] =
  [
    {
      id: "none",
      label: "Padrão do template",
      hint: "Fundo desenhado pelo template",
    },
    {
      id: "images",
      label: "Carrossel de fotos",
      hint: "Suas fotos girando no fundo",
    },
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

  // hero + títulos de seção: o default do template escolhido é o VALOR
  // INICIAL do campo (o lojista edita ou apaga; em branco = não renderiza)
  const D0 = TEMPLATE_TEXT_DEFAULTS[store.template_id];
  const initialHero = store.settings.hero;
  const initialTexts = store.settings.texts;
  const [heroEyebrow, setHeroEyebrow] = useState(
    initialHero?.eyebrow ?? D0.hero_eyebrow,
  );
  const [heroCta, setHeroCta] = useState(
    initialHero?.cta_label ?? D0.hero_cta,
  );
  const [heroTitle, setHeroTitle] = useState(
    initialHero?.title ?? D0.hero_title,
  );
  const [heroSubtitle, setHeroSubtitle] = useState(
    initialHero?.subtitle ?? D0.hero_subtitle,
  );
  const [featuredTitle, setFeaturedTitle] = useState(
    initialTexts?.featured_title ?? D0.featured_title,
  );
  const [featuredSubtitle, setFeaturedSubtitle] = useState(
    initialTexts?.featured_subtitle ?? D0.featured_subtitle,
  );
  const [stockTitle, setStockTitle] = useState(
    initialTexts?.stock_title ?? D0.stock_title,
  );
  const [heroMedia, setHeroMedia] = useState<HeroMediaType>(
    initialHero?.media ?? "none",
  );

  /** Troca o template e leva junto os textos que o lojista NÃO mexeu. */
  function changeTemplate(next: TemplateId) {
    const prev = TEMPLATE_TEXT_DEFAULTS[template];
    const d = TEMPLATE_TEXT_DEFAULTS[next];
    if (heroEyebrow === prev.hero_eyebrow) setHeroEyebrow(d.hero_eyebrow);
    if (heroCta === prev.hero_cta) setHeroCta(d.hero_cta);
    if (heroTitle === prev.hero_title) setHeroTitle(d.hero_title);
    if (heroSubtitle === prev.hero_subtitle) setHeroSubtitle(d.hero_subtitle);
    if (featuredTitle === prev.featured_title)
      setFeaturedTitle(d.featured_title);
    if (featuredSubtitle === prev.featured_subtitle)
      setFeaturedSubtitle(d.featured_subtitle);
    if (stockTitle === prev.stock_title) setStockTitle(d.stock_title);
    setTemplate(next);
  }
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
  const [footerText, setFooterText] = useState(
    store.settings.footer_text ?? "",
  );
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

        {/* aba por assunto — keepMounted mantém os campos no DOM p/ submit */}
        <Tabs defaultValue="aparencia" className="gap-5">
          <TabsList>
            <TabsTrigger value="aparencia">Aparência</TabsTrigger>
            <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
          </TabsList>

          <TabsContent value="aparencia" keepMounted className="space-y-6">
            {/* Template */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Template</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {TEMPLATES.map((t) => (
                    <OptionCard
                      key={t.id}
                      active={template === t.id}
                      title={t.name}
                      hint={t.vibe}
                      onClick={() => changeTemplate(t.id)}
                    />
                  ))}
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
          </TabsContent>

          <TabsContent value="conteudo" keepMounted className="space-y-6">
            {/* Hero — campos pré-preenchidos com o texto do template;
                apagar = o elemento some do site (nada de texto genérico) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Hero (topo do site)</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Este é o texto que os visitantes veem primeiro. Edite à
                  vontade — o que ficar em branco não aparece no site.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field
                  label="Olho (linha acima do título)"
                  htmlFor="hero_eyebrow"
                  hint="Texto curto em destaque acima do título. Em branco, não aparece."
                >
                  <Input
                    id="hero_eyebrow"
                    name="hero_eyebrow"
                    value={heroEyebrow}
                    maxLength={60}
                    onChange={(e) => setHeroEyebrow(e.target.value)}
                    placeholder="Ex.: Bem-vindo, Destaque da casa…"
                  />
                </Field>
                <Field
                  label="Título"
                  error={errors.title}
                  hint={
                    TEMPLATE_TEXT_DEFAULTS[template].hero_title === ""
                      ? "Em branco, este template mostra o nome da loja. Enter quebra a linha."
                      : "Em branco, o site fica sem título no topo. Enter quebra a linha."
                  }
                >
                  <input type="hidden" name="hero_title" value={heroTitle} />
                  <RichTextEditor
                    variant="inline"
                    value={toEditorHtml(heroTitle)}
                    onChange={setHeroTitle}
                    placeholder="Título do topo do site"
                  />
                </Field>
                <Field
                  label="Subtítulo"
                  error={errors.subtitle}
                  hint="Frase de apoio abaixo do título."
                >
                  <input
                    type="hidden"
                    name="hero_subtitle"
                    value={heroSubtitle}
                  />
                  <RichTextEditor
                    variant="inline"
                    value={toEditorHtml(heroSubtitle)}
                    onChange={setHeroSubtitle}
                    placeholder="Frase de apoio abaixo do título"
                  />
                </Field>
                <Field
                  label="Botão do topo"
                  htmlFor="hero_cta_label"
                  hint="Texto do botão principal do topo. Em branco, o botão não aparece."
                  className="sm:max-w-[calc(50%-0.5rem)]"
                >
                  <Input
                    id="hero_cta_label"
                    name="hero_cta_label"
                    value={heroCta}
                    maxLength={40}
                    onChange={(e) => setHeroCta(e.target.value)}
                    placeholder="Ex.: Ver estoque"
                  />
                </Field>

                <div className="grid gap-2">
                  <Label>Fundo da hero</Label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {HERO_MEDIA_OPTIONS.map((opt) => (
                      <OptionCard
                        key={opt.id}
                        active={heroMedia === opt.id}
                        title={opt.label}
                        hint={opt.hint}
                        onClick={() => setHeroMedia(opt.id)}
                      />
                    ))}
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
                      <p className="text-xs text-destructive">
                        {errors.video_url}
                      </p>
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

            {/* Títulos das seções do estoque */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Títulos das seções</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Cabeçalhos das seções de destaques e do estoque. Em branco, a
                  seção aparece sem título. Alguns templates não exibem todos.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Destaques — título" htmlFor="text_featured_title">
                    <Input
                      id="text_featured_title"
                      name="text_featured_title"
                      value={featuredTitle}
                      onChange={(e) => setFeaturedTitle(e.target.value)}
                    />
                  </Field>
                  <Field
                    label="Destaques — subtítulo"
                    htmlFor="text_featured_subtitle"
                  >
                    <Input
                      id="text_featured_subtitle"
                      name="text_featured_subtitle"
                      value={featuredSubtitle}
                      onChange={(e) => setFeaturedSubtitle(e.target.value)}
                    />
                  </Field>
                </div>
                <Field
                  label="Estoque — título"
                  htmlFor="text_stock_title"
                  className="sm:max-w-[calc(50%-0.5rem)]"
                >
                  <Input
                    id="text_stock_title"
                    name="text_stock_title"
                    value={stockTitle}
                    onChange={(e) => setStockTitle(e.target.value)}
                  />
                </Field>
              </CardContent>
            </Card>

            {/* Textos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Textos da loja</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field
                  label="Slogan"
                  htmlFor="slogan"
                  error={errors.slogan}
                  hint="Frase curta junto do nome da loja (cabeçalho e página Sobre)."
                >
                  <Input
                    id="slogan"
                    name="slogan"
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    placeholder="Os melhores seminovos da região"
                  />
                </Field>
                <Field
                  label="Sobre a loja"
                  error={errors.about}
                  hint="Aparece na página Sobre. Use negrito, listas e links à vontade."
                >
                  {/* o HTML do editor viaja no hidden e é sanitizado no server */}
                  <input type="hidden" name="about" value={about} />
                  <RichTextEditor
                    value={toEditorHtml(about)}
                    onChange={setAbout}
                    placeholder="Conte um pouco sobre a sua loja…"
                  />
                </Field>
                <Field
                  label="Texto do rodapé"
                  htmlFor="footer_text"
                  error={errors.footer_text}
                  hint="Uma linha no rodapé do site (ex.: CNPJ, aviso legal)."
                >
                  <Input
                    id="footer_text"
                    name="footer_text"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                  />
                </Field>
                <Field
                  label="Horário de atendimento"
                  htmlFor="business_hours"
                  error={errors.business_hours}
                  hint="Uma linha por período — a primeira aparece no topo em alguns templates."
                >
                  <Textarea
                    id="business_hours"
                    name="business_hours"
                    className="min-h-16"
                    value={businessHours}
                    onChange={(e) => setBusinessHours(e.target.value)}
                    placeholder="Seg a Sex 9h-18h&#10;Sáb 9h-13h"
                  />
                </Field>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* feedback junto do botão de salvar (visível sem rolar) */}
        <div aria-live="polite">
          {state.ok && (
            <FormBanner variant="success">Site atualizado.</FormBanner>
          )}
          {state.error && (
            <FormBanner variant="error">{state.error}</FormBanner>
          )}
          {!state.error && state.fieldErrors && (
            <FormBanner variant="error">
              Não foi possível salvar — confira os campos destacados nas abas
              acima.
            </FormBanner>
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
              // strings cruas ("" incluso): a prévia mostra o "apagado"
              title: heroTitle,
              subtitle: heroSubtitle,
              media: heroMedia,
              videoUrl: heroVideoUrl || undefined,
              images: heroImages.map((i) => i.url),
            }}
            texts={{ featuredTitle, featuredSubtitle, stockTitle }}
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

/** Campo padrão da tela: label + controle + (erro OU dica), sempre alinhados. */
function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid content-start gap-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

/**
 * O `about` legado era texto puro — converte em parágrafos para o
 * editor; conteúdo já em HTML passa direto.
 */
function toEditorHtml(value: string): string {
  if (value === "" || /<[a-z][\s\S]*>/i.test(value)) return value;
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return value
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** Cartão de escolha única (template, fundo da hero) com estado ativo. */
function OptionCard({
  active,
  title,
  hint,
  onClick,
}: {
  active: boolean;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "cursor-pointer rounded-lg border p-3 text-left transition",
        active
          ? "border-primary bg-primary/5 ring-2 ring-primary"
          : "border-border hover:border-primary/40 hover:bg-muted/50",
      )}
    >
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
    </button>
  );
}
