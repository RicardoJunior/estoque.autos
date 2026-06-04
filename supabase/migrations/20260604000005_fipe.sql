-- ============================================================
-- Estoque.autos v2 — FIPE (referência global de marca/modelo/ano
-- + preço com mês de referência)
--
-- A FIPE muda TODO MÊS. Estratégia (rate limit do parallelum):
--  • seed da estrutura: brands + models dos 3 tipos (scripts/seed-fipe.ts)
--  • years e preço: on-demand com cache nestas tabelas (rotas /api/fipe)
--  • sync mensal: refetch só dos fipe_codes em uso por veículos
--    (scripts/fipe-sync.ts via cron, fora do Worker)
--
-- Dados GLOBAIS (não pertencem a tenant): leitura para authenticated;
-- escrita só via service role (seed/cron/cache de rota) — mesma
-- exceção documentada na migration de billing.
-- ============================================================

create table public.fipe_brands (
  vehicle_type text not null check (vehicle_type in ('carros','motos','caminhoes')),
  id           text not null,            -- código do parallelum (ex.: "59")
  name         text not null,
  primary key (vehicle_type, id)
);

create table public.fipe_models (
  vehicle_type text not null,
  brand_id     text not null,
  id           text not null,
  name         text not null,
  primary key (vehicle_type, brand_id, id),
  foreign key (vehicle_type, brand_id)
    references public.fipe_brands (vehicle_type, id) on delete cascade
);

create table public.fipe_years (
  vehicle_type text not null,
  brand_id     text not null,
  model_id     text not null,
  id           text not null,            -- yearCode (ex.: "2014-3")
  name         text not null,            -- ex.: "2014 Diesel"
  primary key (vehicle_type, brand_id, model_id, id),
  foreign key (vehicle_type, brand_id, model_id)
    references public.fipe_models (vehicle_type, brand_id, id) on delete cascade
);

-- Preço por (versão, mês de referência) — histórico preservado;
-- o mais recente por fetched_at é o vigente.
create table public.fipe_prices (
  id           uuid primary key default gen_random_uuid(),
  vehicle_type text not null,
  brand_id     text not null,
  model_id     text not null,
  year_id      text not null,
  fipe_code    text not null,            -- "001234-5"
  price        numeric(12,2) not null,
  brand_name   text,
  model_name   text,
  year_model   int,
  fuel         text,
  reference    text not null,            -- MesReferencia (ex.: "junho de 2026")
  fetched_at   timestamptz not null default now(),
  unique (vehicle_type, brand_id, model_id, year_id, reference)
);

create index fipe_prices_lookup_idx
  on public.fipe_prices (vehicle_type, brand_id, model_id, year_id, fetched_at desc);
create index fipe_prices_code_idx
  on public.fipe_prices (fipe_code, fetched_at desc);

-- Última referência sincronizada por tipo (controle do cron mensal).
create table public.fipe_sync_meta (
  vehicle_type text primary key check (vehicle_type in ('carros','motos','caminhoes')),
  reference    text,
  synced_at    timestamptz
);

alter table public.fipe_brands    enable row level security;
alter table public.fipe_models    enable row level security;
alter table public.fipe_years     enable row level security;
alter table public.fipe_prices    enable row level security;
alter table public.fipe_sync_meta enable row level security;

-- leitura para logados (cadastro de veículo); escrita sem policy
-- de propósito (só service role)
create policy "fipe_brands_read"    on public.fipe_brands    for select to authenticated using (true);
create policy "fipe_models_read"    on public.fipe_models    for select to authenticated using (true);
create policy "fipe_years_read"     on public.fipe_years     for select to authenticated using (true);
create policy "fipe_prices_read"    on public.fipe_prices    for select to authenticated using (true);
create policy "fipe_sync_meta_read" on public.fipe_sync_meta for select to authenticated using (true);

-- ------------------------------------------------------------
-- Snapshot FIPE no veículo (fallback manual continua: tudo nullable)
-- ------------------------------------------------------------
alter table public.vehicles
  add column fipe_code      text,
  add column fipe_year_id   text,
  add column fipe_price     numeric(12,2) check (fipe_price >= 0),
  add column fipe_reference text;

-- A vitrine pública mostra a referência FIPE (estilo Webmotors):
-- recria a view com as novas colunas (continua SEM plate/sold_at).
create or replace view public.vehicles_public as
  select
    id, tenant_id, brand, model, version, year_fab, year_model,
    color, fuel, transmission, mileage, doors, category, price,
    description, optionals, photos, featured, status, created_at,
    fipe_price, fipe_reference
  from public.vehicles
  where status in ('available', 'reserved');
