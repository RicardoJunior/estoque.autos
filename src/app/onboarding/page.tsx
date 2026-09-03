import { redirect } from "next/navigation";
import {
  getSession,
  getUnlinkedSubscription,
  isSubscriptionActive,
} from "@/lib/auth";
import { PLANS } from "@/lib/billing";
import { FunnelEvent } from "@/components/FunnelEvent";
import { AnalyticsUser } from "@/components/AnalyticsUser";
import { OnboardingWizard } from "./OnboardingWizard";

export const metadata = {
  title: "Criar minha loja",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ assinatura?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  // plano-primeiro: cada loja nasce de uma assinatura ainda sem loja
  // (o RPC create_tenant também barra no banco; aqui é UX)
  const sub = await getUnlinkedSubscription();
  if (!isSubscriptionActive(sub)) {
    redirect(session.memberships.length > 0 ? "/admin" : "/cadastro/assinatura");
  }

  const { assinatura } = await searchParams;
  const interval = sub!.billing_interval === "year" ? "anual" : "mensal";
  return (
    <>
      <AnalyticsUser id={session.userId} />
      {assinatura === "ok" && (
        <FunnelEvent
          name="purchase"
          dedupeKey={sub!.stripe_subscription_id}
          params={{
            value: PLANS[sub!.plan].priceCents[interval] / 100,
            plan: sub!.plan,
            interval,
            transaction_id: sub!.stripe_subscription_id,
          }}
        />
      )}
      <OnboardingWizard />
    </>
  );
}
