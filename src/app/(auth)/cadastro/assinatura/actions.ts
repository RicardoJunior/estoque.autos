"use server";

import { redirect } from "next/navigation";
import { getSession, getSubscription, isSubscriptionActive } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { isBillingInterval, isPlanId, stripePriceId } from "@/lib/billing";

/**
 * Cria a sessão do Stripe Checkout (assinatura) e redireciona.
 * user_id + plan vão no metadata da sessão E da assinatura — é o
 * que o webhook/fallback usam para gravar em subscriptions.
 */
export async function startCheckoutAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login?next=/cadastro/assinatura");

  // já assina? nada a cobrar
  const sub = await getSubscription();
  if (isSubscriptionActive(sub)) {
    redirect(session.tenant ? "/admin" : "/onboarding");
  }

  const planoRaw = String(formData.get("plano") || "");
  const plano = isPlanId(planoRaw) ? planoRaw : "basico";
  const intervaloRaw = String(formData.get("intervalo") || "");
  const intervalo = isBillingInterval(intervaloRaw) ? intervaloRaw : "mensal";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checkout = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: stripePriceId(plano, intervalo), quantity: 1 }],
    customer_email: session.email,
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
