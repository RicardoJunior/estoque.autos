-- ============================================================
-- fipe_years.fetched_at: o cache de anos era eterno — modelos
-- nunca ganhavam ano-modelo novo (virada de mês/zero km). Com a
-- idade da linha, o app renova listas velhas (TTL de 30 dias em
-- src/lib/fipe/cache.ts). Default now() faz o cache pré-existente
-- contar como recém-buscado e convergir sozinho.
-- ============================================================

alter table public.fipe_years
  add column if not exists fetched_at timestamptz not null default now();
