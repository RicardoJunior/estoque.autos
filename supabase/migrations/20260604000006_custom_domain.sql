-- ============================================================
-- Estoque.autos v2 — domínio próprio por loja
--
-- O lojista pode apontar um domínio próprio (ex.: www.minhaloja.com.br)
-- para a vitrine. O Worker recebe a requisição nesse host, o proxy
-- (middleware) resolve host → slug e reescreve para /{slug}.
--
-- Princípios (mesmos da migration de RLS):
--  • anon NÃO lê tabelas base; a resolução host→slug passa por uma
--    function SECURITY DEFINER MINIMALISTA que devolve só o slug —
--    nunca expomos custom_domain na view pública storefronts (que é
--    enumerável por anon).
--  • custom_domain único, minúsculo e com formato de hostname.
--  • status começa 'pending'; vira 'active' quando o apontamento é
--    verificado (DNS/HTTP) e/ou o custom hostname da Cloudflare
--    fica válido.
-- ============================================================

alter table public.tenants
  add column custom_domain text unique
    check (
      custom_domain is null
      or (
        custom_domain = lower(custom_domain)
        and char_length(custom_domain) between 4 and 253
        -- hostname: labels alfanuméricos separados por ponto, com
        -- pelo menos um ponto (ex.: minhaloja.com.br, www.loja.com)
        and custom_domain ~ '^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$'
      )
    ),
  add column custom_domain_status text not null default 'pending'
    check (custom_domain_status in ('pending', 'active'));

-- ------------------------------------------------------------
-- RPC pública: resolve host (domínio próprio) → slug da loja.
-- É o ÚNICO caminho do anon p/ tocar em custom_domain. Devolve só
-- o slug (texto), nada mais — não vaza demais nomes/domínios de
-- lojas e não permite enumeração (precisa acertar o host exato).
-- Só resolve domínios já marcados como ativos.
-- ------------------------------------------------------------
create or replace function public.custom_domain_lookup(p_host text)
returns text
language sql
stable
security definer set search_path = public
as $$
  select slug
  from public.tenants
  where custom_domain = lower(btrim(p_host))
    and custom_domain_status = 'active'
  limit 1;
$$;

-- EXECUTE nasce concedido a PUBLIC; fechar e reabrir só p/ anon/auth.
revoke execute on function public.custom_domain_lookup(text) from public;
grant  execute on function public.custom_domain_lookup(text) to anon, authenticated;
