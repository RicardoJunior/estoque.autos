"use server";

import { redirect } from "next/navigation";
import {
  getLatestSubscription,
  getSession,
  getUnlinkedSubscription,
  isSubscriptionActive,
} from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { isBillingInterval, isPlanId, stripePriceId } from "@/lib/billing";

/**
 * Status em que a assinatura existente segue viva no Stripe e pode ser
 * recuperada (pagar fatura pendente / trocar cartão). Abrir um NOVO
 * checkout aqui criaria uma segunda assinatura — e o retry automático
 * do Stripe poderia reativar a antiga → dupla cobrança.
 */
const RECOVERABLE_STATUSES = ["past_due", "unpaid", "incomplete"];

/**
 * Cria a sessão do Stripe Checkout (assinatura) e redireciona.
 * user_id + plan vão no metadata da sessão E da assinatura — é o
 * que o webhook/fallback usam para gravar em subscriptions.
 * Se já existe assinatura recuperável, manda pro Billing Portal.
 */
export async function startCheckoutAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login?next=/cadastro/assinatura");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // assinatura paga aguardando loja? termina o onboarding em vez de
  // cobrar de novo (multi-loja: quem já tem loja PODE assinar outra)
  const unlinked = await getUnlinkedSubscription();
  if (isSubscriptionActive(unlinked)) {
    redirect("/onboarding");
  }

  // pagamento pendente em qualquer assinatura do usuário: resolve no
  // portal (fatura/cartão) antes de abrir novo checkout — dupla cobrança
  const latest = await getLatestSubscription();
  const sub =
    unlinked && RECOVERABLE_STATUSES.includes(unlinked.status)
      ? unlinked
      : latest && RECOVERABLE_STATUSES.includes(latest.status)
        ? latest
        : null;
  if (sub) {
    const portal = await getStripe().billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${appUrl}/admin/configuracoes`,
      locale: "pt-BR",
      // config com troca de plano/cancelamento (scripts/stripe-portal-setup.ts)
      configuration: process.env.STRIPE_PORTAL_CONFIGURATION_ID || undefined,
    });
    redirect(portal.url);
  }

  const planoRaw = String(formData.get("plano") || "");
  const plano = isPlanId(planoRaw) ? planoRaw : "basico";
  const intervaloRaw = String(formData.get("intervalo") || "");
  const intervalo = isBillingInterval(intervaloRaw) ? intervaloRaw : "mensal";

  const checkout = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: stripePriceId(plano, intervalo), quantity: 1 }],
    // customer conhecido (ex.: assinatura cancelada ou de outra loja) é
    // reaproveitado — customer_email criaria um SEGUNDO customer no Stripe.
    ...(latest
      ? { customer: latest.stripe_customer_id }
      : { customer_email: session.email }),
    metadata: { user_id: session.userId, plan: plano, interval: intervalo },
    subscription_data: {
      metadata: { user_id: session.userId, plan: plano, interval: intervalo },
    },
    success_url: `${appUrl}/cadastro/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/#planos`,
    locale: "pt-BR",
    allow_promotion_codes: true,
  });

  if (!checkout.url) {
    throw new Error("Stripe Checkout não retornou URL");
  }
  redirect(checkout.url);
}
