-- ============================================================
-- Estoque.autos v2 — billing (Stripe, plano-primeiro)
--
-- Fluxo: signup → Stripe Checkout (assinatura) → webhook grava
-- subscriptions → onboarding cria a loja e vincula a assinatura.
-- Não existe loja sem assinatura ativa (sem plano grátis/trial).
--
-- Exceção documentada ao princípio "app nunca usa service role":
-- o webhook do Stripe é server-to-server — a autenticação ali é a
-- assinatura HMAC do evento, verificada no app — então a escrita
-- em subscriptions usa o service role APENAS nessa rota (e nos
-- scripts de manutenção). Caminhos de usuário continuam 100% RLS.
-- ============================================================

-- Plano ativo da loja (cópia de conveniência p/ exibição; a fonte
-- da verdade de acesso é subscriptions.status).
alter table public.tenants
  add column plan text check (plan in ('basico','pro'));

-- ------------------------------------------------------------
-- SUBSCRIPTIONS
-- Chave por usuário: a assinatura nasce ANTES da loja existir
-- (paga no cadastro, cria a loja no onboarding). tenant_id é
-- vinculado depois, dentro de create_tenant().
-- ------------------------------------------------------------
create table public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null unique references auth.users(id) on delete cascade,
  tenant_id              uuid unique references public.tenants(id) on delete set null,
  stripe_customer_id     text not null unique,
  stripe_subscription_id text not null unique,
  plan                   text not null check (plan in ('basico','pro')),
  -- status cru do Stripe (active, trialing, past_due, canceled,
  -- unpaid, incomplete…) — sem CHECK para não quebrar se o Stripe
  -- introduzir um status novo. Acesso liberado = active|trialing.
  status                 text not null,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

-- Dono lê a própria assinatura. INSERT/UPDATE sem policy de
-- propósito: escrita só via service role (webhook Stripe).
create policy "subscriptions_owner_read"
  on public.subscriptions for select
  to authenticated
  using (user_id = (select auth.uid()));

-- ------------------------------------------------------------
-- create_tenant v2: plano-primeiro.
-- Exige assinatura ativa pra criar a loja, herda o plano dela e
-- vincula assinatura → loja. Mesma assinatura de função da v1
-- (grants preservados pelo REPLACE).
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
  v_tenant public.tenants;
  v_sub    public.subscriptions;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if (select tenant_id from public.profiles where id = auth.uid()) is not null then
    raise exception 'already_has_tenant';
  end if;

  -- plano-primeiro: sem assinatura ativa não há loja
  select * into v_sub
  from public.subscriptions
  where user_id = auth.uid() and status in ('active','trialing');

  if v_sub.id is null then
    raise exception 'subscription_required';
  end if;

  -- (o trigger tenants_slug_guard também barra, mas erro aqui é mais claro)
  if exists (select 1 from public.reserved_slugs where slug = p_slug) then
    raise exception 'slug_reserved';
  end if;

  insert into public.tenants (slug, name, phone, whatsapp, email, plan)
  values (p_slug, p_name, p_phone, p_whatsapp, p_email, v_sub.plan)
  returning * into v_tenant;

  -- vinculação requer contornar o trigger de imutabilidade de profile
  update public.profiles set tenant_id = v_tenant.id where id = auth.uid();

  -- assinatura passa a apontar pra loja recém-criada
  update public.subscriptions set tenant_id = v_tenant.id where id = v_sub.id;

  return v_tenant;
exception
  when unique_violation then
    raise exception 'slug_taken';
end;
$$;
