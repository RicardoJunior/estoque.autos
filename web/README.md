# estoque.autos

SaaS onde o lojista de carros cria a conta, cadastra o estoque e tem um **site pronto em minutos**: escolhe entre 6 templates, define cor principal e de destaque, sobe o logo, cadastra os carros — e cada carro tem formulário de proposta + botões de WhatsApp/telefone que viram leads.

## Stack

- **Next.js 16** (App Router, React Server Components, SSR) — app único: painel admin + site público das lojas
- **Supabase** — Postgres, Auth, Storage e Realtime
- **Tailwind CSS v4**, **Zod**, **sharp**
- **Vitest** para testes de lógica
- `output: "standalone"` → roda em qualquer VPS barato (sem Vercel)

## Arquitetura

```
src/
├── app/
│   ├── (auth)/            login, cadastro, recuperação de senha
│   ├── onboarding/        wizard "site em minutos" (loja → template → cor → logo)
│   ├── admin/             painel: dashboard, veículos, leads, site, configurações
│   ├── [slug]/            SITE PÚBLICO da loja (SSR) + /carros/[id] + sitemap
│   ├── auth/callback/     troca de code (confirmação de e-mail / reset)
│   └── page.tsx           landing de marketing
├── components/
│   ├── storefront/        kit do site público + templates/ (6 templates)
│   ├── admin/             sidebar, realtime de leads, badges
│   └── ui/                campos e botões compartilhados
├── lib/                   supabase clients, auth, validação (Zod), tipos, imagens
└── proxy.ts               sessão Supabase + proteção das rotas /admin
supabase/migrations/       schema + RLS (multi-tenant, endurecido)
```

Multi-tenant por **slug**: `/{slug}` é o site da loja. Isolamento garantido por **RLS** no Postgres; o site público lê apenas as views projetadas `storefronts` e `vehicles_public` (sem placa, sem dados internos), e leads entram por uma função `create_lead` com whitelist.

## Rodando localmente

Pré-requisitos: **Node 20.9+** e **Docker** (para o Supabase local) ou um projeto Supabase na nuvem.

### Opção A — Supabase local (recomendado)

```bash
# 1. Supabase CLI (uma vez): https://supabase.com/docs/guides/cli
brew install supabase/tap/supabase   # ou veja a doc

cd web
npm install
supabase init        # cria supabase/config.toml (mantém as migrations existentes)
supabase start       # sobe Postgres/Auth/Storage/Studio (precisa de Docker)
supabase db reset    # aplica migrations + seed (loja "demo")

# pegue as chaves locais que o `supabase start` imprimiu:
cp .env.example .env.local
#   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key do output>

npm run dev
```

- Site de demonstração: http://localhost:3000/demo
- Criar conta: http://localhost:3000/cadastro → onboarding → painel

> Para o dev local, deixe a confirmação de e-mail desligada no `supabase/config.toml`
> (`[auth.email] enable_confirmations = false`) — assim o cadastro já entra logado.

### Opção B — Supabase na nuvem

Crie um projeto em supabase.com, rode as migrations (`supabase db push` ou cole o SQL de `supabase/migrations/` no editor), e preencha `.env.local` com a URL e a anon key do projeto.

## Scripts

```bash
npm run dev        # desenvolvimento
npm run build      # build de produção (standalone)
npm run start      # roda o build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # vitest (lógica: validação, slug, leads, cores)
```

## Deploy (VPS barato)

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... \
  --build-arg NEXT_PUBLIC_APP_URL=https://app.estoque.autos \
  -t estoque-autos .

docker run -p 3000:3000 estoque-autos
```

Aponte um proxy reverso com TLS (Caddy/Nginx) para a porta 3000. Para os sites
das lojas, use `app.estoque.autos/{slug}` (ou um wildcard `*.estoque.autos`).
