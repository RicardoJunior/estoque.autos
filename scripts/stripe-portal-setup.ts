// ============================================================
// Cria/atualiza (idempotente) a configuração do Stripe Billing
// Portal usada pelo app: cancelamento ao fim do ciclo, troca de
// cartão, histórico de faturas e TROCA DE PLANO entre os prices
// Básico/Pro (mensal e anual) com pro-rata.
//
// Sem isso, billingPortal.sessions.create usa o default do
// dashboard (que pode nem existir) e o upgrade prometido na UI
// não aparece.
//
// Uso:
//   npx tsx scripts/stripe-portal-setup.ts
//
// Saída: STRIPE_PORTAL_CONFIGURATION_ID para o .env.local /
// secrets da Cloudflare.
// ============================================================

import Stripe from "stripe";

try {
  process.loadEnvFile(".env.local");
} catch {
  // sem .env.local (CI) — env já vem do ambiente
}

const LOOKUP_KEYS = [
  "plano_basico_mensal",
  "plano_basico_anual",
  "plano_pro_mensal",
  "plano_pro_anual",
];

const CONFIG_MARKER = "estoque-autos-portal";

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("Defina STRIPE_SECRET_KEY (sk_test_... para ambiente de teste).");
    process.exit(1);
  }
  const stripe = new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
  const appUrl = "https://estoque.autos";

  const prices = await stripe.prices.list({
    lookup_keys: [...LOOKUP_KEYS],
    expand: ["data.product"],
  });
  if (prices.data.length !== LOOKUP_KEYS.length) {
    console.error(
      `Esperava ${LOOKUP_KEYS.length} prices (rode scripts/stripe-setup.ts antes); achei ${prices.data.length}.`,
    );
    process.exit(1);
  }

  // agrupa prices por produto (Básico e Pro)
  const byProduct = new Map<string, string[]>();
  for (const price of prices.data) {
    const productId =
      typeof price.product === "string" ? price.product : price.product.id;
    byProduct.set(productId, [...(byProduct.get(productId) ?? []), price.id]);
  }

  const params: Stripe.BillingPortal.ConfigurationCreateParams = {
    business_profile: {
      headline: "estoque.autos — assinatura da sua loja",
      privacy_policy_url: `${appUrl}/privacidade`,
      terms_of_service_url: `${appUrl}/termos`,
    },
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
        cancellation_reason: {
          enabled: true,
          options: ["too_expensive", "missing_features", "unused", "other"],
        },
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"],
        proration_behavior: "create_prorations",
        products: [...byProduct.entries()].map(([product, priceIds]) => ({
          product,
          prices: priceIds,
        })),
      },
    },
    metadata: { app: CONFIG_MARKER },
  };

  // idempotência: reaproveita a configuração marcada com nosso metadata
  const existing = await stripe.billingPortal.configurations.list({ limit: 100 });
  const ours = existing.data.find((c) => c.metadata?.app === CONFIG_MARKER);

  const config = ours
    ? await stripe.billingPortal.configurations.update(ours.id, params)
    : await stripe.billingPortal.configurations.create(params);

  console.log(`${ours ? "Atualizada" : "Criada"} configuração do Billing Portal:`);
  console.log(`STRIPE_PORTAL_CONFIGURATION_ID="${config.id}"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
