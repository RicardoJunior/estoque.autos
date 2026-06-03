-- ============================================================
-- Estoque.autos v2 — schema inicial
-- Visão: lojista cria conta, cadastra estoque e tem site pronto
-- em minutos (6 templates, cor principal + destaque, logo, leads).
-- ============================================================

-- ------------------------------------------------------------
-- TENANTS (lojas)
-- ------------------------------------------------------------
create table public.tenants (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique
              check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$'),
  name        text not null check (char_length(name) between 2 and 80),
  phone       text,
  whatsapp    text,
  email       text,
  address     jsonb,
  -- personalização do site
  template_id text not null default 'classico'
              check (template_id in ('classico','moderno','premium','minimal','esportivo','vitrine')),
  colors      jsonb not null default '{"primary":"#1d4ed8","accent":"#f59e0b"}'::jsonb,
  logo_url    text,
  -- textos editáveis: slogan, about, footer_text, business_hours
  settings    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- slugs reservados (rotas do próprio app não podem virar loja)
create table public.reserved_slugs (slug text primary key);
insert into public.reserved_slugs (slug) values
  ('admin'),('api'),('auth'),('login'),('cadastro'),('signup'),('onboarding'),
  ('esqueci-senha'),('redefinir-senha'),('dashboard'),('app'),('www'),('site'),
  ('ajuda'),('suporte'),('precos'),('termos'),('privacidade'),('blog'),
  ('status'),('assets'),('public'),('sobre'),('contato');

-- ------------------------------------------------------------
-- PROFILES (1:1 com auth.users — v1: apenas o dono da loja)
-- tenant_id é NULL até o onboarding (fix do bug v1: NOT NULL
-- quebrava o signup porque o tenant ainda não existia).
-- ------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  tenant_id  uuid references public.tenants(id) on delete set null,
  name       text not null default '',
  phone      text,
  created_at timestamptz not null default now()
);

-- Trigger real de signup (na v1 só existia em comentário).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- VEHICLES (estoque)
-- photos: jsonb [{id, path, url}] — ordem do array é a ordem de
-- exibição; primeira foto é a capa. id estável por foto (fix da
-- manipulação frágil por índice da v1).
-- ------------------------------------------------------------
create table public.vehicles (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  brand        text not null check (char_length(brand) between 1 and 60),
  model        text not null check (char_length(model) between 1 and 80),
  version      text,
  year_fab     int  check (year_fab  between 1900 and 2100),
  year_model   int  check (year_model between 1900 and 2101),
  plate        text,
  color        text,
  fuel         text check (fuel in ('flex','gasolina','etanol','diesel','hibrido','eletrico','gnv')),
  transmission text check (transmission in ('manual','automatico','cvt','automatizado')),
  mileage      int  check (mileage >= 0),
  doors        int  check (doors between 2 and 6),
  category     text not null default 'carro'
               check (category in ('carro','moto','utilitario','caminhao')),
  price        numeric(12,2) not null check (price >= 0),
  description  text,
  optionals    text[] not null default '{}',
  photos       jsonb  not null default '[]'::jsonb,
  featured     boolean not null default false,
  status       text not null default 'available'
               check (status in ('available','reserved','sold','archived')),
  sold_at      timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index vehicles_tenant_idx        on public.vehicles (tenant_id, status, created_at desc);
create index vehicles_public_list_idx   on public.vehicles (tenant_id, created_at desc)
  where status in ('available','reserved');

-- ------------------------------------------------------------
-- LEADS
-- name/email/phone opcionais: cliques de WhatsApp/telefone geram
-- lead sem formulário (fix do bug v1: Zod exigia email e o lead
-- era perdido em silêncio).
-- ------------------------------------------------------------
create table public.leads (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  vehicle_id     uuid references public.vehicles(id) on delete set null,
  type           text not null check (type in ('proposal','whatsapp','phone')),
  name           text,
  phone          text,
  email          text,
  message        text check (char_length(message) <= 2000),
  proposal_value numeric(12,2) check (proposal_value >= 0),
  trade_vehicle  text,
  status         text not null default 'new'
                 check (status in ('new','in_progress','won','lost')),
  notes          text,
  utm            jsonb,
  device         text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- proposta exige dados de contato; clique não
  constraint proposal_requires_contact
    check (type <> 'proposal' or (name is not null and phone is not null))
);

create index leads_tenant_idx on public.leads (tenant_id, status, created_at desc);

-- ------------------------------------------------------------
-- updated_at automático
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenants_updated_at  before update on public.tenants  for each row execute function public.set_updated_at();
create trigger vehicles_updated_at before update on public.vehicles for each row execute function public.set_updated_at();
create trigger leads_updated_at    before update on public.leads    for each row execute function public.set_updated_at();

-- sold_at automático ao marcar como vendido
create or replace function public.set_sold_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'sold' and old.status is distinct from 'sold' then
    new.sold_at = now();
  elsif new.status <> 'sold' then
    new.sold_at = null;
  end if;
  return new;
end;
$$;

create trigger vehicles_sold_at before update on public.vehicles
  for each row execute function public.set_sold_at();

-- ------------------------------------------------------------
-- Realtime para leads (na v1 a publication nunca foi habilitada
-- e o realtime nunca entregou eventos)
-- ------------------------------------------------------------
alter publication supabase_realtime add table public.leads;
