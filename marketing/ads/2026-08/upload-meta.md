# Roteiro de subida via MCP da Meta Ads — estoque.autos · lançamento ago/26

Mesmo método do imoveis.plus (conta Bytewell, MCP `meta-ads` em `https://mcp.facebook.com/ads`,
já adicionado ao `.mcp.json` deste projeto). Criar tudo **PAUSADO**; ativar só com ok humano.

## Pré-requisitos (ordem)

1. **MCP conectado**: reiniciar o Claude Code neste projeto → `/mcp` → autenticar `meta-ads`
   (mesma conta Meta usada no imoveis.plus; o business `imoveis_plus` 1083074771349963 pode
   ser reutilizado ou criar um BM "estoque.autos" — decisão do Ricardo).
2. **Página do Facebook "estoque.autos"** (não dá para criar por API): Ricardo cria no BM,
   com foto/capa de `marketing/artes` (ou gerar via `marketing/artes/fontes`). Vincular o
   Instagram @estoque.autos se existir.
3. **Conta de anúncios**: reutilizar 4401115350132000 (imoveis.plus, cartão cadastrado) ou
   criar uma "estoque.autos" no mesmo BM (`ads_create_ad_account` ou pelo BM). Preferir conta
   própria → relatórios e faturas separados por produto.
4. **Pixel**: criar "estoque.autos" (Events Manager ou `ads_create_pixel` na conta) →
   colar o ID em `.env.local` como `NEXT_PUBLIC_META_PIXEL_ID=` → `bash scripts/deploy-prod.sh`.
   Conferir no HTML de https://estoque.autos (`fbq('init','<id>')`). O código já dispara
   PageView (todas as rotas da plataforma), CompleteRegistration (/cadastro/assinatura),
   InitiateCheckout (clique em "Continuar para o pagamento") e Purchase (/onboarding?assinatura=ok,
   com valor do plano) — ver `src/lib/funnel.ts`. Nunca dispara nas vitrines dos lojistas.
5. **Stripe live** feito antes de ligar a campanha (ver README/`scripts/stripe-setup.ts`) —
   sem isso o checkout falha e o tráfego pago vira desperdício.

## Imagens públicas (upload por URL — o MCP não aceita arquivo)

Servidas pelo próprio Worker após o deploy, em `https://estoque.autos/ads/<arquivo>`:

| Arquivo | Formato | Ângulo |
|---|---|---|
| feed-03-preco.png | 1:1 | A1 preço vs. portal (1º ângulo do teste) |
| feed-01b-hero.png | 4:5 | A3 velocidade (feed mobile) |
| feed-02-dor-portal.png | 1:1 | A2 independência |
| feed-04-google.png | 1:1 | A4 confiança/Google |
| feed-05-agencia.png | 1:1 | A5 vs. agência |
| story-01-3-passos.png | 9:16 | A3 velocidade |
| story-02-preco.png | 9:16 | A1 preço |
| carrossel-c1.png, c2, c3 | 1:1 ×3 | A1 → prova (templates) → WhatsApp |

## Estrutura a criar

```
Campanha: [estoque.autos] Lançamento · ago/26
  objetivo: OUTCOME_LEADS (custo mais baixo)
  orçamento: CBO R$ 36,00/dia (3600 centavos, BRL)   ← ajustar se quiser
  início: dia da ativação · fim: +10 dias, 23:59 America/Sao_Paulo
  categoria especial: nenhuma

  Conjunto 1: lojistas-preco   (ângulo dor de portal / preço)
    otimização: OFFSITE_CONVERSIONS → pixel estoque.autos, evento CompleteRegistration
    atribuição: 7d clique / 1d view
    público: BR · pt_BR · 25–60 · todos os gêneros · Advantage+ (sem interesses — o MCP
      não busca interesses; adicionar depois no Ads Manager: "Carros usados", "Concessionária",
      "Revenda de veículos", cargos proprietário/gerente)
    posicionamentos: Advantage+
    anúncios:
      lojistas-preco-feed        → feed-03-preco.png        copy A1
      lojistas-portal-feed       → feed-02-dor-portal.png   copy A2
      lojistas-preco-story       → story-02-preco.png       copy A1
      lojistas-carrossel         → c1 + c2 + c3             copy A1 (cards: c1 "1 lead de portal = o mês
                                                            inteiro do site" · c2 "6 templates, sua cor e
                                                            logo" · c3 "leads no seu WhatsApp")

  Conjunto 2: lojistas-velocidade   (ângulo sem técnico / confiança)
    otimização/público: idem
    anúncios:
      lojistas-hero-feed         → feed-01b-hero.png        copy A3
      lojistas-google-feed       → feed-04-google.png       copy A4
      lojistas-agencia-feed      → feed-05-agencia.png      copy A5
      lojistas-passos-story      → story-01-3-passos.png    copy A3
```

**Importante (aprendido no imoveis.plus):** em CBO a Meta não deixa trocar `optimization_goal`
de um conjunto depois de criado (erro 1885760) — criar cada conjunto já com
OFFSITE_CONVERSIONS/CompleteRegistration. O MCP não apaga campanha (DELETED vira PAUSED);
erros se corrigem criando de novo e renomeando a velha `[DESCARTAR]`.

Copies exatas (primária/headline/descrição) por ângulo: `marketing/copys-anuncios.md`.
CTA: **SIGN_UP** (Cadastre-se) nos feeds; stories podem usar LEARN_MORE.

URL de destino (todos): `https://estoque.autos/?utm_source=meta&utm_medium=paid&utm_campaign=prosp&utm_content={{ad.name}}`
Carrossel: mesmo destino em todos os cards.

## Remarketing (fase 2, após ~7 dias de pixel)
Conjunto `rmkt-30d` (público personalizado: visitantes 30d do site − quem disparou Purchase),
anúncios `rmkt-01-anual` e `rmkt-03-demo` (destino `/demo/premium`). `rmkt-02-garantia` só
depois de implementar a garantia de 7 dias no Stripe/landing.

## Estado da subida
_(preencher com IDs de campanha/conjuntos/anúncios/creatives quando criados via MCP)_
