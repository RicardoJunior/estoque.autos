-- ============================================================
-- Vitrine pública só com assinatura vigente.
--
-- Os Termos e a ajuda prometem: cancelou/terminou o período pago,
-- a vitrine sai do ar. Este gate aplica isso nas TRÊS portas de
-- leitura pública: storefronts, vehicles_public e a resolução de
-- domínio próprio. past_due entra na janela de tolerância (retry
-- automático do Stripe) — o admin já fica bloqueado nesse estado,
-- mas o site do lojista não some por um cartão recusado ontem.
--
-- 'demo' é a vitrine de demonstração da plataforma (seed local /
-- showcase) e fica fora do gate; reservado para ninguém reivindicar.
-- ============================================================

insert into public.reserved_slugs (slug) values ('demo')
on conflict do nothing;

create or replace view public.storefronts as
  select
    t.id, t.slug, t.name, t.phone, t.whatsapp, t.email, t.address,
    t.template_id, t.colors, t.logo_url, t.settings
  from public.tenants t
  where t.slug = 'demo'
     or exists (
       select 1 from public.subscriptions s
       where s.tenant_id = t.id
         and s.status in ('active', 'trialing', 'past_due')
     );

create or replace view public.vehicles_public as
  select
    v.id, v.tenant_id, v.brand, v.model, v.version, v.year_fab, v.year_model,
    v.color, v.fuel, v.transmission, v.mileage, v.doors, v.category, v.price,
    v.description, v.optionals, v.photos, v.featured, v.status, v.created_at,
    v.fipe_price, v.fipe_reference
  from public.vehicles v
  where v.status in ('available', 'reserved')
    and exists (
      select 1 from public.tenants t
      where t.id = v.tenant_id
        and (
          t.slug = 'demo'
          or exists (
            select 1 from public.subscriptions s
            where s.tenant_id = t.id
              and s.status in ('active', 'trialing', 'past_due')
          )
        )
    );

create or replace function public.custom_domain_lookup(p_host text)
returns text
language sql
stable
security definer set search_path = public
as $$
  select t.slug
  from public.tenants t
  where t.custom_domain = lower(btrim(p_host))
    and t.custom_domain_status = 'active'
    and exists (
      select 1 from public.subscriptions s
      where s.tenant_id = t.id
        and s.status in ('active', 'trialing', 'past_due')
    )
  limit 1;
$$;
