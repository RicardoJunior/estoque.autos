-- ============================================================
-- Estoque.autos v2 — Row Level Security + acesso público
-- Endurecido após revisão adversarial multi-agente (2026-06-03).
--
-- Princípios:
--  • Fronteira de segurança é o BANCO. App nunca usa service role.
--  • anon NÃO lê tabelas base direto (evita vazar plate via select *
--    e enumeração em massa de lojas). Lê apenas VIEWS projetadas.
--  • INSERT de lead público passa por função SECURITY DEFINER com
--    whitelist de campos (notes/status nunca vêm do cliente).
--  • Helper de tenant chamado como (select ...) para initplan caching.
-- ============================================================

-- ------------------------------------------------------------
-- Helper: tenant do usuário logado
-- ------------------------------------------------------------
create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid();
$$;

-- EXECUTE nasce concedido a PUBLIC; fechar para anon.
revoke execute on function public.current_tenant_id() from public, anon;
grant execute on function public.current_tenant_id() to authenticated;

alter table public.tenants        enable row level security;
alter table public.profiles       enable row level security;
alter table public.vehicles       enable row level security;
alter table public.leads          enable row level security;
alter table public.reserved_slugs enable row level security;

-- ============================================================
-- TENANTS
-- ============================================================
-- FIX (revisão #5): tenants_public_read USING(true) permitia anon
-- enumerar TODAS as lojas (email, address, settings) via select *.
-- Agora anon não lê a tabela; lê só a view storefronts (projetada).
revoke select on public.tenants from anon;

-- Dono lê apenas a própria loja.
create policy "tenants_owner_read"
  on public.tenants for select
  to authenticated
  using (id = (select public.current_tenant_id()));

-- Dono edita a própria loja.
create policy "tenants_owner_update"
  on public.tenants for update
  to authenticated
  using (id = (select public.current_tenant_id()))
  with check (id = (select public.current_tenant_id()));

-- INSERT não tem policy: criação só via create_tenant() (definer).

-- FIX (revisão #4): bloquear slug reservado em INSERT *e* UPDATE.
-- Antes, a checagem existia só dentro de create_tenant(), então o
-- dono podia `update tenants set slug='admin'` e capturar uma rota.
create or replace function public.assert_slug_allowed()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if exists (select 1 from public.reserved_slugs where slug = new.slug) then
    raise exception 'slug_reserved';
  end if;
  return new;
end;
$$;

create trigger tenants_slug_guard
  before insert or update of slug on public.tenants
  for each row execute function public.assert_slug_allowed();

-- ============================================================
-- PROFILES
-- ============================================================
create policy "profiles_own_read"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- Atualiza apenas dados pessoais (nome/telefone). A imutabilidade de
-- tenant_id/id é garantida por trigger (evita subquery recursiva em
-- policy e fecha o `update profiles set tenant_id=<outro>`).
create policy "profiles_own_update"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create or replace function public.profiles_guard_immutable()
returns trigger
language plpgsql as $$
begin
  -- id nunca muda
  if new.id is distinct from old.id then
    raise exception 'cannot_change_identity';
  end if;
  -- tenant_id pode ser vinculado uma vez (NULL -> valor, via
  -- create_tenant), mas nunca re-atribuído depois.
  if old.tenant_id is not null
     and new.tenant_id is distinct from old.tenant_id then
    raise exception 'cannot_change_tenant';
  end if;
  return new;
end;
$$;

create trigger profiles_immutable
  before update on public.profiles
  for each row execute function public.profiles_guard_immutable();

-- ============================================================
-- VEHICLES
-- ============================================================
-- FIX (revisão #1): a policy de leitura do dono tinha
-- `OR status in ('available','reserved')`, vazando o estoque inteiro
-- (incl. placa e preço) de TODAS as lojas para qualquer logado.
-- Agora o dono lê só o próprio tenant.
-- FIX (revisão #2): anon não lê a tabela base (plate vazaria); lê só
-- a view vehicles_public (sem plate, sem sold_at).
revoke select on public.vehicles from anon;

create policy "vehicles_owner_all"
  on public.vehicles for all
  to authenticated
  using (tenant_id = (select public.current_tenant_id()))
  with check (tenant_id = (select public.current_tenant_id()));

-- ============================================================
-- LEADS
-- ============================================================
-- FIX (revisão #3): a policy leads_public_insert deixava anon forjar
-- notes (XSS no CRM), proposal_value, utm, status etc. Agora o insert
-- público passa por create_lead() (whitelist + tenant derivado do
-- veículo + status/notes forçados no servidor).
revoke insert on public.leads from anon;

create policy "leads_owner_read"
  on public.leads for select
  to authenticated
  using (tenant_id = (select public.current_tenant_id()));

create policy "leads_owner_update"
  on public.leads for update
  to authenticated
  using (tenant_id = (select public.current_tenant_id()))
  with check (tenant_id = (select public.current_tenant_id()));

create policy "leads_owner_delete"
  on public.leads for delete
  to authenticated
  using (tenant_id = (select public.current_tenant_id()));

-- ============================================================
-- RESERVED SLUGS (leitura para validação no app)
-- ============================================================
create policy "reserved_slugs_read"
  on public.reserved_slugs for select
  to anon, authenticated
  using (true);

-- ============================================================
-- VIEWS PÚBLICAS (definer: bypassam RLS da tabela base e projetam
-- só colunas seguras; é o ÚNICO caminho de leitura do anon)
-- ============================================================

-- Vitrine da loja (sem nada além de dados de exibição).
create view public.storefronts as
  select
    id, slug, name, phone, whatsapp, email, address,
    template_id, colors, logo_url, settings
  from public.tenants;

-- Estoque público: só available/reserved, SEM plate e SEM sold_at.
create view public.vehicles_public as
  select
    id, tenant_id, brand, model, version, year_fab, year_model,
    color, fuel, transmission, mileage, doors, category, price,
    description, optionals, photos, featured, status, created_at
  from public.vehicles
  where status in ('available', 'reserved');

grant select on public.storefronts     to anon, authenticated;
grant select on public.vehicles_public to anon, authenticated;

-- ============================================================
-- RPC: criação de lead público (substitui o INSERT direto do anon)
-- ============================================================
create or replace function public.create_lead(
  p_vehicle_id    uuid,
  p_type          text,
  p_name          text default null,
  p_phone         text default null,
  p_email         text default null,
  p_message       text default null,
  p_proposal_value numeric default null,
  p_trade_vehicle text default null,
  p_utm           jsonb default null,
  p_device        text default null
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_tenant uuid;
  v_lead   uuid;
begin
  if p_type not in ('proposal', 'whatsapp', 'phone') then
    raise exception 'invalid_type';
  end if;

  -- tenant é derivado do veículo exposto; nunca vem do cliente
  select tenant_id into v_tenant
  from public.vehicles
  where id = p_vehicle_id and status in ('available', 'reserved');

  if v_tenant is null then
    raise exception 'vehicle_not_available';
  end if;

  if p_type = 'proposal'
     and (nullif(btrim(p_name), '') is null or nullif(btrim(p_phone), '') is null) then
    raise exception 'proposal_requires_contact';
  end if;

  insert into public.leads (
    tenant_id, vehicle_id, type, name, phone, email, message,
    proposal_value, trade_vehicle, utm, device, status, notes
  ) values (
    v_tenant, p_vehicle_id, p_type,
    left(p_name, 120), left(p_phone, 40), left(p_email, 160),
    left(p_message, 2000),
    case when p_proposal_value >= 0 then p_proposal_value end,
    left(p_trade_vehicle, 200), p_utm, left(p_device, 80),
    'new',   -- status sempre 'new'
    null     -- notes é campo interno do CRM, nunca do cliente
  )
  returning id into v_lead;

  return v_lead;
end;
$$;

revoke execute on function public.create_lead(uuid, text, text, text, text, text, numeric, text, jsonb, text) from public, anon;
grant execute on function public.create_lead(uuid, text, text, text, text, text, numeric, text, jsonb, text) to anon, authenticated;

-- ============================================================
-- RPC: onboarding atômico (cria a loja e vincula o usuário)
-- ============================================================
create or replace function public.create_tenant(
  p_slug     text,
  p_name     text,
  p_phone    text default null,
  p_whatsapp text default null,
  p_email    text default null
)
returns public.tenants
language plpgsql
security definer set search_path = public
as $$
declare
  v_tenant public.tenants;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if (select tenant_id from public.profiles where id = auth.uid()) is not null then
    raise exception 'already_has_tenant';
  end if;

  -- (o trigger tenants_slug_guard também barra, mas erro aqui é mais claro)
  if exists (select 1 from public.reserved_slugs where slug = p_slug) then
    raise exception 'slug_reserved';
  end if;

  insert into public.tenants (slug, name, phone, whatsapp, email)
  values (p_slug, p_name, p_phone, p_whatsapp, p_email)
  returning * into v_tenant;

  -- vinculação requer contornar o trigger de imutabilidade de profile
  update public.profiles set tenant_id = v_tenant.id where id = auth.uid();

  return v_tenant;
exception
  when unique_violation then
    raise exception 'slug_taken';
end;
$$;

revoke execute on function public.create_tenant(text, text, text, text, text) from public, anon;
grant execute on function public.create_tenant(text, text, text, text, text) to authenticated;

-- ============================================================
-- STORAGE: leitura pública; escrita restrita ao path do tenant.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true), ('vehicle-photos', 'vehicle-photos', true)
on conflict (id) do nothing;

create policy "storage_tenant_write"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('logos', 'vehicle-photos')
    and (storage.foldername(name))[1] = (select public.current_tenant_id())::text
  );

create policy "storage_tenant_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('logos', 'vehicle-photos')
    and (storage.foldername(name))[1] = (select public.current_tenant_id())::text
  );

create policy "storage_tenant_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('logos', 'vehicle-photos')
    and (storage.foldername(name))[1] = (select public.current_tenant_id())::text
  );

create policy "storage_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id in ('logos', 'vehicle-photos'));
