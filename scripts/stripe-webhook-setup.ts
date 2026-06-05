// ============================================================
// Cria (idempotente) o webhook endpoint do Stripe para o app em
// produção e imprime o signing secret (whsec_...) para configurar
// como secret na Cloudflare.
//
// Uso:
//   npx tsx scripts/stripe-webhook-setup.ts https://estoque.autos
//
// Env: STRIPE_SECRET_KEY (carrega .env.local se existir).
// ============================================================

import Stripe from "stripe";

try {
  process.loadEnvFile(".env.local");
} catch {
  // sem .env.local (CI) — env já vem do ambiente
}

const EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("Defina STRIPE_SECRET_KEY.");
    process.exit(1);
  }
  const appUrl = process.argv[2]?.replace(/\/$/, "");
  if (!appUrl?.startsWith("https://")) {
    console.error("Uso: npx tsx scripts/stripe-webhook-setup.ts https://seu-dominio");
    process.exit(1);
  }
  const url = `${appUrl}/api/stripe/webhook`;
  const stripe = new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });

  const existing = await stripe.webhookEndpoints.list({ limit: 100 });
  const found = existing.data.find((w) => w.url === url);
  if (found) {
    console.log(`✓ webhook já existe: ${found.id} → ${url}`);
    console.log("  (o secret só é exibido na criação — para obter um novo, delete e rode de novo)");
    return;
  }

  const webhook = await stripe.webhookEndpoints.create({
    url,
    enabled_events: EVENTS,
    description: "estoque.autos — assinatura/checkout",
  });

  console.log(`+ webhook criado: ${webhook.id} → ${url}`);
  console.log(`\nSTRIPE_WEBHOOK_SECRET=${webhook.secret}`);
  console.log("\n(configure como SECRET na Cloudflare: wrangler secret put STRIPE_WEBHOOK_SECRET)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
