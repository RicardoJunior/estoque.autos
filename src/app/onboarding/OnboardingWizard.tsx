"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { Search } from "lucide-react";
import {
  checkSlugAction,
  completeOnboardingAction,
  type OnboardingState,
  type SlugCheck,
} from "./actions";
import { TEMPLATES } from "@/lib/templates";
import {
  DEFAULT_COLORS,
  type TemplateId,
  type TenantFonts,
} from "@/lib/types";
import { DEFAULT_STORE_FONTS, FONT_PAIRINGS } from "@/lib/fonts";
import { getFontCatalog, type GoogleFont } from "@/lib/google-fonts";
import { injectFontCss } from "@/lib/font-css";
import { slugify } from "@/lib/format";
import { DemoPreview } from "@/components/brand/DemoPreview";
import { ColorField } from "@/components/brand/ColorField";
import { FontPairings } from "@/components/brand/FontPairings";
import { FontPicker } from "@/components/brand/FontPicker";
import { LogoCropDialog } from "@/components/brand/LogoCropDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const STEPS = ["Sua loja", "Contato", "Template", "Marca", "Logo"] as const;

/** campos do passo 2 — usado para levar o lojista ao passo do erro */
const CONTACT_FIELDS = [
  "phone",
  "email",
  "cep",
  "street",
  "number",
  "neighborhood",
  "city",
  "state",
  "business_hours",
];

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [template, setTemplate] = useState<TemplateId>("classico");
  const [primary, setPrimary] = useState(DEFAULT_COLORS.primary);
  const [accent, setAccent] = useState(DEFAULT_COLORS.accent);
  const [fonts, setFonts] = useState<TenantFonts>(DEFAULT_STORE_FONTS);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  /** arquivo final (SVG ou PNG cortado) — fonte da verdade para o submit */
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);

  // contato & endereço (o site sai do onboarding completo)
  const [cepLoading, setCepLoading] = useState(false);
  const [address, setAddress] = useState({
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const [slugCheck, setSlugCheck] = useState<SlugCheck | null>(null);
  const [, startCheck] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  // catálogo do Google Fonts para o card "Outras" (chunk sob demanda)
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

  const [state, formAction] = useActionState<OnboardingState, FormData>(
    completeOnboardingAction,
    {},
  );

  // checagem de disponibilidade do slug (debounce async — só dispara
  // quando há slug suficiente; o reset é feito nos handlers).
  useEffect(() => {
    if (slug.length < 3) return;
    let cancelled = false;
    const t = setTimeout(() => {
      startCheck(async () => {
        const result = await checkSlugAction(slug);
        // resposta antiga não pode sobrescrever a checagem do slug atual
        if (!cancelled) setSlugCheck(result);
      });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [slug]);

  function handleName(value: string) {
    setName(value);
    if (!slugEdited) {
      const s = slugify(value);
      setSlug(s);
      if (s.length < 3) setSlugCheck(null);
    }
  }

  function handleSlug(value: string) {
    setSlugEdited(true);
    const s = slugify(value);
    setSlug(s);
    if (s.length < 3) setSlugCheck(null);
  }

  async function lookupCep(cep: string) {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = (await res.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (!data.erro) {
        setAddress((a) => ({
          ...a,
          street: data.logradouro || a.street,
          neighborhood: data.bairro || a.neighborhood,
          city: data.localidade || a.city,
          state: data.uf || a.state,
        }));
      }
    } catch {
      // CEP é conveniência — o lojista pode preencher na mão
    } finally {
      setCepLoading(false);
    }
  }

  // as fontes escolhidas carregam para a prévia (peso 400 basta aqui)
  useEffect(() => {
    for (const family of [fonts.head, fonts.body]) {
      injectFontCss(
        `https://fonts.googleapis.com/css2?family=${family.replaceAll(" ", "+")}&display=swap`,
      );
    }
  }, [fonts]);

  function replaceLogoPreview(url: string | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = url;
    setLogoPreview(url);
  }

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  // o React 19 reseta o form (inclusive o input de arquivo) quando a
  // action retorna erro — devolve o logo escolhido para o input
  useEffect(() => {
    const input = fileRef.current;
    if (!logoFile || !input) return;
    if (!input.files || input.files.length === 0) {
      const dt = new DataTransfer();
      dt.items.add(logoFile);
      input.files = dt.files;
    }
  }, [state, logoFile]);

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLogoError(null);
    const f = e.target.files?.[0];
    if (!f) {
      setLogoFile(null);
      replaceLogoPreview(null);
      return;
    }
    // SVG sobe como vetor, sem corte; rasters passam pelo editor
    if (f.type === "image/svg+xml" || /\.svg$/i.test(f.name)) {
      if (f.size > 1024 * 1024) {
        setLogoError("SVG muito grande (máx. 1MB).");
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
      setLogoFile(f);
      replaceLogoPreview(URL.createObjectURL(f));
      return;
    }
    if (!f.type.startsWith("image/")) {
      setLogoError("Envie SVG, PNG, WebP, AVIF ou JPEG.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setCropFile(f);
  }

  function onCropConfirm(blob: Blob) {
    setCropFile(null);
    const file = new File([blob], "logo.png", { type: "image/png" });
    // o PNG cortado substitui o arquivo original dentro do input do form
    if (fileRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileRef.current.files = dt.files;
    }
    setLogoFile(file);
    replaceLogoPreview(URL.createObjectURL(file));
  }

  function onCropCancel() {
    setCropFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setLogoFile(null);
    replaceLogoPreview(null);
  }

  const step1Valid =
    name.trim().length >= 2 && slug.length >= 3 && slugCheck?.available === true;

  // erro de validação com o usuário em outro passo: leva ao passo do
  // campo com problema (senão o publish parece não fazer nada)
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state.fieldErrors) {
      const keys = Object.keys(state.fieldErrors);
      setStep(keys.some((k) => CONTACT_FIELDS.includes(k)) ? 1 : 0);
    }
  }

  const slugMsg = (() => {
    if (slug.length > 0 && slug.length < 3) return "Mínimo de 3 caracteres";
    if (!slugCheck) return null;
    if (slugCheck.available) return "ok";
    return {
      invalid: "Use apenas letras, números e hífens",
      reserved: "Essa URL é reservada",
      taken: "Essa URL já está em uso",
    }[slugCheck.reason ?? "invalid"];
  })();

  const pairingActive = FONT_PAIRINGS.some(
    (p) => p.head === fonts.head && p.body === fonts.body,
  );
  const e = state.fieldErrors ?? {};

  return (
    <div className="mx-auto grid min-h-dvh max-w-6xl grid-cols-1 gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
      {/* ---- coluna do formulário ---- */}
      <div className="flex flex-col">
        <div className="mb-1 text-lg font-bold tracking-tight">
          estoque<span className="text-[var(--color-brand)]">.autos</span>
        </div>

        {/* stepper */}
        <ol className="mb-8 mt-4 flex items-center gap-2 text-xs font-medium">
          {STEPS.map((label, i) => (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.7rem] ${
                  i <= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`hidden sm:inline ${
                  i === step ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </li>
          ))}
        </ol>

        <form action={formAction} className="flex flex-1 flex-col">
          {/* hidden inputs com o estado dos widgets (presentes sempre) */}
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="template_id" value={template} />
          <input type="hidden" name="primary" value={primary} />
          <input type="hidden" name="accent" value={accent} />
          <input type="hidden" name="font_head" value={fonts.head} />
          <input type="hidden" name="font_body" value={fonts.body} />

          {state.error && (
            <div className="mb-4 rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {/* ---------- STEP 1: loja ---------- */}
          <section className={step === 0 ? "space-y-4" : "hidden"}>
            <h1 className="text-xl font-bold">Vamos criar sua loja</h1>
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da loja</Label>
              <Input
                id="name"
                name="name"
                placeholder="Auto Center Silva"
                value={name}
                onChange={(ev) => handleName(ev.target.value)}
                required
              />
              {e.name && <p className="text-xs text-destructive">{e.name}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug-input">Endereço do seu site</Label>
              <div className="flex items-center overflow-hidden rounded-lg border border-input bg-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                <span className="select-none bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                  estoque.autos/
                </span>
                <input
                  id="slug-input"
                  className="flex-1 bg-transparent px-2 py-2.5 text-[0.95rem] text-foreground outline-none placeholder:text-muted-foreground"
                  placeholder="auto-center-silva"
                  value={slug}
                  onChange={(ev) => handleSlug(ev.target.value)}
                />
              </div>
              {slugMsg === "ok" ? (
                <p className="text-xs text-primary">✓ Disponível</p>
              ) : slugMsg ? (
                <p className="text-xs text-destructive">{slugMsg}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  É o link que seus clientes vão acessar.
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="whatsapp">
                WhatsApp{" "}
                <span className="font-normal text-muted-foreground">
                  (recomendado — vira botão de contato no site)
                </span>
              </Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                placeholder="(11) 99999-9999"
                value={whatsapp}
                onChange={(ev) => setWhatsapp(ev.target.value)}
              />
            </div>
          </section>

          {/* ---------- STEP 2: contato & endereço ---------- */}
          <section className={step === 1 ? "space-y-4" : "hidden"}>
            <h1 className="text-xl font-bold">Dados da loja</h1>
            <p className="text-sm text-muted-foreground">
              Aparecem no rodapé, na página Sobre e no mapa. Tudo opcional —
              dá para completar depois no painel.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ob-phone">Telefone fixo</Label>
                <Input
                  id="ob-phone"
                  name="phone"
                  placeholder="(11) 3333-4444"
                />
                {e.phone && (
                  <p className="text-xs text-destructive">{e.phone}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ob-email">E-mail</Label>
                <Input
                  id="ob-email"
                  name="email"
                  type="email"
                  placeholder="contato@sualoja.com.br"
                />
                {e.email && (
                  <p className="text-xs text-destructive">{e.email}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
              <div className="grid gap-2">
                <Label htmlFor="ob-cep">CEP</Label>
                <Input
                  id="ob-cep"
                  name="cep"
                  placeholder="01452-001"
                  value={address.cep}
                  onChange={(ev) => {
                    const cep = ev.target.value;
                    setAddress((a) => ({ ...a, cep }));
                    lookupCep(cep);
                  }}
                />
                {cepLoading && (
                  <p className="text-xs text-muted-foreground">Buscando…</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ob-street">Rua / Avenida</Label>
                <Input
                  id="ob-street"
                  name="street"
                  value={address.street}
                  onChange={(ev) =>
                    setAddress((a) => ({ ...a, street: ev.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="ob-number">Número</Label>
                <Input
                  id="ob-number"
                  name="number"
                  value={address.number}
                  onChange={(ev) =>
                    setAddress((a) => ({ ...a, number: ev.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="ob-neigh">Bairro</Label>
                <Input
                  id="ob-neigh"
                  name="neighborhood"
                  value={address.neighborhood}
                  onChange={(ev) =>
                    setAddress((a) => ({ ...a, neighborhood: ev.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
              <div className="grid gap-2">
                <Label htmlFor="ob-city">Cidade</Label>
                <Input
                  id="ob-city"
                  name="city"
                  value={address.city}
                  onChange={(ev) =>
                    setAddress((a) => ({ ...a, city: ev.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ob-state">UF</Label>
                <Input
                  id="ob-state"
                  name="state"
                  maxLength={2}
                  placeholder="SP"
                  value={address.state}
                  onChange={(ev) =>
                    setAddress((a) => ({
                      ...a,
                      state: ev.target.value.toUpperCase(),
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ob-hours">Horário de atendimento</Label>
              <Textarea
                id="ob-hours"
                name="business_hours"
                className="min-h-16"
                placeholder="Seg a Sex 9h-18h&#10;Sáb 9h-13h"
              />
              {e.business_hours && (
                <p className="text-xs text-destructive">{e.business_hours}</p>
              )}
            </div>
          </section>

          {/* ---------- STEP 3: template ---------- */}
          <section className={step === 2 ? "space-y-4" : "hidden"}>
            <h1 className="text-xl font-bold">Escolha um template</h1>
            <p className="text-sm text-muted-foreground">
              Veja a prévia ao lado. Você pode trocar quando quiser.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`cursor-pointer rounded-lg border p-3 text-left transition ${
                    template === t.id
                      ? "border-primary ring-2 ring-primary/15"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {t.vibe}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ---------- STEP 4: marca (cores + fontes) ---------- */}
          <section className={step === 3 ? "space-y-5" : "hidden"}>
            <h1 className="text-xl font-bold">Sua marca</h1>
            <ColorField
              label="Cor principal"
              hint="Usada no cabeçalho, links e destaques"
              value={primary}
              onChange={setPrimary}
            />
            <ColorField
              label="Cor de destaque"
              hint="Usada nos botões de ação (ex.: contato)"
              value={accent}
              onChange={setAccent}
            />

            <div className="grid gap-2">
              <Label>Fonte</Label>
              <FontPairings
                head={fonts.head}
                body={fonts.body}
                onSelect={(p) => setFonts({ head: p.head, body: p.body })}
              />
              {/* card "Outras": busca no catálogo inteiro do Google Fonts */}
              <FontPicker
                label="Outras fontes"
                value={fonts.head}
                catalog={catalog}
                onChange={(f) => setFonts({ head: f.f, body: f.f })}
                renderTrigger={(open) => (
                  <button
                    type="button"
                    onClick={open}
                    aria-pressed={!pairingActive}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg border p-2.5 text-left transition ${
                      !pairingActive
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                    }`}
                  >
                    <span>
                      <span
                        className="block text-[15px] leading-tight text-foreground"
                        style={
                          !pairingActive
                            ? { fontFamily: `"${fonts.head}"` }
                            : undefined
                        }
                      >
                        {!pairingActive ? fonts.head : "Outras fontes"}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Busque entre todas as fontes do Google Fonts
                      </span>
                    </span>
                    <Search className="size-4 shrink-0 opacity-50" />
                  </button>
                )}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                No painel dá para escolher fontes diferentes para títulos e
                textos.
              </p>
            </div>
          </section>

          {/* ---------- STEP 5: logo ---------- */}
          <section className={step === 4 ? "space-y-4" : "hidden"}>
            <h1 className="text-xl font-bold">Adicione seu logo</h1>
            <p className="text-sm text-muted-foreground">
              Opcional. Sem logo, usamos o nome da loja.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted">
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt="Prévia do logo"
                    width={80}
                    height={80}
                    className="h-full w-full object-contain"
                    unoptimized
                  />
                ) : (
                  <span className="text-2xl font-bold text-muted-foreground">
                    {name.charAt(0).toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="border border-border"
                  onClick={() => fileRef.current?.click()}
                >
                  {logoPreview ? "Trocar imagem" : "Escolher imagem"}
                </Button>
                {logoPreview && (
                  <button
                    type="button"
                    className="block cursor-pointer text-xs text-destructive hover:underline"
                    onClick={() => {
                      setLogoFile(null);
                      replaceLogoPreview(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
            {logoError && (
              <p className="text-xs text-destructive">{logoError}</p>
            )}
            {/* file input sempre montado para entrar no submit */}
            <input
              ref={fileRef}
              type="file"
              name="logo"
              accept=".svg,.png,.webp,.avif,.jpg,.jpeg,image/svg+xml,image/png,image/webp,image/avif,image/jpeg"
              className="hidden"
              onChange={onLogoChange}
            />
            <LogoCropDialog
              file={cropFile}
              onCancel={onCropCancel}
              onConfirm={onCropConfirm}
            />
          </section>

          {/* ---------- navegação ---------- */}
          <div className="mt-auto flex items-center justify-between gap-3 pt-8">
            {step > 0 ? (
              <Button
                type="button"
                variant="ghost"
                className="border border-border"
                onClick={() => setStep((s) => s - 1)}
              >
                Voltar
              </Button>
            ) : (
              <span />
            )}

            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                disabled={step === 0 && !step1Valid}
                onClick={() => setStep((s) => s + 1)}
              >
                Continuar
              </Button>
            ) : (
              <PublishButton disabled={!step1Valid} />
            )}
          </div>
        </form>
      </div>

      {/* ---- coluna da prévia (template REAL num iframe escalado) ---- */}
      <div className="hidden lg:block">
        <div className="sticky top-10">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Prévia ao vivo
          </p>
          <DemoPreview
            template={template}
            name={name || "Sua Loja"}
            primary={primary}
            accent={accent}
            fontHead={fonts.head}
            fontBody={fonts.body}
            logoUrl={logoPreview}
          />
        </div>
      </div>
    </div>
  );
}

function PublishButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending}>
      {pending ? "Publicando…" : "Publicar meu site →"}
    </Button>
  );
}
