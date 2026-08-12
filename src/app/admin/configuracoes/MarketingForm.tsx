"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FormBanner } from "@/components/admin/FormBanner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMarketingAction, type MarketingState } from "./actions";
import {
  SOCIAL_NETWORKS,
  SOCIAL_NETWORK_LABELS,
  type Tenant,
} from "@/lib/types";

// ============================================================
// Marketing da vitrine: redes sociais do footer (todos os planos)
// + pixels de rastreamento (Meta/TikTok/GA4 — plano Pro).
// ============================================================

const SOCIAL_PLACEHOLDERS: Record<string, string> = {
  instagram: "https://instagram.com/sualoja",
  facebook: "https://facebook.com/sualoja",
  tiktok: "https://tiktok.com/@sualoja",
  x: "https://x.com/sualoja",
  youtube: "https://youtube.com/@sualoja",
  linkedin: "https://linkedin.com/company/sualoja",
  threads: "https://threads.net/@sualoja",
  kwai: "https://kwai.com/@sualoja",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando…" : "Salvar marketing"}
    </Button>
  );
}

export function MarketingForm({ tenant }: { tenant: Tenant }) {
  const [state, action] = useActionState<MarketingState, FormData>(
    updateMarketingAction,
    {},
  );
  const pro = tenant.plan === "pro";
  const tracking = tenant.settings.tracking ?? {};
  const social = tenant.settings.social ?? {};
  const e = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      {state.ok && <FormBanner variant="success">Marketing salvo.</FormBanner>}
      {state.error && <FormBanner variant="error">{state.error}</FormBanner>}

      <Card>
        <CardHeader>
          <CardTitle>Redes sociais</CardTitle>
          <CardDescription>
            Links exibidos no rodapé do seu site. Deixe em branco o que não
            usar.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_NETWORKS.map((n) => (
            <div key={n} className="grid gap-2">
              <Label htmlFor={`social_${n}`}>{SOCIAL_NETWORK_LABELS[n]}</Label>
              <Input
                id={`social_${n}`}
                name={`social_${n}`}
                type="url"
                defaultValue={social[n] ?? ""}
                placeholder={SOCIAL_PLACEHOLDERS[n]}
              />
              {e[n] && <p className="text-xs text-destructive">{e[n]}</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pixels de rastreamento</CardTitle>
          <CardDescription>
            {pro
              ? "Meça visitas e conversões do seu site com Meta Pixel, TikTok Pixel e Google Analytics 4."
              : "Recurso do plano Pro — faça upgrade para medir visitas e conversões com Meta Pixel, TikTok Pixel e Google Analytics 4."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="facebook_pixel">Meta (Facebook) Pixel ID</Label>
            <Input
              id="facebook_pixel"
              name="facebook_pixel"
              defaultValue={tracking.facebook_pixel ?? ""}
              placeholder="123456789012345"
              disabled={!pro}
            />
            {e.facebook_pixel && (
              <p className="text-xs text-destructive">{e.facebook_pixel}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tiktok_pixel">TikTok Pixel ID</Label>
            <Input
              id="tiktok_pixel"
              name="tiktok_pixel"
              defaultValue={tracking.tiktok_pixel ?? ""}
              placeholder="ABCDEF1234567890"
              disabled={!pro}
            />
            {e.tiktok_pixel && (
              <p className="text-xs text-destructive">{e.tiktok_pixel}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="google_analytics">GA4 Measurement ID</Label>
            <Input
              id="google_analytics"
              name="google_analytics"
              defaultValue={tracking.google_analytics ?? ""}
              placeholder="G-XXXXXXXXXX"
              disabled={!pro}
            />
            {e.google_analytics && (
              <p className="text-xs text-destructive">{e.google_analytics}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <SubmitButton />
    </form>
  );
}
