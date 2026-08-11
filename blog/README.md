# blog — estoque.autos

Blog em **Astro** (estático), com o mesmo visual do produto (tema escuro + âmbar,
Anton/Archivo). Focado em SEO/AEO: JSON-LD (`BlogPosting`, `FAQPage`,
`BreadcrumbList`), caixa de "Resposta rápida" por post, sitemap e RSS.

## Comandos

```bash
npm install
npm run dev       # http://localhost:4321/blog
npm run build     # gera ./dist
npm run preview
```

## Como adicionar um post

Crie `src/content/posts/<slug>.md` (o nome do arquivo é o slug/URL):

```yaml
---
title: "Título com a keyword principal"
description: "Meta description de 140–160 caracteres."
answer: "Resposta direta à pergunta do título, 40–70 palavras — vira a caixa 'Resposta rápida' (AEO/featured snippet)."
pubDate: 2026-08-11
category: gestao   # gestao | vendas | financeiro | consignados | marketing
tags: ["tag1", "tag2"]
faq:
  - q: "Pergunta complementar?"
    a: "Resposta autossuficiente (vira JSON-LD FAQPage)."
---
```

Regras do corpo: sem H1 (o layout renderiza o título); seções em `##`;
links internos como `/blog/<slug>/`; sem seção "Conclusão" genérica.

## URLs e deploy

- Configurado com `site: https://estoque.autos` e `base: /blog` — as URLs
  canônicas são `estoque.autos/blog/...` (o footer da landing já aponta pra cá).
- Deploy sugerido (Cloudflare): publicar `dist/` como assets estáticos
  (Workers Assets ou Pages) e criar a rota `estoque.autos/blog/*` apontando
  para esse deploy — o Worker do Next (OpenNext) continua servindo o resto.
- Para usar subdomínio (`blog.estoque.autos`): troque `site` e remova `base`
  em `astro.config.mjs`.
- O `robots.txt` do site principal já referencia
  `https://estoque.autos/blog/sitemap-index.xml`.

## Migração da rota Next `/blog`

Os 2 posts antigos do app Next (`content/blog/*.mdx`) foram portados para cá
com os MESMOS slugs — as URLs não mudam. Quando este blog assumir a rota
`/blog` em produção, remova do app Next: `src/app/blog/` e as entradas
`BLOG_SLUGS` em `src/lib/content.ts` (o `_shell.tsx` é usado também pela
central de ajuda — mova-o antes de apagar a pasta).
