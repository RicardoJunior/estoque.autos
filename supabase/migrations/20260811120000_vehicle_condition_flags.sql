-- ============================================================
-- Marcadores de condição do anúncio (estilo Webmotors): Blindado,
-- IPVA pago, Único dono, Leilão, Cautelar aprovada, etc.
-- text[] com CHECK de valores conhecidos (lista espelhada em
-- src/lib/types.ts VEHICLE_FLAGS). Leilão/alienado são divulgação
-- de procedência — a UI trata com tom de aviso.
-- ============================================================

alter table public.vehicles
  add column condition_flags text[] not null default '{}';

alter table public.vehicles
  add constraint vehicles_condition_flags_check check (
    condition_flags <@ array[
      'unico_dono',
      'ipva_pago',
      'licenciado',
      'blindado',
      'leilao',
      'cautelar_aprovada',
      'garantia_fabrica',
      'revisoes_concessionaria',
      'revisoes_agenda',
      'aceita_troca',
      'alienado',
      'adaptado_pcd'
    ]::text[]
  );

-- vitrine pública mostra os marcadores: recria a view com a coluna
-- (mesma definição do gate de assinatura de 20260811000001)
create or replace view public.vehicles_public as
  select
    v.id, v.tenant_id, v.brand, v.model, v.version, v.year_fab, v.year_model,
    v.color, v.fuel, v.transmission, v.mileage, v.doors, v.category, v.price,
    v.description, v.optionals, v.photos, v.featured, v.status, v.created_at,
    v.fipe_price, v.fipe_reference, v.condition_flags
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
