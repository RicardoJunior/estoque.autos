-- ============================================================
-- Integração com portais de anúncios (docs/integracoes-portais.md)
--
--  • portal_connections: credenciais (cifradas no app) e estado da
--    conexão de cada loja com cada portal.
--  • portal_listings: estado explícito por (veículo, portal).
--  • portal_sync_jobs: fila em tabela (claim com skip locked).
--  • portal_events: webhooks crus, sempre aceitos com 200.
--  • portal_taxonomy(_map): catálogos dos portais e o mapeamento
--    "nosso valor → id do portal".
--  • vehicles/tenants/leads ganham os campos que os portais exigem.
--
-- RLS: tabelas de credencial/fila/evento/taxonomia SEM policy para
-- anon/authenticated (só o service role, no servidor). portal_listings
-- é legível por membro da loja (a UI mostra status e link).
-- ============================================================

create extension if not exists pg_trgm with schema extensions;

-- ------------------------------------------------------------
-- CONEXÕES
-- ------------------------------------------------------------
create table public.portal_connections (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  portal              text not null check (portal in
                        ('mercadolivre','olx','webmotors','chavesnamao','usadosbr','meta_catalog')),
  status              text not null default 'pending'
                      check (status in ('pending','active','needs_plan','error','disconnected')),
  external_account_id text,            -- ML user_id · OLX account · Webmotors CNPJ
  -- AES-256-GCM (src/lib/integrations/crypto.ts): base64 do ciphertext
  -- e do IV; key_version permite rotação da chave. Nunca sai do servidor.
  credentials         text,
  credentials_iv      text,
  key_version         int not null default 1,
  token_expires_at    timestamptz,     -- ML: 6h; agenda refresh_token
  settings            jsonb not null default '{}'::jsonb,
                      -- {auto_publish, listing_type, unpublish_on_reserved,
                      --  phone_override, feed_token, webhook_secret}
  last_error          text,
  last_ok_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (tenant_id, portal)
);

create index portal_connections_account_idx
  on public.portal_connections (portal, external_account_id);
create index portal_connections_feed_token_idx
  on public.portal_connections ((settings ->> 'feed_token'))
  where settings ? 'feed_token';

create trigger portal_connections_updated_at
  before update on public.portal_connections
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- ANÚNCIOS POR PORTAL
-- ------------------------------------------------------------
create table public.portal_listings (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  vehicle_id       uuid not null references public.vehicles(id) on delete cascade,
  portal           text not null,
  desired          boolean not null default true,   -- lojista quer este carro neste portal
  status           text not null default 'queued'
                   check (status in ('queued','publishing','active','paused','error','removed','rejected')),
  external_id      text,            -- MLB123 · OLX id do anúncio · Webmotors código
  external_url     text,
  content_hash     text,            -- hash do payload canônico; evita sync sem mudança
  payload_snapshot jsonb,           -- último payload enviado (debug/suporte)
  expires_at       timestamptz,     -- ML: 180 dias
  last_error       text,
  error_details    jsonb,           -- mapeamento pendente: {kind, name, localKey, parent, candidates}
  last_synced_at   timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (vehicle_id, portal)
);

create index portal_listings_tenant_idx on public.portal_listings (tenant_id, portal, status);
create index portal_listings_external_idx on public.portal_listings (portal, external_id)
  where external_id is not null;

create trigger portal_listings_updated_at
  before update on public.portal_listings
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- FILA
-- ------------------------------------------------------------
create table public.portal_sync_jobs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references public.tenants(id) on delete cascade,
  portal      text not null,
  vehicle_id  uuid references public.vehicles(id) on delete cascade,
  kind        text not null check (kind in
              ('publish','update','unpublish','sync_tenant','refresh_token',
               'sync_taxonomy','process_event','fetch_leads','renew','photos_jpeg')),
  payload     jsonb not null default '{}'::jsonb,
  status      text not null default 'pending'
              check (status in ('pending','running','done','failed','dead')),
  attempts    int not null default 0,
  run_after   timestamptz not null default now(),
  locked_at   timestamptz,
  locked_by   text,
  last_error  text,
  created_at  timestamptz not null default now(),
  finished_at timestamptz
);

create index portal_sync_jobs_due_idx on public.portal_sync_jobs (run_after)
  where status = 'pending';
create index portal_sync_jobs_tenant_idx on public.portal_sync_jobs (tenant_id, created_at desc);

-- coalesce: no máximo um job pendente por (portal, loja, veículo, tipo).
-- Jobs de loja (sync_tenant, refresh_token…) têm vehicle_id nulo; jobs
-- globais (sync_taxonomy) têm os dois nulos — o coalesce evita que NULL
-- escape do unique.
create unique index portal_sync_jobs_dedupe_idx
  on public.portal_sync_jobs (
    portal,
    coalesce(tenant_id,  '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(vehicle_id, '00000000-0000-0000-0000-000000000000'::uuid),
    kind
  )
  where status = 'pending';

-- ------------------------------------------------------------
-- EVENTOS (webhooks crus)
-- ------------------------------------------------------------
create table public.portal_events (
  id           uuid primary key default gen_random_uuid(),
  portal       text not null,
  tenant_id    uuid references public.tenants(id) on delete set null,
  external_key text,                          -- idempotência (id do evento/lead no portal)
  headers      jsonb,
  body         jsonb not null,
  received_at  timestamptz not null default now(),
  processed_at timestamptz,
  status       text not null default 'pending' check (status in ('pending','done','ignored','failed')),
  error        text
);

create unique index portal_events_external_idx on public.portal_events (portal, external_key)
  where external_key is not null;
create index portal_events_pending_idx on public.portal_events (received_at)
  where status = 'pending';

-- ------------------------------------------------------------
-- TAXONOMIA (catálogos dos portais — global, como fipe_*)
-- ------------------------------------------------------------
create table public.portal_taxonomy (
  portal       text not null,
  kind         text not null,                  -- brand|model|version|color|fuel|transmission|feature|body|city
  external_id  text not null,
  parent_id    text,
  name         text not null,
  meta         jsonb,
  synced_at    timestamptz not null default now(),
  primary key (portal, kind, external_id)
);

create index portal_taxonomy_name_trgm_idx
  on public.portal_taxonomy using gin (name extensions.gin_trgm_ops);
create index portal_taxonomy_parent_idx on public.portal_taxonomy (portal, kind, parent_id);

create table public.portal_taxonomy_map (
  id          uuid primary key default gen_random_uuid(),
  portal      text not null,
  kind        text not null,
  local_key   text not null,                   -- fipe id, ou valor normalizado (cor, combustível…)
  external_id text not null,
  confidence  numeric(3,2) not null default 1, -- 1 = exato/manual; <1 = fuzzy
  source      text not null default 'auto' check (source in ('auto','manual')),
  tenant_id   uuid references public.tenants(id) on delete cascade, -- null = global
  created_at  timestamptz not null default now()
);

-- um mapeamento por (portal, tipo, chave) global e um override por loja
create unique index portal_taxonomy_map_key_idx
  on public.portal_taxonomy_map (
    portal, kind, local_key,
    coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

-- ------------------------------------------------------------
-- VEÍCULOS: campos que os portais exigem
-- ------------------------------------------------------------
alter table public.vehicles
  add column body_type text check (body_type in
    ('hatch','sedan','suv','picape','perua','minivan','cupe','conversivel','van','utilitario','outro')),
  add column engine    text check (char_length(engine) <= 40),   -- "1.0", "2.0 turbo", "1.6 16V"
  add column steering  text check (steering in ('hidraulica','eletrica','mecanica','assistida')),
  add column vin_last6 text check (vin_last6 ~ '^[A-Z0-9]{6}$'),
  add column video_url text check (char_length(video_url) <= 300), -- YouTube
  add column zero_km   boolean not null default false;

-- vitrine pública: projeta os campos públicos novos (vin_last6 fica interno)
create or replace view public.vehicles_public as
  select
    v.id, v.tenant_id, v.brand, v.model, v.version, v.year_fab, v.year_model,
    v.color, v.fuel, v.transmission, v.mileage, v.doors, v.category, v.price,
    v.description, v.optionals, v.photos, v.featured, v.status, v.created_at,
    v.fipe_price, v.fipe_reference, v.condition_flags,
    v.body_type, v.engine, v.steering, v.video_url, v.zero_km
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

-- ------------------------------------------------------------
-- LOJA: CNPJ (exigido por Webmotors e Mercado Livre)
-- ------------------------------------------------------------
alter table public.tenants add column cnpj text check (cnpj ~ '^\d{14}$');

-- ------------------------------------------------------------
-- LEADS vindos de portais
-- ------------------------------------------------------------
alter table public.leads
  add column source       text not null default 'site'
              check (source in ('site','mercadolivre','olx','webmotors','chavesnamao','usadosbr','meta')),
  add column channel      text,     -- contact_type cru do portal (whatsapp, call, question, chat…)
  add column external_id  text,
  add column external_url text,
  add column raw          jsonb;

alter table public.leads drop constraint leads_type_check;
alter table public.leads add constraint leads_type_check
  check (type in ('proposal','whatsapp','phone','portal'));
-- 'portal' fica fora de proposal_requires_contact (portal pode mandar só e-mail)

create unique index leads_external_idx on public.leads (tenant_id, source, external_id)
  where external_id is not null;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.portal_connections  enable row level security;
alter table public.portal_listings     enable row level security;
alter table public.portal_sync_jobs    enable row level security;
alter table public.portal_events       enable row level security;
alter table public.portal_taxonomy     enable row level security;
alter table public.portal_taxonomy_map enable row level security;

-- credenciais/fila/eventos: nem cifrados chegam ao cliente
revoke all on public.portal_connections  from anon, authenticated;
revoke all on public.portal_sync_jobs    from anon, authenticated;
revoke all on public.portal_events       from anon, authenticated;
revoke all on public.portal_taxonomy_map from anon, authenticated;
revoke all on public.portal_taxonomy     from anon;

-- membro da loja lê o estado dos anúncios (escrita só no servidor)
revoke insert, update, delete on public.portal_listings from anon, authenticated;
revoke all on public.portal_listings from anon;

create policy "portal_listings_member_read"
  on public.portal_listings for select
  to authenticated
  using ((select public.is_member(tenant_id)));

-- catálogo dos portais é global e não sensível: logado pode buscar
-- (pendências de mapeamento na UI)
create policy "portal_taxonomy_read"
  on public.portal_taxonomy for select
  to authenticated
  using (true);

-- ------------------------------------------------------------
-- Estado da conexão para a UI (sem credenciais) — definer projetado
-- ------------------------------------------------------------
create or replace function public.portal_connection_status(p_tenant uuid)
returns table (
  portal text,
  status text,
  external_account_id text,
  settings jsonb,
  last_error text,
  last_ok_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer set search_path = public
as $$
  select c.portal, c.status, c.external_account_id,
         -- segredos por conexão (webhook_secret) não saem daqui
         (c.settings - 'webhook_secret') as settings,
         c.last_error, c.last_ok_at, c.created_at
  from public.portal_connections c
  where c.tenant_id = p_tenant
    and public.is_member(p_tenant);
$$;

revoke execute on function public.portal_connection_status(uuid) from public, anon;
grant execute on function public.portal_connection_status(uuid) to authenticated;

-- ------------------------------------------------------------
-- Busca no catálogo do portal (trigram) — resolução automática no
-- worker e busca manual nas pendências de mapeamento da UI
-- ------------------------------------------------------------
create or replace function public.portal_taxonomy_search(
  p_portal text,
  p_kind   text,
  p_query  text,
  p_parent text default null,
  p_limit  int  default 10
)
returns table (external_id text, parent_id text, name text, score real)
language sql
stable
security definer set search_path = public, extensions
as $$
  select t.external_id, t.parent_id, t.name,
         greatest(
           similarity(t.name, p_query),
           case when t.name ilike '%' || p_query || '%' then 0.6 else 0 end
         )::real as score
  from public.portal_taxonomy t
  where t.portal = p_portal
    and t.kind = p_kind
    and (p_parent is null or t.parent_id = p_parent)
    and (t.name % p_query or t.name ilike '%' || p_query || '%')
  order by score desc, t.name
  limit greatest(1, least(coalesce(p_limit, 10), 50));
$$;

revoke execute on function public.portal_taxonomy_search(text, text, text, text, int) from public, anon;
grant execute on function public.portal_taxonomy_search(text, text, text, text, int) to authenticated;

-- ------------------------------------------------------------
-- RPC: enfileirar com coalescência (um pendente por chave).
-- Chamada pelo servidor (service role). Se um job igual já está
-- pendente, funde o payload e antecipa o run_after.
-- ------------------------------------------------------------
create or replace function public.enqueue_portal_job(
  p_portal    text,
  p_kind      text,
  p_tenant    uuid default null,
  p_vehicle   uuid default null,
  p_payload   jsonb default '{}'::jsonb,
  p_run_after timestamptz default now()
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.portal_sync_jobs (portal, kind, tenant_id, vehicle_id, payload, run_after)
  values (p_portal, p_kind, p_tenant, p_vehicle, coalesce(p_payload, '{}'::jsonb), coalesce(p_run_after, now()))
  on conflict (
    portal,
    coalesce(tenant_id,  '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(vehicle_id, '00000000-0000-0000-0000-000000000000'::uuid),
    kind
  ) where status = 'pending'
  do update set
    payload   = portal_sync_jobs.payload || excluded.payload,
    run_after = least(portal_sync_jobs.run_after, excluded.run_after)
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.enqueue_portal_job(text, text, uuid, uuid, jsonb, timestamptz) from public, anon, authenticated;

-- ------------------------------------------------------------
-- RPC: reclamar jobs (for update skip locked) — só service role
-- ------------------------------------------------------------
create or replace function public.claim_portal_jobs(
  p_limit  int,
  p_worker text,
  p_tenant uuid default null
)
returns setof public.portal_sync_jobs
language sql
security definer set search_path = public
as $$
  with due as (
    select j.id
    from public.portal_sync_jobs j
    where j.status = 'pending'
      and j.run_after <= now()
      and (p_tenant is null or j.tenant_id = p_tenant)
    order by j.run_after, j.created_at
    limit greatest(1, least(p_limit, 50))
    for update skip locked
  )
  update public.portal_sync_jobs j
  set status    = 'running',
      locked_at = now(),
      locked_by = p_worker,
      attempts  = j.attempts + 1
  from due
  where j.id = due.id
  returning j.*;
$$;

revoke execute on function public.claim_portal_jobs(int, text, uuid) from public, anon, authenticated;

-- jobs 'running' há mais de 10 min são de um worker que morreu: voltam
-- para a fila (o worker chama no início de cada tick)
create or replace function public.release_stale_portal_jobs()
returns int
language sql
security definer set search_path = public
as $$
  with released as (
    update public.portal_sync_jobs
    set status = 'pending', locked_at = null, locked_by = null
    where status = 'running' and locked_at < now() - interval '10 minutes'
    returning 1
  )
  select count(*)::int from released;
$$;

revoke execute on function public.release_stale_portal_jobs() from public, anon, authenticated;

-- ------------------------------------------------------------
-- Retenção (LGPD): raw de leads e eventos crus por 90 dias; jobs
-- concluídos por 30 dias. Chamada pelo worker uma vez por dia.
-- ------------------------------------------------------------
create or replace function public.portal_retention_sweep()
returns void
language sql
security definer set search_path = public
as $$
  update public.leads set raw = null
    where raw is not null and created_at < now() - interval '90 days';
  delete from public.portal_events
    where received_at < now() - interval '90 days';
  delete from public.portal_sync_jobs
    where status in ('done','dead','failed') and created_at < now() - interval '30 days';
$$;

revoke execute on function public.portal_retention_sweep() from public, anon, authenticated;
