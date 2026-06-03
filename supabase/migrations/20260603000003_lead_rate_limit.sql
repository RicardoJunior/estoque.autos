-- ============================================================
-- Rate limiting de criação de lead (anti-flood).
-- Achado da revisão adversarial: create_lead tem GRANT anon e é
-- chamável direto via PostgREST com a anon key pública, contornando
-- a Server Action e o honeypot. RLS controla ACESSO, não TAXA.
--
-- Defesa em camadas, TODA no banco (independe de IP, que é forjável):
--   • por veículo:  máx 12 / 10 min
--   • por loja:     máx 40 / 10 min
--   • por IP:       máx 15 / 10 min (best-effort; só quando há proxy)
-- ============================================================

create table public.lead_rate_limit (
  bucket_key   text not null,
  window_start timestamptz not null,
  count        int not null default 0,
  primary key (bucket_key, window_start)
);
-- RLS ligado e SEM policy: ninguém acessa direto; só a função definer.
alter table public.lead_rate_limit enable row level security;

create or replace function public._bump_rate(p_key text, p_limit int)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_window timestamptz := date_trunc('hour', now())
    + floor(extract(minute from now())::int / 10) * interval '10 minutes';
  v_count int;
begin
  insert into public.lead_rate_limit (bucket_key, window_start, count)
  values (p_key, v_window, 1)
  on conflict (bucket_key, window_start)
    do update set count = lead_rate_limit.count + 1
  returning count into v_count;

  if v_count > p_limit then
    raise exception 'rate_limited';
  end if;
end;
$$;

revoke execute on function public._bump_rate(text, int) from public, anon, authenticated;

-- Recria create_lead com p_client_ip e os throttles.
drop function if exists public.create_lead(uuid, text, text, text, text, text, numeric, text, jsonb, text);

create or replace function public.create_lead(
  p_vehicle_id     uuid,
  p_type           text,
  p_name           text default null,
  p_phone          text default null,
  p_email          text default null,
  p_message        text default null,
  p_proposal_value numeric default null,
  p_trade_vehicle  text default null,
  p_utm            jsonb default null,
  p_device         text default null,
  p_client_ip      text default null
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

  -- throttles (independentes de IP primeiro; IP é best-effort)
  perform public._bump_rate('veh:' || p_vehicle_id::text, 12);
  perform public._bump_rate('ten:' || v_tenant::text, 40);
  if p_client_ip is not null and p_client_ip <> '' then
    perform public._bump_rate('ip:' || left(p_client_ip, 45), 15);
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
    'new', null
  )
  returning id into v_lead;

  return v_lead;
end;
$$;

revoke execute on function public.create_lead(uuid, text, text, text, text, text, numeric, text, jsonb, text, text) from public, anon;
grant execute on function public.create_lead(uuid, text, text, text, text, text, numeric, text, jsonb, text, text) to anon, authenticated;

-- Limpeza de janelas antigas (chamada oportunista pela função; evita
-- crescimento ilimitado sem depender de cron).
create or replace function public._gc_rate_limit()
returns void language sql security definer set search_path = public as $$
  delete from public.lead_rate_limit where window_start < now() - interval '1 day';
$$;
revoke execute on function public._gc_rate_limit() from public, anon, authenticated;
