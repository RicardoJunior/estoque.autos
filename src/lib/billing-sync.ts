import type Stripe from "stripe";
import { getStripe } from "./stripe";
import { createAdminClient } from "./supabase/admin";
import { isPlanId, portalsAllowed } from "./billing";
import { unpublishAllForTenant } from "./integrations/listings";
import type { PlanId } from "./types";

// ============================================================
// Sync Stripe → banco. Usado pelo webhook (prod) e pelo fallback
// síncrono da página de sucesso (dev sem `stripe listen`).
// ============================================================

/**
 * Plano a partir do price da assinatura — SÓ os nossos: price id igual ao
 * STRIPE_PRICE_* do env, ou lookup_key exato plano_{basico|pro}[_{mensal|anual}]
 * (legados só-mensais inclusos). A conta Stripe (Bytewell) é COMPARTILHADA com
 * imoveis.plus/simplenutri: o webhook recebe as assinaturas deles também, e um
 * fallback por metadata.plan ("pro" colide) tentaria gravar user_id estranho →
 * FK falha → 500 → Stripe reenvia em loop. Evento de outro produto retorna
 * null e é ignorado com 200.
 */
function planFromSubscription(sub: Stripe.Subscription): PlanId | null {
  const price = sub.items.data[0]?.price;
  if (!price) return null;
  for (const plan of ["basico", "pro"] as const) {
    for (const interval of ["MENSAL", "ANUAL"]) {
      const id = process.env[`STRIPE_PRICE_${plan.toUpperCase()}_${interval}`];
      if (id && id === price.id) return plan;
    }
  }
  const fromLookup = (price.lookup_key ?? "").match(
    /^plano_(basico|pro)(?:_(?:mensal|anual))?$/,
  )?.[1];
  return isPlanId(fromLookup) ? fromLookup : null;
}

/**
 * Upsert da assinatura + sync do vínculo/plano da loja (se já houver).
 * `userId` vem do metadata do Checkout; nos eventos de subscription
 * posteriores é resolvido pela linha já gravada.
 */
export async function syncStripeSubscription(
  sub: Stripe.Subscription,
  userId?: string,
): Promise<void> {
  const admin = createAdminClient();
  const plan = planFromSubscription(sub);

  // API dahlia: current_period_end mora no subscription item
  const item = sub.items.data[0];
  const periodEnd = item?.current_period_end;
  const interval = item?.price?.recurring?.interval ?? null;
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  let uid = userId ?? sub.metadata?.user_id;
  if (!uid) {
    const { data } = await admin
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", sub.id)
      .maybeSingle();
    uid = data?.user_id;
  }
  if (!plan) {
    // price de outro produto da conta compartilhada — não é nosso
    return;
  }
  if (!uid) {
    console.warn("billing-sync: assinatura sem user_id", sub.id);
    return;
  }

  // Multi-loja: cada assinatura Stripe é uma linha própria, chaveada por
  // stripe_subscription_id (o vínculo com a loja acontece no create_tenant
  // e é preservado aqui — tenant_id fica FORA do payload de upsert).
  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: uid,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      plan,
      status: sub.status,
      billing_interval: interval === "month" || interval === "year" ? interval : null,
      current_period_end: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
      cancel_at_period_end: sub.cancel_at_period_end,
    },
    { onConflict: "stripe_subscription_id" },
  );
  if (error) throw new Error(`billing-sync: upsert falhou — ${error.message}`);

  // assinatura já ligada a uma loja? espelha o plano (upgrade/downgrade
  // via Billing Portal chega por aqui)
  const { data: row } = await admin
    .from("subscriptions")
    .select("tenant_id")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();
  if (row?.tenant_id) {
    const { data: before } = await admin
      .from("tenants")
      .select("plan")
      .eq("id", row.tenant_id)
      .maybeSingle();
    await admin.from("tenants").update({ plan }).eq("id", row.tenant_id);

    // Portais: assinatura encerrada (canceled/unpaid/incomplete_expired)
    // ou downgrade para plano sem portais → tira os anúncios do ar e
    // desconecta (senão ficam anúncios órfãos apontando para uma VDP 404).
    // past_due mantém — mesma tolerância da vitrine.
    const lost = ["canceled", "unpaid", "incomplete_expired"].includes(sub.status);
    const downgraded = !portalsAllowed(plan) && before?.plan != null && portalsAllowed(before.plan as PlanId);
    if (lost || downgraded) {
      try {
        await unpublishAllForTenant(admin, row.tenant_id, true);
      } catch (err) {
        console.error("billing-sync: unpublishAllForTenant falhou", err);
      }
    }
  }
}

/**
 * Fallback síncrono pós-Checkout: confirma a sessão direto na API
 * e grava a assinatura — mesma escrita do webhook, idempotente.
 * Garante onboarding imediato em dev (sem stripe listen) e cobre
 * atraso de entrega do webhook em prod.
 */
export async function syncFromCheckoutSession(
  sessionId: string,
): Promise<string | null> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });
  if (session.status !== "complete" || !session.subscription) return null;

  const sub = session.subscription as Stripe.Subscription;
  await syncStripeSubscription(sub, session.metadata?.user_id);
  return sub.status;
}
