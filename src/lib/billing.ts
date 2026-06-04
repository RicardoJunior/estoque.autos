// ============================================================
// Planos do estoque.autos — fonte única (landing, checkout, admin).
// Cada plano tem preço mensal e anual; os price ids do Stripe vêm
// de env (criados por scripts/stripe-setup.ts, um por intervalo).
// ============================================================

import type { PlanId } from "./types";

export const BILLING_INTERVALS = ["mensal", "anual"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export interface PlanInfo {
  id: PlanId;
  name: string;
  /** centavos (BRL) por intervalo de cobrança */
  priceCents: Record<BillingInterval, number>;
}

export const PLANS: Record<PlanId, PlanInfo> = {
  basico: {
    id: "basico",
    name: "Básico",
    priceCents: { mensal: 2490, anual: 19000 },
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceCents: { mensal: 4990, anual: 49000 },
  },
};

export function isPlanId(value: string | null | undefined): value is PlanId {
  return value === "basico" || value === "pro";
}

export function isBillingInterval(
  value: string | null | undefined,
): value is BillingInterval {
  return value === "mensal" || value === "anual";
}

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    // anuais são valores cheios (R$ 190) — sem ",00" desnecessário
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

/** "R$ 24,90/mês" ou "R$ 190/ano" */
export function formatPlanPrice(plan: PlanInfo, interval: BillingInterval): string {
  return `${formatCents(plan.priceCents[interval])}/${interval === "mensal" ? "mês" : "ano"}`;
}

/** Equivalente mensal do plano anual (ex.: 190/ano → R$ 15,83/mês). */
export function annualMonthlyEquivalent(plan: PlanInfo): string {
  return formatCents(Math.floor(plan.priceCents.anual / 12));
}

/** Desconto do anual vs 12x o mensal, em % inteiro (ex.: 36). */
export function annualSavingsPct(plan: PlanInfo): number {
  const yearAtMonthly = plan.priceCents.mensal * 12;
  return Math.round((1 - plan.priceCents.anual / yearAtMonthly) * 100);
}

/** Price id recorrente no Stripe (server-only; setado via env/secret). */
export function stripePriceId(plan: PlanId, interval: BillingInterval): string {
  const key = `STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()}`;
  const id = process.env[key];
  if (!id) {
    throw new Error(
      `${key} ausente — rode scripts/stripe-setup.ts e configure o env`,
    );
  }
  return id;
}
