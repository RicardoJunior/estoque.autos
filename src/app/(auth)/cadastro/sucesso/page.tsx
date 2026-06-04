import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getSubscription, isSubscriptionActive } from "@/lib/auth";
import { syncFromCheckoutSession } from "@/lib/billing-sync";
import { buttonVariants } from "@/components/ui/button";

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

  const sub = await getSubscription();
  if (isSubscriptionActive(sub)) {
    redirect(session.tenant ? "/admin" : "/onboarding");
  }

  // pagamento ainda processando (atraso de confirmação)
  return (
    <>
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
