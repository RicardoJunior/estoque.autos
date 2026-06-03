"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import Image from "next/image";
import {
  checkSlugAction,
  completeOnboardingAction,
  type OnboardingState,
  type SlugCheck,
} from "./actions";
import { TEMPLATES } from "@/lib/templates";
import { DEFAULT_COLORS, type TemplateId } from "@/lib/types";
import { slugify } from "@/lib/format";
import { StorefrontPreview } from "@/components/StorefrontPreview";

const STEPS = ["Sua loja", "Template", "Cores", "Logo"] as const;

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [template, setTemplate] = useState<TemplateId>("classico");
  const [primary, setPrimary] = useState(DEFAULT_COLORS.primary);
  const [accent, setAccent] = useState(DEFAULT_COLORS.accent);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [slugCheck, setSlugCheck] = useState<SlugCheck | null>(null);
  const [, startCheck] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const [state, formAction] = useActionState<OnboardingState, FormData>(
    completeOnboardingAction,
    {},
  );

  // checagem de disponibilidade do slug (debounce async — só dispara
  // quando há slug suficiente; o reset é feito nos handlers).
  useEffect(() => {
    if (slug.length < 3) return;
    const t = setTimeout(() => {
      startCheck(async () => setSlugCheck(await checkSlugAction(slug)));
    }, 400);
    return () => clearTimeout(t);
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

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setLogoPreview(f ? URL.createObjectURL(f) : null);
  }

  const step1Valid =
    name.trim().length >= 2 && slug.length >= 3 && slugCheck?.available === true;

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
                    ? "bg-[var(--color-brand)] text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={
                  i === step ? "text-[var(--color-ink)]" : "text-slate-400"
                }
              >
                {label}
              </span>
            </li>
          ))}
        </ol>

        <form action={formAction} className="flex flex-1 flex-col">
          {/* hidden inputs com o estado completo (presentes em todas as etapas) */}
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="template_id" value={template} />
          <input type="hidden" name="primary" value={primary} />
          <input type="hidden" name="accent" value={accent} />

          {state.error && (
            <div className="mb-4 rounded-[var(--radius)] bg-red-50 px-3.5 py-2.5 text-sm text-[var(--color-danger)]">
              {state.error}
            </div>
          )}

          {/* ---------- STEP 1: loja ---------- */}
          <section className={step === 0 ? "space-y-4" : "hidden"}>
            <h1 className="text-xl font-bold">Vamos criar sua loja</h1>
            <div>
              <label className="label" htmlFor="name">
                Nome da loja
              </label>
              <input
                id="name"
                name="name"
                className="field"
                placeholder="Auto Center Silva"
                value={name}
                onChange={(e) => handleName(e.target.value)}
                required
              />
              {state.fieldErrors?.name && (
                <p className="mt-1 text-xs text-[var(--color-danger)]">
                  {state.fieldErrors.name}
                </p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="slug-input">
                Endereço do seu site
              </label>
              <div className="flex items-center overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-white focus-within:border-[var(--color-brand)] focus-within:ring-2 focus-within:ring-[var(--color-brand)]/15">
                <span className="select-none bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
                  estoque.autos/
                </span>
                <input
                  id="slug-input"
                  className="flex-1 px-2 py-2.5 text-[0.95rem] outline-none"
                  placeholder="auto-center-silva"
                  value={slug}
                  onChange={(e) => handleSlug(e.target.value)}
                />
              </div>
              {slugMsg === "ok" ? (
                <p className="mt-1 text-xs text-[var(--color-success)]">
                  ✓ Disponível
                </p>
              ) : slugMsg ? (
                <p className="mt-1 text-xs text-[var(--color-danger)]">
                  {slugMsg}
                </p>
              ) : (
                <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                  É o link que seus clientes vão acessar.
                </p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="whatsapp">
                WhatsApp{" "}
                <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <input
                id="whatsapp"
                name="whatsapp"
                className="field"
                placeholder="(11) 99999-9999"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>
          </section>

          {/* ---------- STEP 2: template ---------- */}
          <section className={step === 1 ? "space-y-4" : "hidden"}>
            <h1 className="text-xl font-bold">Escolha um template</h1>
            <p className="text-sm text-[var(--color-ink-soft)]">
              Veja a prévia ao lado. Você pode trocar quando quiser.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`rounded-[var(--radius)] border p-3 text-left transition ${
                    template === t.id
                      ? "border-[var(--color-brand)] ring-2 ring-[var(--color-brand)]/15"
                      : "border-[var(--color-border)] hover:border-slate-300"
                  }`}
                >
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
                    {t.vibe}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ---------- STEP 3: cores ---------- */}
          <section className={step === 2 ? "space-y-5" : "hidden"}>
            <h1 className="text-xl font-bold">Suas cores</h1>
            <ColorPicker
              label="Cor principal"
              hint="Usada no cabeçalho, links e destaques."
              value={primary}
              onChange={setPrimary}
            />
            <ColorPicker
              label="Cor de destaque"
              hint="Usada nos botões de ação (ex.: contato)."
              value={accent}
              onChange={setAccent}
            />
          </section>

          {/* ---------- STEP 4: logo ---------- */}
          <section className={step === 3 ? "space-y-4" : "hidden"}>
            <h1 className="text-xl font-bold">Adicione seu logo</h1>
            <p className="text-sm text-[var(--color-ink-soft)]">
              Opcional. Sem logo, usamos o nome da loja.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[var(--radius)] border border-dashed border-slate-300 bg-slate-50">
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
                  <span className="text-2xl font-bold text-slate-300">
                    {name.charAt(0).toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => fileRef.current?.click()}
                >
                  {logoPreview ? "Trocar imagem" : "Escolher imagem"}
                </button>
                {logoPreview && (
                  <button
                    type="button"
                    className="block text-xs text-[var(--color-danger)] hover:underline"
                    onClick={() => {
                      setLogoPreview(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
            {/* file input sempre montado para entrar no submit */}
            <input
              ref={fileRef}
              type="file"
              name="logo"
              accept="image/*"
              className="hidden"
              onChange={onLogoChange}
            />
          </section>

          {/* ---------- navegação ---------- */}
          <div className="mt-auto flex items-center justify-between gap-3 pt-8">
            {step > 0 ? (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setStep((s) => s - 1)}
              >
                Voltar
              </button>
            ) : (
              <span />
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                className="btn-primary"
                disabled={step === 0 && !step1Valid}
                onClick={() => setStep((s) => s + 1)}
              >
                Continuar
              </button>
            ) : (
              <PublishButton disabled={!step1Valid} />
            )}
          </div>
        </form>
      </div>

      {/* ---- coluna da prévia ---- */}
      <div className="hidden lg:block">
        <div className="sticky top-10">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Prévia ao vivo
          </p>
          <StorefrontPreview
            template={template}
            name={name || "Sua Loja"}
            primary={primary}
            accent={accent}
            logoUrl={logoPreview}
          />
        </div>
      </div>
    </div>
  );
}

function PublishButton({ disabled }: { disabled: boolean }) {
  // useFormStatus precisa estar dentro do form; herdamos o pending
  return (
    <button type="submit" className="btn-primary" disabled={disabled}>
      Publicar meu site →
    </button>
  );
}

function ColorPicker({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const PRESETS = [
    "#1d4ed8",
    "#0f766e",
    "#b91c1c",
    "#7c3aed",
    "#ea580c",
    "#0891b2",
    "#16a34a",
    "#db2777",
    "#0f172a",
  ];
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded border border-[var(--color-border)] bg-white"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="field font-mono uppercase"
          maxLength={7}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className="h-6 w-6 rounded-full border border-black/10"
            style={{ background: p }}
            aria-label={p}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-[var(--color-ink-soft)]">{hint}</p>
    </div>
  );
}
