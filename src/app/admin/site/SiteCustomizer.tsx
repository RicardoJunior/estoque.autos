"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { TEMPLATES } from "@/lib/templates";
import type { TemplateId } from "@/lib/types";
import {
  STORE_FONTS,
  STORE_FONT_IDS,
  resolveFontId,
  type StoreFontId,
} from "@/lib/fonts";
import { StorefrontPreview } from "@/components/StorefrontPreview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  updateSiteAction,
  uploadLogoAction,
  removeLogoAction,
  type SiteState,
} from "./actions";
import type { Storefront } from "@/lib/public";

/** Famílias CSS (head/body) por fonte — vêm do next/font (server). */
export type FontPreviews = Record<StoreFontId, { head: string; body: string }>;

export function SiteCustomizer({
  store,
  fontPreviews,
}: {
  store: Storefront;
  fontPreviews: FontPreviews;
}) {
  const router = useRouter();
  const [template, setTemplate] = useState<TemplateId>(store.template_id);
  const [primary, setPrimary] = useState(store.colors.primary);
  const [accent, setAccent] = useState(store.colors.accent);
  const [font, setFont] = useState<StoreFontId>(
    resolveFontId(store.settings.font),
  );
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
        <input type="hidden" name="font" value={font} />

        {state.ok && (
          <div className="rounded-lg bg-primary/10 px-3.5 py-2.5 text-sm text-primary">
            ✓ Site atualizado.
          </div>
        )}
        {state.error && (
          <div className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            {state.error}
          </div>
        )}

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
                    className={`rounded-lg border p-3 text-left transition ${
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
            <ColorRow
              label="Cor principal"
              value={primary}
              onChange={setPrimary}
            />
            <ColorRow
              label="Cor de destaque"
              value={accent}
              onChange={setAccent}
            />
          </CardContent>
        </Card>

        {/* Fonte */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fonte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {STORE_FONT_IDS.map((id) => {
                const active = font === id;
                const fam = fontPreviews[id];
                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => setFont(id)}
                    aria-pressed={active}
                    className={`rounded-lg border p-3 text-left transition ${
                      active
                        ? "border-primary ring-2 ring-primary bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className="truncate text-lg leading-tight text-foreground"
                      style={{ fontFamily: fam.head }}
                    >
                      {STORE_FONTS[id].head}
                    </div>
                    <div
                      className="mt-1 truncate text-xs text-muted-foreground"
                      style={{ fontFamily: fam.body }}
                    >
                      {STORE_FONTS[id].label}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted">
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
                  <span className="text-2xl font-bold text-muted-foreground">
                    {store.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={logoPending}
                  onClick={() => fileRef.current?.click()}
                >
                  {logoPending
                    ? "Enviando…"
                    : logoUrl
                      ? "Trocar logo"
                      : "Enviar logo"}
                </Button>
                {logoUrl && (
                  <button
                    type="button"
                    disabled={logoPending}
                    onClick={onRemoveLogo}
                    className="block text-xs text-destructive hover:underline"
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
                defaultValue={store.settings.slogan ?? ""}
                placeholder="Os melhores seminovos da região"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="about">Sobre a loja</Label>
              <Textarea
                id="about"
                name="about"
                className="min-h-24"
                defaultValue={store.settings.about ?? ""}
                placeholder="Conte um pouco sobre a sua loja…"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="footer_text">Texto do rodapé</Label>
                <Input
                  id="footer_text"
                  name="footer_text"
                  defaultValue={store.settings.footer_text ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="business_hours">Horário de atendimento</Label>
                <Textarea
                  id="business_hours"
                  name="business_hours"
                  className="min-h-16"
                  defaultValue={store.settings.business_hours ?? ""}
                  placeholder="Seg a Sex 9h-18h&#10;Sáb 9h-13h"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <SaveButton />
        </div>
      </form>

      {/* Prévia ao vivo */}
      <div className="hidden lg:block">
        <div className="sticky top-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
        className="h-10 w-12 cursor-pointer rounded-lg border border-border bg-transparent"
        aria-label={label}
      />
      <div className="flex-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="font-mono text-xs uppercase text-muted-foreground">
          {value}
        </div>
      </div>
    </div>
  );
}
