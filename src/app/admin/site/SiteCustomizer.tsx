"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { TEMPLATES } from "@/lib/templates";
import type { TemplateId } from "@/lib/types";
import { StorefrontPreview } from "@/components/StorefrontPreview";
import { Field } from "@/components/ui/Field";
import {
  updateSiteAction,
  uploadLogoAction,
  removeLogoAction,
  type SiteState,
} from "./actions";
import type { Storefront } from "@/lib/public";

export function SiteCustomizer({ store }: { store: Storefront }) {
  const router = useRouter();
  const [template, setTemplate] = useState<TemplateId>(store.template_id);
  const [primary, setPrimary] = useState(store.colors.primary);
  const [accent, setAccent] = useState(store.colors.accent);
  const [logoUrl, setLogoUrl] = useState<string | null>(store.logo_url);
  const [logoPending, startLogo] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const [state, formAction] = useActionState<SiteState, FormData>(
    updateSiteAction,
    {},
  );

  function onLogoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("logo", file);
    if (fileRef.current) fileRef.current.value = "";
    startLogo(async () => {
      const res = await uploadLogoAction(fd);
      if (res.ok && res.url) {
        setLogoUrl(res.url);
        router.refresh();
      }
    });
  }

  function onRemoveLogo() {
    startLogo(async () => {
      await removeLogoAction();
      setLogoUrl(null);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="template_id" value={template} />
        <input type="hidden" name="primary" value={primary} />
        <input type="hidden" name="accent" value={accent} />

        {state.ok && (
          <div className="rounded-[var(--radius)] bg-green-50 px-3.5 py-2.5 text-sm text-[var(--color-success)]">
            ✓ Site atualizado.
          </div>
        )}
        {state.error && (
          <div className="rounded-[var(--radius)] bg-red-50 px-3.5 py-2.5 text-sm text-[var(--color-danger)]">
            {state.error}
          </div>
        )}

        {/* Template */}
        <section className="card p-5">
          <h2 className="text-sm font-semibold">Template</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
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

        {/* Cores */}
        <section className="card space-y-4 p-5">
          <h2 className="text-sm font-semibold">Cores</h2>
          <ColorRow label="Cor principal" value={primary} onChange={setPrimary} />
          <ColorRow label="Cor de destaque" value={accent} onChange={setAccent} />
        </section>

        {/* Logo */}
        <section className="card p-5">
          <h2 className="text-sm font-semibold">Logo</h2>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[var(--radius)] border border-dashed border-slate-300 bg-slate-50">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="Logo"
                  width={80}
                  height={80}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-2xl font-bold text-slate-300">
                  {store.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <button
                type="button"
                className="btn-ghost"
                disabled={logoPending}
                onClick={() => fileRef.current?.click()}
              >
                {logoPending ? "Enviando…" : logoUrl ? "Trocar logo" : "Enviar logo"}
              </button>
              {logoUrl && (
                <button
                  type="button"
                  disabled={logoPending}
                  onClick={onRemoveLogo}
                  className="block text-xs text-[var(--color-danger)] hover:underline"
                >
                  Remover logo
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onLogoPick}
            />
          </div>
        </section>

        {/* Textos */}
        <section className="card space-y-4 p-5">
          <h2 className="text-sm font-semibold">Textos da loja</h2>
          <Field
            label="Slogan"
            name="slogan"
            defaultValue={store.settings.slogan ?? ""}
            placeholder="Os melhores seminovos da região"
          />
          <Field label="Sobre a loja" name="about">
            <textarea
              name="about"
              className="field min-h-24"
              defaultValue={store.settings.about ?? ""}
              placeholder="Conte um pouco sobre a sua loja…"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Texto do rodapé"
              name="footer_text"
              defaultValue={store.settings.footer_text ?? ""}
            />
            <Field label="Horário de atendimento" name="business_hours">
              <textarea
                name="business_hours"
                className="field min-h-16"
                defaultValue={store.settings.business_hours ?? ""}
                placeholder="Seg a Sex 9h-18h&#10;Sáb 9h-13h"
              />
            </Field>
          </div>
        </section>

        <div className="flex justify-end">
          <SaveButton />
        </div>
      </form>

      {/* Prévia ao vivo */}
      <div className="hidden lg:block">
        <div className="sticky top-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Prévia ao vivo
          </p>
          <StorefrontPreview
            template={template}
            name={store.name}
            primary={primary}
            accent={accent}
            logoUrl={logoUrl}
          />
          <a
            href={`/${store.slug}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block text-center text-sm font-medium text-[var(--color-brand)] hover:underline"
          >
            Abrir meu site ↗
          </a>
        </div>
      </div>
    </div>
  );
}

function SaveButton() {
  return (
    <button type="submit" className="btn-primary">
      Salvar alterações
    </button>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-12 cursor-pointer rounded border border-[var(--color-border)]"
        aria-label={label}
      />
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="font-mono text-xs uppercase text-[var(--color-ink-soft)]">
          {value}
        </div>
      </div>
    </div>
  );
}
