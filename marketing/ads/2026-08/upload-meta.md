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
_(atualizado 2026-08-26)_

- conta de anúncios: `3002622743416647` (Estoque.autos, BM `1084593411190039`) —
  ✅ forma de pagamento ativa desde 2026-08-26
- página: `1349918564861164` (Estoque.autos)
- instagram: Ricardo vinculou em 2026-08-26, mas `ads_get_ig_accounts` ainda retorna
  vazio (propagação ou falta de permissão `instagram_basic` no app do MCP) — conferir na
  prévia do anúncio se o perfil do IG aparece
- pixel/dataset: `1124618420524857` ✅ criado, visível pela conta, `fbq('init')` no ar
  em produção desde o deploy de 2026-08-26 (conferido no chunk `2qyxqtmb9rcwu.js`).
  **Disparo confirmado em 2026-08-26 pelo navegador**: `GET www.facebook.com/tr/?id=
  1124618420524857&ev=PageView` → 200, `fbq.loaded = true` em https://estoque.autos.
  (A "Visão geral" do dataset mostrava vazio só porque o seletor de data vinha até 25/ago.)
- campanha: `120248202357170630` · **ACTIVE desde 2026-08-26 16:37 (-03)** · OUTCOME_LEADS · CBO R$ 36/dia
- conjunto: `120248202459710630` · **ACTIVE** · fim 2026-09-05 23:59 (-03) · `br-lojistas-amplo` · OFFSITE_CONVERSIONS →
  pixel `1124618420524857` / CompleteRegistration · BR 25–60 Advantage+ · WEBSITE ·
  atribuição padrão 7d clique / 1d view · sem datas (definir na ativação: +10 dias)
- anúncios: ✅ **7 de 7 ACTIVE** (6 ACTIVE + `pq-story-916` IN_PROCESS na revisão)
- domínio `estoque.autos`: ✅ **Verified** no BM. Meta tag `facebook-domain-verification`
  publicada na landing
  (`src/app/page.tsx`, campo `other` do metadata — de propósito NÃO no layout raiz, que
  também serve as vitrines dos lojistas).
- correspondência avançada automática ("Correspondência automática de site") e
  "informações mais detalhadas de páginas e produtos": **já ativadas** por padrão.
- **Configuração de eventos agregados**: não existe como tela nesta conta (não aparece em
  Todas as ferramentas nem no Gerenciador de Eventos). O dataset ainda não tem histórico
  de eventos; revisitar quando houver volume — hoje a Meta prioriza automaticamente.
- **Token da API de Conversões**: a tela está pronta em Gerenciador de Eventos → dataset →
  Configurações → API de Conversões → "Configurar integração direta" → botão **Gerar token
  de acesso**, com "Configurar com a Dataset Quality API" (recomendado) já selecionado.
  Deixado para o Ricardo clicar — gerar token é criar credencial, e o valor aparece uma vez só.

### Imagens na biblioteca da conta (image_hash)
| arte | hash |
|---|---|
| feed-06b-pequeno | `3544bfb966ae407503e432640dddeb61` |
| feed-07-status | `9dd90bdf6a5e55110dff57b0353306b1` |
| story-03-pequeno | `a49d7f5f3c5e4ad2b75eca2a29a46538` |
| feed-03-preco | `4ddd7dc8e0fcc31d899b94e051ea72c9` |
| feed-01b-hero | `13565994d0adb326cd32ed46e760fc22` |
| feed-02-dor-portal | `1db71244887ec68b94f1e9422a70b809` |
| carrossel-c1 | `e84525da46f211a1cc6e3525628383d0` |
| carrossel-c2 | `b38426108bdceb5a7b0570e6e293448e` |
| carrossel-c3 | `112de1e5767703e000619491f13e5cfd` |
| feed-04-google (onda 2) | `c49637c7024c973521ae96ba3656ba64` |
| feed-05-agencia (onda 2) | `98c402c48b88d0bcb6dc656bfdb77638` |
| story-01-3-passos (onda 2) | `f6bb36da67d03ede5306c5cdd045df95` |
| story-02-preco (onda 2) | `c7c7adc117adf148ec5133a93ff5b724` |

Faltam só as duas variações de formato da onda 2: `feed-06-pequeno`, `feed-01-hero`
(já públicas, é só subir quando forem usadas).

### Criativos criados — onda 1 completa (creative_id)
| # | anúncio | creative_id | CTA |
|---|---|---|---|
| 1 | pq-concessionaria-45 | `1612425906951621` | SIGN_UP |
| 2 | pq-status-11 | `1387569616798430` | SIGN_UP |
| 3 | preco-lead-11 | `4341761069407331` | SIGN_UP |
| 4 | velocidade-hero-45 | `4159682097509669` | SIGN_UP |
| 5 | portal-dor-11 | `1990355959034210` | SIGN_UP |
| 6 | carrossel-preco | `1423003839680983` | SIGN_UP |
| 7 | pq-story-916 | `2355776818508064` | LEARN_MORE |

### Anúncios (ad_id) — ATIVOS no conjunto `120248202459710630`
| anúncio | ad_id |
|---|---|
| pq-concessionaria-45 | `120248202623830630` |
| pq-status-11 | `120248202624200630` |
| preco-lead-11 | `120248202625610630` |
| velocidade-hero-45 | `120248202626250630` |
| portal-dor-11 | `120248202628440630` |
| carrossel-preco | `120248202629370630` |
| pq-story-916 | `120248202629860630` |

Ricardo mandou publicar em 2026-08-26 mantendo o plano original: **R$ 36/dia com os 7
anúncios** (≈ R$ 5/dia por anúncio). Isso fica abaixo do que dá leitura estatística e a
fase de aprendizagem (≈50 conversões/semana) não será atingida — **julgar criativo por
CTR/CPC nos primeiros dias, não por CPA**. Se em ~3 dias o volume estiver muito diluído,
a correção é pausar os 3 piores e concentrar a verba nos 4 melhores.

### Token da API de Conversões
Gerado pelo Ricardo em 2026-08-26 (dataset → Configurações → API de Conversões → Gerar
token de acesso, com Dataset Quality API). Guardado no `.env.local` como `META_CAPI_TOKEN`
e como secret do Worker; adicionado à lista `SECRETS` do `deploy-prod.sh`. Validado com
`POST /v23.0/1124618420524857/events` + `test_event_code: TEST58622` → `events_received:1`.
O token NÃO tem permissão de leitura do objeto dataset (GET retorna "Missing Permission")
— isso é esperado, ele serve para postar eventos.

Nenhum criativo usa Advantage+ Creative (as artes são tipográficas; o realce automático
recorta e reescreve texto). `self_ai_disclosure` não foi declarado — decisão do Ricardo.
Headlines/descrições dos 3 cards do carrossel não estavam no roteiro; foram escritas
aqui (preço → templates → WhatsApp), revisar se quiser.

### API de Conversões
Orientações completas em `capi.md` (token, dedupe por `event_id`, onde plugar cada
evento, teste). Ainda não implementado no código.
