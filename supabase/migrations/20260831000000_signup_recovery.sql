-- ============================================================
-- Recuperação de cadastro — quem já recebeu o e-mail de retomada,
-- por estágio do funil (não confirmou · sem assinatura · sem loja).
--
-- A linha É a trava: sem ela o script reenviaria a mesma mensagem
-- a cada rodada, e um lojista que já ignorou uma vez viraria
-- reclamação de spam. PK composta (user_id, stage) => cada pessoa
-- recebe no máximo um e-mail por estágio, para sempre.
--
-- Escrita só pelo script de recuperação (service role, ambiente
-- confiável — mesma exceção documentada em lib/supabase/admin.ts).
-- RLS ligada e SEM policy: anon e authenticated não leem nem
-- escrevem. Ninguém no app precisa desta tabela.
-- ============================================================

create table public.signup_recovery_emails (
  user_id     uuid not null references auth.users(id) on delete cascade,
  stage       text not null
              check (stage in ('nao_confirmou','sem_assinatura','sem_loja')),
  sent_at     timestamptz not null default now(),
  -- id do envio no Resend: fecha o rastro quando for preciso
  -- investigar bounce/reclamação de um endereço específico
  provider_id text,
  primary key (user_id, stage)
);

create index signup_recovery_emails_sent_idx
  on public.signup_recovery_emails (sent_at desc);

alter table public.signup_recovery_emails enable row level security;
