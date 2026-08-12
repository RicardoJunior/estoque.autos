import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { getDashboardMetrics } from "@/lib/metrics";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/PageHeader";
import { RevenueChart } from "./charts/RevenueChart";
import { LeadsChart } from "./charts/LeadsChart";
import { StockValueChart } from "./charts/StockValueChart";
import { OldestStock } from "./charts/OldestStock";

export const metadata = { title: "Início" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { tenant } = await requireTenant();
  const { welcome } = await searchParams;
  const supabase = await createClient();

  const [leadsNew, metrics] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("status", "new"),
    getDashboardMetrics(supabase, tenant.id),
  ]);

  const kpis = [
    { label: "Carros disponíveis", value: metrics.availableCount },
    { label: "Leads novos", value: leadsNew.count ?? 0, href: "/admin/leads" },
    { label: "Leads (30 dias)", value: metrics.leadsTotal30d },
    { label: "Valor em estoque", value: formatPrice(metrics.stockTotal) },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {welcome && (
        <Card className="flex flex-row items-center justify-between gap-4 bg-primary/5 p-5 ring-primary/20">
          <div>
            <h2 className="font-semibold">🎉 Seu site está no ar!</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Agora cadastre seus carros para começar a receber contatos.
            </p>
          </div>
          <Link
            href="/admin/veiculos/novo"
            className={buttonVariants({ className: "shrink-0" })}
          >
            Cadastrar carro
          </Link>
        </Card>
      )}

      <PageHeader title="Olá! 👋" description={`Visão geral da ${tenant.name}.`} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => {
          const inner = (
            <Card className="p-5">
              <div className="text-2xl font-bold">{k.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {k.label}
              </div>
            </Card>
          );
          return k.href ? (
            <Link key={k.label} href={k.href} className="block transition hover:opacity-80">
              {inner}
            </Link>
          ) : (
            <div key={k.label}>{inner}</div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueChart data={metrics.revenue} />
        <LeadsChart data={metrics.leads} prev30d={metrics.leadsPrev30d} />
        <div className="lg:col-span-2">
          <StockValueChart
            data={metrics.stockValue}
            coverage={metrics.stockFipeCoverage}
          />
        </div>
        <div className="lg:col-span-2">
          <OldestStock vehicles={metrics.oldest} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/admin/veiculos">
          <Card className="p-5 ring-foreground/10 transition hover:ring-foreground/20">
            <div className="flex items-center gap-1.5 font-semibold">
              Gerenciar estoque
              <ArrowRight className="size-4" aria-hidden />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre, edite e publique seus veículos.
            </p>
          </Card>
        </Link>
        <Link href="/admin/site">
          <Card className="p-5 ring-foreground/10 transition hover:ring-foreground/20">
            <div className="flex items-center gap-1.5 font-semibold">
              Personalizar site
              <ArrowRight className="size-4" aria-hidden />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Troque o template, as cores e o logo da sua loja.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
