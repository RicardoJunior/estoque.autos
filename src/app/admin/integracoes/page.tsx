import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { portalsAllowed } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";
import { PORTALS_ORDERED } from "@/lib/integrations/registry";
import { PageHeader } from "@/components/admin/PageHeader";
import { FormBanner } from "@/components/admin/FormBanner";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConnectionBadge } from "./ConnectionBadge";
import { loadConnectionViews, loadListingCounts } from "./data";

export const metadata = { title: "Integrações" };

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { tenant } = await requireStaff();
  const { erro } = await searchParams;
  const allowed = portalsAllowed(tenant.plan) && tenant.slug !== "demo";
  const supabase = await createClient();
  const [conns, counts] = allowed
    ? await Promise.all([loadConnectionViews(supabase, tenant.id), loadListingCounts(supabase, tenant.id)])
    : [new Map(), new Map()];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        title="Integrações"
        description="Publique seu estoque nos portais de anúncios e receba os leads aqui no painel."
      />

      {erro === "plano" && (
        <FormBanner variant="error">
          Publicar nos portais é um recurso do plano Pro.
        </FormBanner>
      )}

      {!allowed && (
        <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <p className="font-semibold">Recurso do plano Pro</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                No Pro, cada carro cadastrado pode ir automaticamente para o
                Mercado Livre, a OLX e os feeds da Meta e da Usadosbr, e os
                contatos voltam para a sua lista de leads.
              </p>
            </div>
          </div>
          {tenant.slug !== "demo" && (
            <Link href="/admin/configuracoes" className={buttonVariants({ className: "shrink-0" })}>
              Fazer upgrade
            </Link>
          )}
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {PORTALS_ORDERED.map((p) => {
          const conn = conns.get(p.id);
          const c = counts.get(p.id);
          return (
            <Card key={p.id} className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{p.label}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {p.mode === "feed"
                      ? "Feed de estoque (o portal busca)"
                      : p.mode === "oauth"
                        ? "Publicação por anúncio + leads"
                        : "Credenciais de integração"}
                  </p>
                </div>
                <ConnectionBadge status={conn?.status ?? null} implemented={p.implemented} />
              </div>

              <p className="text-sm text-muted-foreground">{p.prerequisite}</p>

              {conn?.status === "needs_plan" && (
                <FormBanner variant="neutral">{p.needsPlanHint}</FormBanner>
              )}
              {conn?.status === "error" && conn.last_error && (
                <FormBanner variant="error">{conn.last_error}</FormBanner>
              )}

              {c && p.mode !== "feed" && (
                <p className="text-xs text-muted-foreground">
                  {c.active} no ar · {c.queued} na fila · {c.error} com erro
                </p>
              )}

              <div className="mt-auto flex items-center justify-end">
                {allowed && p.implemented ? (
                  <Link
                    href={`/admin/integracoes/${p.id}`}
                    className={buttonVariants({ variant: conn ? "outline" : "default", size: "sm" })}
                  >
                    {conn && conn.status !== "disconnected" ? "Gerenciar" : "Conectar"}
                    <ArrowRight data-icon="inline-end" aria-hidden />
                  </Link>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {p.implemented ? "" : "Em breve"}
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
