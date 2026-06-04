-- ============================================================
-- Planos mensal + anual: registra o intervalo de cobrança da
-- assinatura (vem do price do Stripe; month = mensal, year = anual).
-- O plano de acesso continua sendo subscriptions.plan.
-- ============================================================

alter table public.subscriptions
  add column billing_interval text
  check (billing_interval in ('month','year'));
