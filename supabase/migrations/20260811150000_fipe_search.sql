-- Busca textual no catálogo FIPE local (marca + modelo numa consulta só):
-- "honda civic" → tokens, TODOS precisam bater em "Marca Modelo".
-- Alimenta o cadastro de veículo (uma busca única em vez de cascata).

create or replace function public.fipe_search(p_type text, p_q text)
returns table (
  brand_id   text,
  brand_name text,
  model_id   text,
  model_name text
)
language sql
stable
security definer set search_path = public
as $$
  select b.id::text, b.name, m.id::text, m.name
  from public.fipe_models m
  join public.fipe_brands b
    on b.id = m.brand_id and b.vehicle_type = m.vehicle_type
  where m.vehicle_type = p_type
    and length(btrim(p_q)) >= 2
    and (b.name || ' ' || m.name) ilike all (
      select '%' || t || '%'
      from unnest(string_to_array(btrim(p_q), ' ')) as t
      where t <> ''
    )
  order by b.name, m.name
  limit 20;
$$;

revoke execute on function public.fipe_search(text, text) from public, anon;
grant execute on function public.fipe_search(text, text) to authenticated;
