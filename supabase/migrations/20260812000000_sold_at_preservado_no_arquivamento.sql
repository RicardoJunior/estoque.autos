-- ============================================================
-- Arquivar um veículo vendido apagava o sold_at (o trigger zerava
-- em QUALQUER status <> 'sold'), o que sumia com a venda do
-- faturamento do dashboard — arquivamento é limpeza de rotina e
-- não pode reescrever a história de vendas.
--
-- Agora sold_at só é limpo quando o veículo VOLTA ao estoque
-- (available/reserved). sold → archived preserva a data da venda.
-- Obs.: sold_at de veículos arquivados antes desta migration já
-- foi perdido e não é recuperável.
-- ============================================================

create or replace function public.set_sold_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'sold' and old.status is distinct from 'sold' then
    new.sold_at = now();
  elsif new.status in ('available', 'reserved') then
    new.sold_at = null;
  end if;
  return new;
end;
$$;
