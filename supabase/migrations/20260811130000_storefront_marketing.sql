-- ============================================================
-- Marketing da vitrine:
--  • storefronts passa a expor `plan` — o layout público precisa
--    saber o plano para renderizar recursos Pro (pixels de
--    rastreamento) sem consultar tabelas privadas.
--    (t.plan é a cópia de conveniência mantida pelo billing-sync;
--    fonte da verdade segue subscriptions.)
--  • IDs de pixel e links sociais moram em tenants.settings
--    (tracking/social) — sem mudança de schema, só validação no app.
-- Mesma definição/gate de 20260811000001, com a coluna a mais.
-- ============================================================

create or replace view public.storefronts as
  select
    t.id, t.slug, t.name, t.phone, t.whatsapp, t.email, t.address,
    t.template_id, t.colors, t.logo_url, t.settings, t.plan
  from public.tenants t
  where t.slug = 'demo'
     or exists (
       select 1 from public.subscriptions s
       where s.tenant_id = t.id
         and s.status in ('active', 'trialing', 'past_due')
     );
