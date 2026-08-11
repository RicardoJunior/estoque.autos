-- ============================================================
-- Equipe + multi-loja.
--
--  • memberships: quem acessa cada loja e com qual papel
--    (owner | admin | vendedor). Exatamente UM owner por loja.
--  • Um usuário pode ter/participar de várias lojas; a assinatura
--    passa a ser POR LOJA (cai o unique de user_id em subscriptions).
--  • Convites (plano Pro) com token, aceitos por quem loga com o
--    e-mail convidado. Transferência de propriedade remove o acesso
--    do owner antigo.
--  • RLS reescrita por papel: staff (owner/admin) escreve; vendedor
--    lê estoque e trabalha leads; todo membro lê a loja.
--
-- profiles.tenant_id vira legado (mantido para a primeira loja, mas
-- o app passa a usar memberships + cookie de loja ativa).
-- ============================================================

-- ------------------------------------------------------------
-- MEMBERSHIPS
-- ------------------------------------------------------------
create table public.memberships (
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('owner', 'admin', 'vendedor')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

-- exatamente um owner por loja
create unique index memberships_one_owner_idx
  on public.memberships (tenant_id) where role = 'owner';

create index memberships_user_idx on public.memberships (user_id);

-- backfill: dono atual (profiles.tenant_id) vira membership owner
insert into public.memberships (tenant_id, user_id, role)
select p.tenant_id, p.id, 'owner'
from public.profiles p
where p.tenant_id is not null
on conflict do nothing;

-- ------------------------------------------------------------
-- Helpers de papel (initplan-cached quando chamados via (select ...))
-- ------------------------------------------------------------
create or replace function public.member_role(t uuid)
returns text
language sql
stable
security definer set search_path = public
as $$
  select role from public.memberships
  where tenant_id = t and user_id = auth.uid();
$$;

create or replace function public.is_member(t uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where tenant_id = t and user_id = auth.uid()
  );
$$;

create or replace function public.is_staff(t uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where tenant_id = t and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

revoke execute on function public.member_role(uuid) from public, anon;
revoke execute on function public.is_member(uuid)   from public, anon;
revoke execute on function public.is_staff(uuid)    from public, anon;
grant execute on function public.member_role(uuid) to authenticated;
grant execute on function public.is_member(uuid)   to authenticated;
grant execute on function public.is_staff(uuid)    to authenticated;

-- ------------------------------------------------------------
-- Guarda de invariantes em memberships: nada de mexer no owner
-- diretamente — só pelas RPCs (que ligam o GUC app.team_rpc).
-- ------------------------------------------------------------
create or replace function public.memberships_guard()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('app.team_rpc', true), '') = 'on' then
    return coalesce(new, old);
  end if;
  if tg_op = 'DELETE' and old.role = 'owner' then
    raise exception 'owner_membership_locked';
  end if;
  if tg_op = 'UPDATE' and (old.role = 'owner' or new.role = 'owner') then
    raise exception 'owner_membership_locked';
  end if;
  if tg_op = 'INSERT' and new.role = 'owner' then
    raise exception 'owner_membership_locked';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger memberships_owner_guard
  before insert or update or delete on public.memberships
  for each row execute function public.memberships_guard();

alter table public.memberships enable row level security;

-- membro vê a equipe da própria loja
create policy "memberships_member_read"
  on public.memberships for select
  to authenticated
  using ((select public.is_member(tenant_id)));

-- staff gerencia (o trigger acima protege o owner; INSERT de novos
-- membros passa por accept_invite, mas staff pode ajustar papel
-- admin<->vendedor e remover não-owners direto)
create policy "memberships_staff_update"
  on public.memberships for update
  to authenticated
  using ((select public.is_staff(tenant_id)))
  with check ((select public.is_staff(tenant_id)));

create policy "memberships_staff_delete"
  on public.memberships for delete
  to authenticated
  using ((select public.is_staff(tenant_id)));

-- ------------------------------------------------------------
-- Nome/e-mail dos membros para a tela de equipe (via definer,
-- projetando só o necessário — auth.users não é legível pelo app)
-- ------------------------------------------------------------
create or replace function public.team_members(p_tenant uuid)
returns table (user_id uuid, role text, name text, email text, created_at timestamptz)
language sql
stable
security definer set search_path = public
as $$
  select m.user_id, m.role,
         coalesce(nullif(p.name, ''), split_part(u.email, '@', 1)) as name,
         u.email::text as email,
         m.created_at
  from public.memberships m
  join auth.users u on u.id = m.user_id
  left join public.profiles p on p.id = m.user_id
  where m.tenant_id = p_tenant
    and public.is_member(p_tenant)
  order by case m.role when 'owner' then 0 when 'admin' then 1 else 2 end, m.created_at;
$$;

revoke execute on function public.team_members(uuid) from public, anon;
grant execute on function public.team_members(uuid) to authenticated;

-- ------------------------------------------------------------
-- INVITES (plano Pro)
-- ------------------------------------------------------------
create table public.invites (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  email       text not null check (email = lower(email)),
  role        text not null check (role in ('admin', 'vendedor')),
  token       uuid not null unique default gen_random_uuid(),
  invited_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  unique (tenant_id, email)
);

alter table public.invites enable row level security;

create policy "invites_staff_read"
  on public.invites for select
  to authenticated
  using ((select public.is_staff(tenant_id)));

create policy "invites_staff_delete"
  on public.invites for delete
  to authenticated
  using ((select public.is_staff(tenant_id)));

-- criação passa pela RPC (valida plano Pro + duplicidade)
create or replace function public.create_invite(
  p_tenant uuid,
  p_email  text,
  p_role   text
)
returns public.invites
language plpgsql
security definer set search_path = public
as $$
declare
  v_email  text := lower(btrim(p_email));
  v_invite public.invites;
begin
  if not public.is_staff(p_tenant) then
    raise exception 'not_allowed';
  end if;
  if p_role not in ('admin', 'vendedor') then
    raise exception 'invalid_role';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email';
  end if;

  -- equipe é recurso do plano Pro (assinatura vigente da LOJA)
  if not exists (
    select 1 from public.subscriptions s
    where s.tenant_id = p_tenant
      and s.plan = 'pro'
      and s.status in ('active', 'trialing', 'past_due')
  ) then
    raise exception 'pro_required';
  end if;

  if exists (
    select 1 from public.memberships m
    join auth.users u on u.id = m.user_id
    where m.tenant_id = p_tenant and lower(u.email) = v_email
  ) then
    raise exception 'already_member';
  end if;

  -- reconvidar = renovar token/validade
  insert into public.invites (tenant_id, email, role, invited_by)
  values (p_tenant, v_email, p_role, auth.uid())
  on conflict (tenant_id, email) do update
    set role = excluded.role,
        token = gen_random_uuid(),
        invited_by = excluded.invited_by,
        created_at = now(),
        expires_at = now() + interval '7 days',
        accepted_at = null
  returning * into v_invite;

  return v_invite;
end;
$$;

revoke execute on function public.create_invite(uuid, text, text) from public, anon;
grant execute on function public.create_invite(uuid, text, text) to authenticated;

-- consulta pública do convite (tela de aceite, antes do login):
-- devolve só o essencial, nunca o token de volta.
create or replace function public.invite_preview(p_token uuid)
returns table (store_name text, email text, role text, expired boolean, accepted boolean)
language sql
stable
security definer set search_path = public
as $$
  select t.name, i.email, i.role,
         (i.expires_at < now()) as expired,
         (i.accepted_at is not null) as accepted
  from public.invites i
  join public.tenants t on t.id = i.tenant_id
  where i.token = p_token;
$$;

revoke execute on function public.invite_preview(uuid) from public;
grant execute on function public.invite_preview(uuid) to anon, authenticated;

create or replace function public.accept_invite(p_token uuid)
returns table (tenant_id uuid, slug text, role text)
language plpgsql
security definer set search_path = public
as $$
declare
  v_invite public.invites;
  v_email  text;
  v_slug   text;
begin
  select * into v_invite
  from public.invites
  where token = p_token
    and accepted_at is null
    and expires_at >= now();

  if v_invite.id is null then
    raise exception 'invite_invalid';
  end if;

  select lower(u.email) into v_email from auth.users u where u.id = auth.uid();
  if v_email is null or v_email <> v_invite.email then
    raise exception 'email_mismatch';
  end if;

  perform set_config('app.team_rpc', 'on', true);
  -- já era membro (ex.: reconvite p/ mudar papel)? aplica o papel do
  -- convite — exceto owner, que nunca muda por aqui
  insert into public.memberships (tenant_id, user_id, role)
  values (v_invite.tenant_id, auth.uid(), v_invite.role)
  on conflict (tenant_id, user_id) do update
    set role = excluded.role
    where memberships.role <> 'owner';
  perform set_config('app.team_rpc', '', true);

  update public.invites set accepted_at = now() where id = v_invite.id;

  select t.slug into v_slug from public.tenants t where t.id = v_invite.tenant_id;
  return query select v_invite.tenant_id, v_slug, v_invite.role;
end;
$$;

revoke execute on function public.accept_invite(uuid) from public, anon;
grant execute on function public.accept_invite(uuid) to authenticated;

-- ------------------------------------------------------------
-- Transferência de propriedade: novo owner assume, o antigo SAI.
-- ------------------------------------------------------------
create or replace function public.transfer_ownership(
  p_tenant    uuid,
  p_new_owner uuid
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if public.member_role(p_tenant) <> 'owner' then
    raise exception 'not_owner';
  end if;
  if p_new_owner = auth.uid() then
    raise exception 'already_owner';
  end if;
  if not exists (
    select 1 from public.memberships
    where tenant_id = p_tenant and user_id = p_new_owner
  ) then
    raise exception 'not_a_member';
  end if;

  perform set_config('app.team_rpc', 'on', true);
  delete from public.memberships
    where tenant_id = p_tenant and user_id = auth.uid();
  update public.memberships
    set role = 'owner'
    where tenant_id = p_tenant and user_id = p_new_owner;
  perform set_config('app.team_rpc', '', true);

  -- legado: se o profile antigo apontava para esta loja, solta o vínculo
  update public.profiles set tenant_id = null
    where id = auth.uid() and tenant_id = p_tenant;
end;
$$;

revoke execute on function public.transfer_ownership(uuid, uuid) from public, anon;
grant execute on function public.transfer_ownership(uuid, uuid) to authenticated;

-- profiles.tenant_id agora pode ser desvinculado/re-vinculado (multi-loja
-- tornou o campo legado) — relaxa o guard de imutabilidade.
create or replace function public.profiles_guard_immutable()
returns trigger
language plpgsql as $$
begin
  if new.id is distinct from old.id then
    raise exception 'cannot_change_identity';
  end if;
  return new;
end;
$$;

-- ------------------------------------------------------------
-- SUBSCRIPTIONS: por loja (um usuário pode pagar várias)
-- ------------------------------------------------------------
alter table public.subscriptions drop constraint subscriptions_user_id_key;

-- owner da loja lê a assinatura DA LOJA (após transferência o novo
-- owner não é o pagador, mas precisa ver status/plano)
create policy "subscriptions_tenant_owner_read"
  on public.subscriptions for select
  to authenticated
  using (
    tenant_id is not null
    and (select public.member_role(tenant_id)) = 'owner'
  );

-- status da assinatura da loja para QUALQUER membro (o requireTenant
-- do app precisa saber se a loja está ativa sem expor a linha inteira)
create or replace function public.tenant_subscription_status(p_tenant uuid)
returns table (status text, plan text)
language sql
stable
security definer set search_path = public
as $$
  select s.status, s.plan
  from public.subscriptions s
  where s.tenant_id = p_tenant
    and public.is_member(p_tenant);
$$;

revoke execute on function public.tenant_subscription_status(uuid) from public, anon;
grant execute on function public.tenant_subscription_status(uuid) to authenticated;

-- ------------------------------------------------------------
-- CREATE_TENANT v2: multi-loja. Consome a assinatura ativa do
-- usuário que ainda não tem loja vinculada (plano-primeiro: cada
-- nova loja nasce de um checkout novo).
-- ------------------------------------------------------------
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
  v_sub    public.subscriptions;
  v_tenant public.tenants;
begin
  -- assinatura vigente ainda sem loja (a mais recente primeiro)
  select * into v_sub
  from public.subscriptions
  where user_id = auth.uid()
    and tenant_id is null
    and status in ('active', 'trialing')
  order by created_at desc
  limit 1;

  if v_sub.id is null then
    raise exception 'subscription_required';
  end if;

  if exists (select 1 from public.reserved_slugs where slug = p_slug) then
    raise exception 'slug_reserved';
  end if;

  insert into public.tenants (slug, name, phone, whatsapp, email, plan)
  values (p_slug, p_name, p_phone, p_whatsapp, p_email, v_sub.plan)
  returning * into v_tenant;

  perform set_config('app.team_rpc', 'on', true);
  insert into public.memberships (tenant_id, user_id, role)
  values (v_tenant.id, auth.uid(), 'owner');
  perform set_config('app.team_rpc', '', true);

  -- legado: primeira loja continua espelhada no profile
  update public.profiles set tenant_id = v_tenant.id
    where id = auth.uid() and tenant_id is null;

  update public.subscriptions set tenant_id = v_tenant.id where id = v_sub.id;

  return v_tenant;
exception
  when unique_violation then
    raise exception 'slug_taken';
end;
$$;

-- ------------------------------------------------------------
-- RLS por papel (substitui as policies baseadas em profiles.tenant_id)
-- ------------------------------------------------------------
drop policy "tenants_owner_read"   on public.tenants;
drop policy "tenants_owner_update" on public.tenants;

create policy "tenants_member_read"
  on public.tenants for select
  to authenticated
  using ((select public.is_member(id)));

create policy "tenants_staff_update"
  on public.tenants for update
  to authenticated
  using ((select public.is_staff(id)))
  with check ((select public.is_staff(id)));

drop policy "vehicles_owner_all" on public.vehicles;

create policy "vehicles_member_read"
  on public.vehicles for select
  to authenticated
  using ((select public.is_member(tenant_id)));

create policy "vehicles_staff_insert"
  on public.vehicles for insert
  to authenticated
  with check ((select public.is_staff(tenant_id)));

create policy "vehicles_staff_update"
  on public.vehicles for update
  to authenticated
  using ((select public.is_staff(tenant_id)))
  with check ((select public.is_staff(tenant_id)));

create policy "vehicles_staff_delete"
  on public.vehicles for delete
  to authenticated
  using ((select public.is_staff(tenant_id)));

drop policy "leads_owner_read"   on public.leads;
drop policy "leads_owner_update" on public.leads;
drop policy "leads_owner_delete" on public.leads;

-- vendedor participa do funil: lê e atualiza; excluir é staff
create policy "leads_member_read"
  on public.leads for select
  to authenticated
  using ((select public.is_member(tenant_id)));

create policy "leads_member_update"
  on public.leads for update
  to authenticated
  using ((select public.is_member(tenant_id)))
  with check ((select public.is_member(tenant_id)));

create policy "leads_staff_delete"
  on public.leads for delete
  to authenticated
  using ((select public.is_staff(tenant_id)));

drop policy "storage_tenant_write"  on storage.objects;
drop policy "storage_tenant_update" on storage.objects;
drop policy "storage_tenant_delete" on storage.objects;

create policy "storage_staff_write"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('logos', 'vehicle-photos')
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.is_staff(((storage.foldername(name))[1])::uuid)
  );

create policy "storage_staff_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('logos', 'vehicle-photos')
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.is_staff(((storage.foldername(name))[1])::uuid)
  );

create policy "storage_staff_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('logos', 'vehicle-photos')
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.is_staff(((storage.foldername(name))[1])::uuid)
  );
