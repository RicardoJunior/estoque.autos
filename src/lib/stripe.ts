import Stripe from "stripe";

let client: Stripe | null = null;

/**
 * Client Stripe para o Worker (Cloudflare): HTTP via fetch — o
 * transporte Node padrão (node:http) não existe no runtime workerd.
 * Lazy para ler o secret no request, não no module init.
 */
export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY ausente no ambiente");
    client = new Stripe(key, {
      httpClient: Stripe.createFetchHttpClient(),
    });
  }
  return client;
}
