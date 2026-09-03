import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getSession,
  getUnlinkedSubscription,
  isSubscriptionActive,
} from "@/lib/auth";
import { syncFromCheckoutSession } from "@/lib/billing-sync";
import { buttonVariants } from "@/components/ui/button";
import { FunnelEvent } from "@/components/FunnelEvent";
import { AnalyticsUser } from "@/components/AnalyticsUser";

export const metadata = { title: "Pagamento" };

/**
 * Volta do Stripe Checkout. Confirma a sessão direto na API
 * (fallback síncrono — não depende do webhook ter chegado) e
 * manda pro onboarding.
 */
export default async function SucessoPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { session_id } = await searchParams;
  if (session_id) {
    try {
      await syncFromCheckoutSession(session_id);
    } catch (err) {
      // webhook ainda pode confirmar; segue para o estado de espera
      console.error("cadastro/sucesso: sync falhou", err);
    }
  }

  // a assinatura recém-paga ainda não tem loja — o onboarding a consome
  const sub = await getUnlinkedSubscription();
  if (isSubscriptionActive(sub)) {
    // ?assinatura=ok → o onboarding dispara purchase (GA4/Meta) 1x
    redirect("/onboarding?assinatura=ok");
  }

  // pagamento ainda processando (atraso de confirmação)
  return (
    <>
      <AnalyticsUser id={session.userId} />
      {/* voltou do Stripe sem assinatura ativa: purchase pode nunca disparar */}
      <FunnelEvent
        name="purchase_pending"
        dedupeKey={session_id ?? session.userId}
        params={{ error_type: session_id ? "sync_pending" : "no_session_id" }}
      />
      <h1 className="text-xl font-bold">Processando seu pagamento…</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Isso costuma levar só alguns segundos. Atualize a página — assim
        que a assinatura for confirmada, você segue para criar sua loja.
      </p>
      <Link
        href={session_id ? `/cadastro/sucesso?session_id=${session_id}` : "/cadastro/sucesso"}
        className={buttonVariants({ className: "mt-6 w-full" })}
      >
        Já paguei — verificar de novo
      </Link>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Problemas com o pagamento?{" "}
        <Link href="/cadastro/assinatura" className="text-primary hover:underline">
          Tentar novamente
        </Link>
      </p>
    </>
  );
}
