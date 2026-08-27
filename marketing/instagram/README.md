# Instagram @estoque.autos — 38 carrosséis prontos

Todos em **1080×1350 (4:5)**, na identidade das artes de anúncio (fundo quase-preto,
âmbar `#ff7a1a`, Anton nos títulos e Archivo no corpo). Cada pasta tem os slides em
PNG na ordem de publicação e a legenda pronta em `legenda.md`.

```
lancamento/     3 carrosséis sobre a empresa (slide-1.png … slide-N.png)
blog/           35 carrosséis, um por post do blog
                (01-capa · 02-resumo · 03-resumo · 04-resumo · 05-conclusao)
```

Regenerar tudo: `node marketing/instagram/build.mjs` (Chrome headless; precisa de
rede na primeira vez, porque Anton e Archivo vêm do Google Fonts). Também aceita
filtro: `node marketing/instagram/build.mjs blog fipe giro`.

O `.html` de cada slide fica ao lado do `.png` — é a fonte, útil para conferir
ou ajustar um slide isolado antes de regerar.

## Onde mexer no conteúdo

| Arquivo | O que tem |
| --- | --- |
| `lib/render.mjs` | CSS da marca e os 7 layouts de slide (`capa`, `text`, `list`, `cards`, `browser`, `phone`, `grid`, `final`) |
| `lancamento/posts.mjs` | Os 3 posts de lançamento, com slides e legendas |
| `blog/<categoria>.mjs` | Um arquivo por categoria do blog: gestão, financeiro, vendas, consignados, marketing |
| `blog/posts.mjs` | Só a ordem de publicação — o build falha se algum slug ficar de fora |

## Os 3 primeiros posts (lançamento)

| Dia | Post | Pasta | Slides | Gancho |
| --- | --- | --- | --- | --- |
| 1 (hoje) | **Missão** — por que existimos | `lancamento/01-missao` | 5 | "Site próprio não devia ser privilégio de loja grande." |
| 3 | **Como funciona** — 3 passos | `lancamento/02-simples` | 5 | "Do cadastro ao site no ar em 3 passos." |
| 5 | **O produto** — moderno e completo | `lancamento/03-produto` | 6 | "Um site que parece de loja grande." |

Fixe o post 1 no topo do perfil.

## Depois: os 35 do blog

A ordem em `blog/posts.mjs` já alterna as categorias — nunca dois posts do mesmo
assunto em sequência. A dois posts por semana, os 35 mantêm o perfil ativo por
cerca de quatro meses; a três por semana, por dois meses e meio.

Sequência sugerida de abertura: precificação → giro de estoque → WhatsApp →
margem → avaliação na compra → fotos. São os assuntos de maior busca e os que
mais geram salvamento.

Alterne 1 post de produto (lançamento, bastidor, template novo) a cada 3 ou 4 de
conteúdo, para o perfil não virar só blog.

## Checklist ao publicar

1. Instagram → Nova publicação → selecione os slides **na ordem** (01 → 05).
2. Cole a legenda de `legenda.md` — a primeira linha é o gancho; hashtags no fim.
3. Alt text: o título do slide de capa.
4. Link na bio: `https://estoque.autos/?utm_source=instagram&utm_medium=social&utm_campaign=<lancamento|blog>`
   — e, nos posts do blog, aponte para o artigo correspondente:
   `https://estoque.autos/blog/<slug>/`.
5. Depois de publicar, compartilhe o slide de capa nos Stories com o sticker de link.

Melhor horário: 11h–13h ou 18h–20h, quando o lojista está no celular.

## Bio sugerida

> O site da sua loja de carros, no ar em minutos.
> 6 templates · tabela FIPE · leads no seu WhatsApp
> A partir de R$ 24,90/mês ↓

## Relação com `media/social/`

`media/social/` é o pipeline antigo (sharp + SVG, `scripts/gen-social.mjs`), que
cobria 15 dos 35 posts e não tinha legendas. Estes carrosséis substituem aquele
conjunto: cobrem o blog inteiro, usam as fontes da marca e já vêm com a legenda
escrita. Os singles (`stat`/`myth`/`quote`) e as capas de reels de lá continuam
úteis como conteúdo de intervalo.
