import { redirect } from "next/navigation";
import { getTenantSubscription, requireTenant } from "@/lib/auth";
import { appHost } from "@/lib/domain";
import { isCloudflareSaasEnabled } from "@/lib/cloudflare-saas";
import { PLANS } from "@/lib/billing";
import type { Subscription } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createBillingPortalAction } from "./actions";
import { ContactForm } from "./ContactForm";
import { DomainForm } from "./DomainForm";
import { MarketingForm } from "./MarketingForm";

export const metadata = { title: "Configurações" };

const SUB_STATUS_LABELS: Record<string, string> = {
  active: "Ativa",
  trialing: "Período de teste",
  past_due: "Pagamento pendente",
  unpaid: "Pagamento pendente",
  incomplete: "Pagamento pendente",
  incomplete_expired: "Cancelada",
  canceled: "Cancelada",
};

export default async function SettingsPage() {
  const { tenant, role } = await requireTenant();
  if (role !== "owner" && role !== "admin") redirect("/admin");
  // assinatura da LOJA (a linha completa só é visível para o owner)
  const subscription =
    role === "owner" ? await getTenantSubscription(tenant.id) : null;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-bold">Configurações</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Assinatura, dados de contato e endereço exibidos no seu site.
        </p>
      </div>
      {subscription && <SubscriptionCard sub={subscription} />}
      <ContactForm tenant={tenant} />
      <MarketingForm tenant={tenant} />
      {tenant.plan === "pro" ? (
        <DomainForm
          tenant={tenant}
          appHost={appHost()}
          cfEnabled={isCloudflareSaasEnabled()}
        />
      ) : (
        <DomainUpgradeCard />
      )}
    </div>
  );
}

function DomainUpgradeCard() {
  return (
    <Card className="gap-3 px-5 py-5">
      <CardHeader className="px-0">
        <CardTitle className="text-sm font-semibold">Domínio próprio</CardTitle>
        <CardDescription>
          Use o endereço da sua loja (ex.: www.minhaloja.com.br) no lugar de{" "}
          {appHost()}/sua-loja. Disponível no plano Pro.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <form action={createBillingPortalAction}>
          <Button type="submit" variant="outline">
            Fazer upgrade para o Pro
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SubscriptionCard({ sub }: { sub: Subscription }) {
  const ok = sub.status === "active" || sub.status === "trialing";
  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      })
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Assinatura
          <Badge variant={ok ? "default" : "outline"}>
            {SUB_STATUS_LABELS[sub.status] ?? sub.status}
          </Badge>
        </CardTitle>
        <CardDescription>
          Cancele quando quiser, troque o cartão ou baixe faturas pelo portal
          seguro do Stripe.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Plano {PLANS[sub.plan].name}
              {sub.billing_interval &&
                ` · ${sub.billing_interval === "year" ? "anual" : "mensal"}`}
            </p>
            {periodEnd && (
              <p className="text-xs text-muted-foreground">
                {sub.cancel_at_period_end
                  ? `Acesso até ${periodEnd} (renovação cancelada).`
                  : `Próxima cobrança em ${periodEnd}.`}
              </p>
            )}
          </div>
          <form action={createBillingPortalAction}>
            <Button type="submit" variant="outline">
              Gerenciar assinatura
            </Button>
          </form>
        </div>
        {sub.plan === "basico" && (
          <form action={createBillingPortalAction} className="border-t pt-3">
            <button
              type="submit"
              className="text-left text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              Precisa de mais carros ou domínio próprio?{" "}
              <span className="underline underline-offset-2">
                Faça upgrade para o Pro
              </span>
            </button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
