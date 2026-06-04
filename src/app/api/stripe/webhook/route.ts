import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { syncStripeSubscription } from "@/lib/billing-sync";

// SubtleCrypto: verificação de assinatura compatível com Workers
// (a variante síncrona usa node:crypto, que não existe no workerd).
const cryptoProvider = Stripe.createSubtleCryptoProvider();

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) {
    return new Response("webhook não configurado", { status: 400 });
  }

  // corpo CRU — qualquer parse antes da verificação quebra o HMAC
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(
      payload,
      signature,
      secret,
      undefined,
      cryptoProvider,
    );
  } catch {
    return new Response("assinatura inválida", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription) {
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
        const sub = await getStripe().subscriptions.retrieve(subId);
        await syncStripeSubscription(sub, session.metadata?.user_id);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await syncStripeSubscription(event.data.object as Stripe.Subscription);
      break;
    }
    // demais eventos: ack sem ação
  }

  return Response.json({ received: true });
}
