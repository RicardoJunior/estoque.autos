-- Marcação INTERNA de veículo consignado (a loja vende em nome de
-- terceiro). Ortogonal ao status (um consignado pode estar disponível,
-- reservado ou vendido). Não é exposto na vitrine pública — a view
-- vehicles_public não projeta esta coluna.
alter table public.vehicles
  add column consigned boolean not null default false;
