// ============================================================
// Cria (idempotente) os produtos/preços dos planos no Stripe.
// Cada plano tem preço MENSAL e ANUAL, identificados por price
// lookup_key (plano_{plano}_{intervalo}); rodar de novo reaproveita
// o que já existe. Lookup keys legados (plano_basico/plano_pro, da
// 1ª versão só-mensal) são arquivados — assinaturas existentes
// neles continuam valendo.
//
// Uso:
//   STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/stripe-setup.ts
//
// Saída: as linhas STRIPE_PRICE_* para colar no .env.local /
// secrets da Cloudflare.
// ============================================================

import Stripe from "stripe";

try {
  process.loadEnvFile(".env.local");
} catch {
  // sem .env.local (CI) — env já vem do ambiente
}

// Mantido em sincronia com src/lib/billing.ts (PLANS). Duplicado de
// propósito: script standalone, sem resolver aliases do app.
const PRODUCTS = [
  {
    plan: "basico",
    name: "estoque.autos Básico",
    prices: [
      { interval: "mensal", recurring: "month", amountCents: 2490 },
      { interval: "anual", recurring: "year", amountCents: 19000 },
    ],
  },
  {
    plan: "pro",
    name: "estoque.autos Pro",
    prices: [
      { interval: "mensal", recurring: "month", amountCents: 4990 },
      { interval: "anual", recurring: "year", amountCents: 49000 },
    ],
  },
] as const;

const LEGACY_LOOKUP_KEYS = ["plano_basico", "plano_pro"];

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("Defina STRIPE_SECRET_KEY (sk_test_... para ambiente de teste).");
    process.exit(1);
  }
  const stripe = new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });

  const envLines: string[] = [];

  for (const product of PRODUCTS) {
    let productId: string | null = null;

    for (const price of product.prices) {
      const lookupKey = `plano_${product.plan}_${price.interval}`;
      const existing = await stripe.prices.list({
        lookup_keys: [lookupKey],
        active: true,
        limit: 1,
      });

      let priceObj = existing.data[0];
      if (priceObj) {
        productId =
          typeof priceObj.product === "string"
            ? priceObj.product
            : priceObj.product.id;
        console.log(`✓ price já existe: ${product.name} ${price.interval} → ${priceObj.id}`);
      } else {
        if (!productId) {
          const found = await stripe.products.search({
            query: `metadata['plan']:'${product.plan}' AND active:'true'`,
            limit: 1,
          });
          productId =
            found.data[0]?.id ??
            (
              await stripe.products.create({
                name: product.name,
                metadata: { plan: product.plan },
              })
            ).id;
        }
        priceObj = await stripe.prices.create({
          product: productId,
          currency: "brl",
          unit_amount: price.amountCents,
          recurring: { interval: price.recurring },
          lookup_key: lookupKey,
          metadata: { plan: product.plan, interval: price.interval },
        });
        console.log(
          `+ criado: ${product.name} ${price.interval} (R$ ${(price.amountCents / 100).toFixed(2)}/${price.recurring === "month" ? "mês" : "ano"}) → ${priceObj.id}`,
        );
      }

      envLines.push(
        `STRIPE_PRICE_${product.plan.toUpperCase()}_${price.interval.toUpperCase()}=${priceObj.id}`,
      );
    }
  }

  // arquiva os prices legados só-mensais (não afeta assinaturas ativas)
  const legacy = await stripe.prices.list({
    lookup_keys: LEGACY_LOOKUP_KEYS,
    active: true,
    limit: 10,
  });
  for (const price of legacy.data) {
    await stripe.prices.update(price.id, { active: false });
    console.log(`− arquivado price legado: ${price.lookup_key} (${price.id})`);
  }

  console.log("\nAdicione ao .env.local (dev) e aos secrets da Cloudflare (prod):\n");
  for (const line of envLines) console.log(line);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
