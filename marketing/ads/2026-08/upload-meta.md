# Roteiro de subida via MCP da Meta Ads — estoque.autos · lançamento ago/26

Mesmo método do imoveis.plus (MCP `meta-ads` em `https://mcp.facebook.com/ads`).
Criar tudo **PAUSADO**; ativar só com ok humano.

## Pré-requisitos

| # | Item | Estado (2026-08-25) |
|---|---|---|
| 1 | MCP `meta-ads` autenticado | ✅ conectado e respondendo |
| 2 | Página do Facebook "estoque.autos" | ✅ criada — `page_id` **1349918564861164** |
| 3 | Conta de anúncios "estoque.autos" | ⏳ Ricardo criando no BM — o MCP não cria conta |
| 4 | Pixel "estoque.autos" | ⏳ Ricardo criando no Events Manager — o MCP não cria pixel |
| 5 | `NEXT_PUBLIC_META_PIXEL_ID` no `.env.local` + deploy | ⏳ depende do (4) |
| 6 | Stripe live | ✅ prices, portal e webhook no ar |
| 7 | Artes públicas em `https://estoque.autos/ads/*.png` | ⚠️ as 5 novas entram no próximo deploy |

Depois do (4): colar o ID em `.env.local` como `NEXT_PUBLIC_META_PIXEL_ID=` e rodar o
deploy. Conferir no HTML de https://estoque.autos que aparece `fbq('init','<id>')` —
**hoje não aparece nenhum `fbq`**. O código já dispara PageView, CompleteRegistration
(/cadastro/assinatura), InitiateCheckout e Purchase (/onboarding?assinatura=ok) — ver
`src/lib/funnel.ts`. Nunca dispara nas vitrines dos lojistas.

## Imagens públicas (o MCP sobe por URL, não aceita arquivo local)

`https://estoque.autos/ads/<arquivo>` — geradas por `bash scripts/gen-ads.sh`.

| Arquivo | Formato | Ângulo |
|---|---|---|
| feed-06b-pequeno.png 🆕 | 4:5 | A6 pequeno lojista — "não precisa ser concessionária" |
| feed-06-pequeno.png 🆕 | 1:1 | A6 (variação de formato) |
| feed-07-status.png 🆕 | 1:1 | A6b "seu estoque some em 24h" |
| story-03-pequeno.png 🆕 | 9:16 | A6 story |
| feed-03-preco.png | 1:1 | A1 preço vs. portal |
| feed-01b-hero.png | 4:5 | A3 velocidade |
| feed-01-hero.png 🆕 | 1:1 | A3 (variação de formato) |
| feed-02-dor-portal.png | 1:1 | A2 independência |
| feed-04-google.png | 1:1 | A4 confiança/Google |
| feed-05-agencia.png | 1:1 | A5 vs. agência |
| story-01-3-passos.png | 9:16 | A3 story |
| story-02-preco.png | 9:16 | A1 story |
| carrossel-c1/c2/c3.png | 1:1 ×3 | A1 → prova → WhatsApp |

## Estrutura a criar

> **Mudança em relação ao roteiro anterior (2 conjuntos → 1).** A versão antiga tinha
> dois conjuntos com **exatamente o mesmo público** (BR, 25–60, Advantage+), separados só
> pelo ângulo do criativo. Isso não testa público nenhum: divide R$ 36/dia em dois
> aprendizados de R$ 18, faz os conjuntos competirem no mesmo leilão e atrasa a saída da
> fase de aprendizagem. Com o mesmo público, o teste de ângulo se faz **entre criativos
> dentro de um conjunto só** — que é onde a Meta sabe distribuir a entrega. Um segundo
> conjunto só se justifica quando o *público* mudar (remarketing, lookalike, interesses).

```
Campanha: [estoque.autos] Prospecção · ago/26
  objetivo: OUTCOME_LEADS
  orçamento: CBO R$ 36,00/dia (3600 centavos, BRL)
  início: dia da ativação · fim: +10 dias, 23:59 America/Sao_Paulo
  categoria especial: nenhuma

  Conjunto único: br-lojistas-amplo
    otimização: OFFSITE_CONVERSIONS → pixel estoque.autos, evento CompleteRegistration
    atribuição: padrão (7d clique / 1d view) — não passar attribution_spec
    público: BR · 25–60 · Advantage+ Audience (sem interesses — o MCP não busca IDs de
      interesse; se quiser afunilar depois, adicionar no Ads Manager: "Carros usados",
      "Concessionária", "Revenda de veículos", cargo proprietário/gerente)
    posicionamentos: Advantage+
    destino: WEBSITE

    anúncios (onda 1 — 7 criativos):
      pq-concessionaria-45   → feed-06b-pequeno.png   A6  · SIGN_UP
      pq-status-11           → feed-07-status.png     A6b · SIGN_UP
      preco-lead-11          → feed-03-preco.png      A1  · SIGN_UP
      velocidade-hero-45     → feed-01b-hero.png      A3  · SIGN_UP
      portal-dor-11          → feed-02-dor-portal.png A2  · SIGN_UP
      carrossel-preco        → c1 + c2 + c3           A1  · SIGN_UP
      pq-story-916           → story-03-pequeno.png   A6  · LEARN_MORE
```

Copies exatas (primária/headline/descrição) e o banco de variações: `variacoes.md`.
Ondas 2 e 3 (troca dos perdedores e teste de copy no ângulo vencedor) também lá.

**Pegadinhas aprendidas no imoveis.plus:**
- Em CBO a Meta não deixa trocar `optimization_goal` depois de criado (erro 1885760) —
  criar o conjunto já com OFFSITE_CONVERSIONS/CompleteRegistration.
- O MCP não apaga campanha (DELETED vira PAUSED); erros se corrigem criando de novo e
  renomeando a velha `[DESCARTAR]`.
- Nunca passar `daily_budget` no conjunto sob campanha CBO — a API rejeita.
- Sem `promoted_object` com `pixel_id`, OFFSITE_CONVERSIONS é rejeitado.

URL de destino (todos):
`https://estoque.autos/?utm_source=meta&utm_medium=paid&utm_campaign=prosp&utm_content=<nome-do-anúncio>`
Carrossel: mesmo destino em todos os cards.

## Remarketing (fase 2, após ~7 dias de pixel)
Conjunto `rmkt-30d` (público personalizado: visitantes 30d − quem disparou Purchase),
anúncios `rmkt-01-anual` e `rmkt-03-demo` (destino `/demo/premium`). `rmkt-02-garantia`
só depois de implementar a garantia de 7 dias no Stripe/landing.

## Estado da subida
_(preencher com IDs de campanha/conjunto/anúncios/creatives quando criados via MCP)_

- conta de anúncios: `—`
- página: `1349918564861164` (Estoque.autos)
- pixel: `—`
- campanha: `—`
- conjunto: `—`
- anúncios: `—`
