import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { portalsAllowed } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime, vehicleTitle } from "@/lib/format";
import { LISTING_STATUS_LABELS } from "@/lib/integrations/labels";
import { recentJobs } from "@/lib/integrations/queue";
import { isPortalId, PORTAL_META } from "@/lib/integrations/registry";
import type { ListingRow, MappingPending } from "@/lib/integrations/types";
import { SITE_URL } from "@/lib/site-url";
import { PageHeader } from "@/components/admin/PageHeader";
import { FormBanner } from "@/components/admin/FormBanner";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConnectionBadge } from "../ConnectionBadge";
import { loadConnectionViews } from "../data";
import { CopyField } from "./CopyField";
import { MappingResolver } from "./MappingResolver";
import { PortalButtons } from "./PortalButtons";
import { PortalSettingsForm } from "./PortalSettingsForm";

export async function generateMetadata({ params }: { params: Promise<{ portal: string }> }) {
  const { portal } = await params;
  return { title: isPortalId(portal) ? PORTAL_META[portal].label : "Integração" };
}

const ERRORS: Record<string, string> = {
  state: "A autorização expirou ou foi adulterada. Tente conectar de novo.",
  sessao: "Sua sessão mudou de loja durante a autorização. Tente de novo.",
  code: "O portal não devolveu o código de autorização.",
  config: "Este portal ainda não está configurado no servidor (credenciais do app).",
  plano: "Recurso do plano Pro.",
};

export default async function PortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ portal: string }>;
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const { tenant } = await requireStaff();
  const { portal } = await params;
  const { ok, erro } = await searchParams;
  if (!isPortalId(portal) || !PORTAL_META[portal].implemented) notFound();
  if (!portalsAllowed(tenant.plan) || tenant.slug === "demo") redirect("/admin/integracoes?erro=plano");

  const meta = PORTAL_META[portal];
  const supabase = await createClient();
  const conns = await loadConnectionViews(supabase, tenant.id);
  const conn = conns.get(portal) ?? null;
  const connected = !!conn && conn.status !== "disconnected";

  // anúncios da loja neste portal (RLS: membro lê) + títulos dos carros
  const { data: listingRows } = await supabase
    .from("portal_listings")
    .select("*, vehicle:vehicles(id, brand, model, version, year_model)")
    .eq("tenant_id", tenant.id)
    .eq("portal", portal)
    .order("updated_at", { ascending: false });
  type Row = ListingRow & { vehicle: { id: string; brand: string; model: string; version: string | null; year_model: number | null } | null };
  const listings = ((listingRows ?? []) as Row[]).filter((l) => l.desired);
  const pending = listings.filter((l) => l.status === "error" && l.error_details?.kind);

  // log: jobs recentes (admin client — a tabela é deny-all para o usuário)
  const jobs = connected ? await recentJobs(createAdminClient(), tenant.id, portal, 30) : [];

  const feedUrl =
    meta.mode === "feed" && conn?.settings.feed_token
      ? `${SITE_URL}/api/feeds/${conn.settings.feed_token}/${portal === "meta_catalog" ? "meta-vehicles.csv" : "usadosbr.xml"}`
      : null;
  const webhookUrl =
    portal === "mercadolivre" ? `${SITE_URL}/api/integrations/mercadolivre/webhook` : null;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader title={meta.label} backHref="/admin/integracoes" backLabel="Integrações">
        <ConnectionBadge status={conn?.status ?? null} />
      </PageHeader>

      {ok && <FormBanner variant="success">Conectado! Seus carros marcados estão entrando na fila.</FormBanner>}
      {erro && <FormBanner variant="error">{ERRORS[erro] ?? decodeURIComponent(erro)}</FormBanner>}

      <Card className="space-y-4 p-5">
        <div>
          <h2 className="font-semibold">Conexão</h2>
          <p className="mt-1 text-sm text-muted-foreground">{meta.prerequisite}</p>
          {meta.docsUrl && (
            <a
              href={meta.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Saiba mais no portal
              <ExternalLink className="size-3" aria-hidden />
            </a>
          )}
        </div>

        {conn?.status === "needs_plan" && (
          <FormBanner variant="neutral">
            {conn.last_error ?? "O portal recusou a publicação por falta de plano."} {meta.needsPlanHint}
          </FormBanner>
        )}
        {conn?.status === "error" && (
          <FormBanner variant="error">{conn.last_error ?? "A conexão precisa de atenção."}</FormBanner>
        )}

        {connected && conn?.external_account_id && meta.mode === "oauth" && (
          <p className="text-sm text-muted-foreground">
            Conta autorizada: <span className="font-medium text-foreground">{conn.external_account_id}</span>
            {conn.last_ok_at && <> · última sincronização {formatDateTime(conn.last_ok_at)}</>}
          </p>
        )}

        {feedUrl && (
          <div className="space-y-2">
            <p className="text-sm">URL do feed (cadastre no portal; atualiza a cada hora):</p>
            <CopyField value={feedUrl} />
          </div>
        )}
        {webhookUrl && connected && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              URL de notificações do app (configurada uma vez pela plataforma no DevCenter):
            </p>
            <CopyField value={webhookUrl} />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {meta.mode === "oauth" && (
            <a
              href={`/api/integrations/${portal}/oauth/start`}
              className={buttonVariants({ variant: connected ? "outline" : "default" })}
            >
              {connected ? "Reautorizar" : `Conectar ${meta.label}`}
            </a>
          )}
          <PortalButtons portal={portal} mode={meta.mode} connected={connected} status={conn?.status ?? null} />
        </div>
      </Card>

      {connected && meta.mode !== "feed" && (
        <Card className="space-y-4 p-5">
          <div>
            <h2 className="font-semibold">Opções</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Valem para todos os carros publicados neste portal.
            </p>
          </div>
          <PortalSettingsForm portal={portal} settings={conn!.settings} />
        </Card>
      )}

      {pending.length > 0 && (
        <Card className="space-y-4 p-5">
          <div>
            <h2 className="font-semibold">Pendências de mapeamento</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              O portal usa um catálogo próprio de marcas, modelos e versões. Escolha o
              valor correspondente para cada carro abaixo; a escolha fica salva para os próximos.
            </p>
          </div>
          <div className="space-y-3">
            {pending.map((l) => (
              <MappingResolver
                key={l.id}
                portal={portal}
                vehicleId={l.vehicle_id}
                vehicleLabel={l.vehicle ? vehicleTitle(l.vehicle) : l.vehicle_id}
                pending={l.error_details as MappingPending}
              />
            ))}
          </div>
        </Card>
      )}

      {connected && meta.mode !== "feed" && (
        <Card className="space-y-3 p-5">
          <h2 className="font-semibold">Anúncios ({listings.length})</h2>
          {listings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum carro marcado para este portal. Marque em “Publicar em” na página do carro.
            </p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {listings.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <Link href={`/admin/veiculos/${l.vehicle_id}`} className="font-medium hover:underline">
                      {l.vehicle ? vehicleTitle(l.vehicle) : "Veículo"}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground">{LISTING_STATUS_LABELS[l.status]}</span>
                    {l.last_error && l.status !== "active" && (
                      <p className="text-xs text-destructive">{l.last_error}</p>
                    )}
                  </div>
                  {l.external_url && l.status === "active" && (
                    <a href={l.external_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                      Ver no {meta.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {jobs.length > 0 && (
        <Card className="space-y-3 p-5">
          <h2 className="font-semibold">Atividade recente</h2>
          <ul className="divide-y divide-border text-xs">
            {jobs.map((j) => (
              <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                <span>
                  <span className="font-medium">{JOB_LABELS[j.kind] ?? j.kind}</span>
                  <span className="ml-2 text-muted-foreground">{formatDateTime(j.created_at)}</span>
                </span>
                <span className={j.status === "done" ? "text-emerald-600 dark:text-emerald-300" : j.status === "pending" || j.status === "running" ? "text-muted-foreground" : "text-destructive"}>
                  {JOB_STATUS[j.status]}
                  {j.last_error && j.status !== "done" ? ` — ${j.last_error.slice(0, 120)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

const JOB_LABELS: Record<string, string> = {
  publish: "Publicar anúncio",
  update: "Atualizar anúncio",
  unpublish: "Remover anúncio",
  sync_tenant: "Sincronizar estoque",
  refresh_token: "Renovar autorização",
  sync_taxonomy: "Atualizar catálogo",
  process_event: "Processar lead/evento",
  fetch_leads: "Buscar leads",
  renew: "Renovar anúncio",
  photos_jpeg: "Preparar fotos",
};

const JOB_STATUS: Record<string, string> = {
  pending: "na fila",
  running: "executando",
  done: "ok",
  failed: "falhou",
  dead: "desistiu",
};
