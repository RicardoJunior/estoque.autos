-- ============================================================
-- Self-heal de profile órfão.
--
-- Bug real (pego no E2E): usuário do auth criado ANTES da tabela
-- profiles existir (ou trigger falho) não tem linha em profiles →
-- getSession() retorna null com sessão válida → /admin redireciona
-- /login, que redireciona /admin → loop infinito de redirects.
--
-- Fix: o usuário pode (re)criar APENAS o próprio profile; o app
-- insere a linha ausente em getSession(). O trigger
-- profiles_immutable continua valendo para UPDATE.
-- ============================================================

create policy "profiles_own_insert"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());
