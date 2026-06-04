import Link from "next/link";
import { requireTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Início" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { tenant } = await requireTenant();
  const { welcome } = await searchParams;
  const supabase = await createClient();

  // KPIs reais (na v1 isto era hardcoded em zero)
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const [available, leadsNew, leads30d, stockValue] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("status", "available"),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("status", "new"),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .gte("created_at", sinceIso),
    supabase
      .from("vehicles")
      .select("price")
      .eq("tenant_id", tenant.id)
      .in("status", ["available", "reserved"]),
  ]);

  const totalStock = (stockValue.data ?? []).reduce(
    (sum, v) => sum + Number(v.price ?? 0),
    0,
  );

  const kpis = [
    { label: "Carros disponíveis", value: available.count ?? 0 },
    { label: "Leads novos", value: leadsNew.count ?? 0, href: "/admin/leads" },
    { label: "Leads (30 dias)", value: leads30d.count ?? 0 },
    { label: "Valor em estoque", value: formatPrice(totalStock) },
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

      <div>
        <h1 className="text-xl font-bold">Olá! 👋</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Visão geral da {tenant.name}.
        </p>
      </div>

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/admin/veiculos">
          <Card className="p-5 ring-foreground/10 transition hover:ring-foreground/20">
            <div className="font-semibold">Gerenciar estoque →</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre, edite e publique seus veículos.
            </p>
          </Card>
        </Link>
        <Link href="/admin/site">
          <Card className="p-5 ring-foreground/10 transition hover:ring-foreground/20">
            <div className="font-semibold">Personalizar site →</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Troque o template, as cores e o logo da sua loja.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
