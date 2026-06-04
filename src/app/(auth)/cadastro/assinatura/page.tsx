import { redirect } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { getSession, getSubscription, isSubscriptionActive } from "@/lib/auth";
import {
  BILLING_INTERVALS,
  PLANS,
  annualMonthlyEquivalent,
  annualSavingsPct,
  formatCents,
  isBillingInterval,
  isPlanId,
  type BillingInterval,
} from "@/lib/billing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { startCheckoutAction } from "./actions";

export const metadata = { title: "Escolha seu plano" };

const PLAN_FEATURES: Record<string, string[]> = {
  basico: [
    "Site pronto com os 6 templates",
    "Até 20 carros ativos",
    "Cadastro pela tabela FIPE",
    "Leads por proposta e WhatsApp",
  ],
  pro: [
    "Tudo do Básico, e mais:",
    "Domínio próprio (sualoja.com.br)",
    "Até 60 carros ativos",
    "Destaque nos resultados de busca",
  ],
};

const INTERVAL_LABELS: Record<BillingInterval, string> = {
  mensal: "Mensal",
  anual: "Anual",
};

export default async function AssinaturaPage({
  searchParams,
}: {
  searchParams: Promise<{ plano?: string; intervalo?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/cadastro/assinatura");

  const sub = await getSubscription();
  if (isSubscriptionActive(sub)) {
    redirect(session.tenant ? "/admin" : "/onboarding");
  }

  const { plano, intervalo } = await searchParams;
  const selected = isPlanId(plano) ? plano : "basico";
  const interval = isBillingInterval(intervalo) ? intervalo : "mensal";
  const maxSavings = Math.max(
    ...Object.values(PLANS).map((p) => annualSavingsPct(p)),
  );

  return (
    <>
      <h1 className="text-xl font-bold">Quase lá — escolha seu plano</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Sua conta está criada. Ative a assinatura para montar sua loja.
      </p>

      {/* mensal × anual */}
      <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/40 p-1">
        {BILLING_INTERVALS.map((i) => (
          <Link
            key={i}
            href={`/cadastro/assinatura?plano=${selected}&intervalo=${i}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-center text-sm font-medium transition-colors",
              i === interval
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {INTERVAL_LABELS[i]}
            {i === "anual" && (
              <span className={cn("ml-1.5 text-xs", i === interval ? "opacity-80" : "text-primary")}>
                até {maxSavings}% off
              </span>
            )}
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        {Object.values(PLANS).map((p) => {
          const active = p.id === selected;
          return (
            <Link
              key={p.id}
              href={`/cadastro/assinatura?plano=${p.id}&intervalo=${interval}`}
              className={cn(
                "rounded-xl border p-4 transition-colors",
                active
                  ? "border-primary ring-2 ring-primary/40 bg-primary/5"
                  : "border-border hover:border-primary/50",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">{p.name}</span>
                <span className="flex items-center gap-2">
                  {p.id === "pro" && <Badge>Mais escolhido</Badge>}
                  <span className="text-right text-sm font-bold text-primary">
                    {formatCents(p.priceCents[interval])}
                    <span className="font-normal text-muted-foreground">
                      /{interval === "mensal" ? "mês" : "ano"}
                    </span>
                  </span>
                </span>
              </div>
              {interval === "anual" && (
                <p className="mt-1 text-right text-xs text-muted-foreground">
                  equivale a {annualMonthlyEquivalent(p)}/mês ·{" "}
                  <span className="text-primary">
                    economize {annualSavingsPct(p)}%
                  </span>
                </p>
              )}
              <ul className="mt-2 space-y-1">
                {PLAN_FEATURES[p.id].map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <Check className="size-3 text-primary" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
            </Link>
          );
        })}
      </div>

      <form action={startCheckoutAction} className="mt-6">
        <input type="hidden" name="plano" value={selected} />
        <input type="hidden" name="intervalo" value={interval} />
        <Button type="submit" className="w-full">
          Continuar para o pagamento
        </Button>
      </form>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Pagamento seguro via Stripe. Cancele quando quiser.
      </p>
    </>
  );
}
