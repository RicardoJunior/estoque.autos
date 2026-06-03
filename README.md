# Estoque.autos

SaaS onde o lojista de carros cria a conta, cadastra o estoque e tem um **site pronto em minutos**: 6 templates, cor principal + destaque, logo, e formulário de lead em cada carro.

> **Reescrita v2 (Next.js + Supabase).** O app vive em [`web/`](./web). Veja o [README do app](./web/README.md) para rodar.

```
web/        ← aplicação atual (Next.js 16 + Supabase)
legacy/     ← versão v1 (Express + React/Vite + crawler + infra AWS), mantida como referência
```

A v1 foi reescrita do zero por causa de bugs estruturais no fluxo principal (signup
quebrado, RLS inoperante, leads de WhatsApp perdidos, edição de veículo inexistente).
A v2 unifica painel admin + site público das lojas em um único app Next.js com SSR,
isolamento multi-tenant por RLS endurecido e deploy self-host barato.

Comece por [`web/README.md`](./web/README.md).
