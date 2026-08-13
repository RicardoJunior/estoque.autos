# Copies de anúncio — estoque.autos

Kit operacional pra subir as campanhas do plano de tráfego. Tom da marca: direto,
imperativo, segunda pessoa, zero jargão. Nunca citar marca de portal em arte ou
headline (usar "portais"). Preços: Básico R$ 24,90/mês (anual R$ 190), Pro
R$ 49,90/mês (anual R$ 490).

---

## Meta Ads — por ângulo

CTA do botão: **Cadastre-se** (prospecção/remarketing) ou **Saiba mais** (teste).
Destino: landing `/` ou demo `/demo/premium` (teste A/B do plano), sempre com UTM.

### A1 · Preço vs. portal — `feed-03`, `carrossel c1-c3`, `story-02`
- **Primária:** Portais cobram mensalidade + por lead — dividido com o concorrente
  do lado. Por R$ 24,90/mês sua loja tem site próprio com leads ilimitados caindo
  no seu WhatsApp. Sem taxa de setup, cancele quando quiser.
- **Headline:** 1 lead de portal custa o mês inteiro do site
- **Descrição:** Site pronto em minutos, com tabela FIPE e leads no WhatsApp.

### A2 · Independência — `feed-02`
- **Primária:** O mesmo comprador aciona vários anunciantes em minutos. No site da
  sua loja ele só vê os seus carros — e o lead cai no seu WhatsApp, registrado no
  painel. Crie sua vitrine hoje.
- **Headline:** No seu site, o cliente só vê a sua loja
- **Descrição:** 6 templates com sua cor e seu logo. A partir de R$ 24,90/mês.

### A3 · Velocidade / sem técnico — `feed-01`, `feed-01b`, `story-01`
- **Primária:** Crie a conta, cadastre o estoque puxando a tabela FIPE e publique.
  6 templates com sua cor e seu logo. 0 linhas de código, nenhum técnico — sua
  loja no ar ainda hoje, a partir de R$ 24,90/mês.
- **Headline:** O site da sua loja, pronto em minutos
- **Descrição:** Três passos. Nenhum técnico. Cancele quando quiser.

### A4 · Confiança / Google — `feed-04`
- **Primária:** O comprador vê seu carro no portal, gosta — e pesquisa o nome da
  sua loja no Google antes de chamar. Se não encontrar um site decente, a
  confiança cai e a venda esfria. Sua vitrine profissional pode estar no ar hoje.
- **Headline:** Pesquisaram sua loja no Google. O que vão achar?
- **Descrição:** Site próprio com todos os seus carros, preço e WhatsApp.

### A5 · Vs. agência — `feed-05`
- **Primária:** Site de agência custa milhares de reais e semanas de espera —
  e sistema completo custa R$ 200 a 600 por mês. O estoque.autos faz o que vende
  carro (vitrine, FIPE, leads no WhatsApp) por R$ 24,90/mês. Sem setup.
- **Headline:** Preço de assinatura, não de agência
- **Descrição:** No ar hoje. Sem taxa de setup, sem fidelidade.

### Remarketing
- **RMKT anual — `rmkt-01`:** Primária: "Você já viu como funciona. No plano anual,
  o Básico sai por R$ 15,83/mês (36% off) e o Pro por R$ 40,83/mês — um ano de
  site próprio pelo preço de alguns leads de portal." · Headline: "Até 36% off no
  plano anual"
- **RMKT garantia — `rmkt-02`:** ⚠️ **só rodar depois de implementar a garantia
  na landing/Stripe.** Primária: "Teste sem medo: 7 dias de garantia. Crie sua
  loja, cadastre o estoque, receba leads — se não fizer sentido, devolvemos.
  Sem pergunta." · Headline: "7 dias de garantia. O risco é nosso"
- **RMKT demo — `rmkt-03`:** Primária: "Ainda decidindo? Navegue numa loja de
  exemplo: 6 demos completas, ao vivo. Clique, filtre, abra um carro — e veja
  como o seu cliente veria a sua loja." · Headline: "Veja uma demo ao vivo" ·
  Destino: /demo/premium

---

## Google Ads — RSA (responsivo de pesquisa)

**Títulos** (≤ 30 caracteres — fixar o 1º nos grupos de "site"):

1. Site p/ Loja de Carros
2. Sua Loja no Ar em Minutos
3. A partir de R$ 24,90/mês
4. 6 Templates Prontos
5. Leads no Seu WhatsApp
6. Cadastro pela Tabela FIPE
7. Sem Taxa de Setup
8. Site Próprio p/ Revenda
9. Vitrine Profissional Hoje
10. Cancele Quando Quiser
11. Domínio Próprio no Pro
12. Site + Estoque + Leads
13. Preço de Assinatura
14. Não Dependa Só de Portal
15. Veja uma Demo ao Vivo

**Descrições** (≤ 90 caracteres):

1. Crie a conta, cadastre pela FIPE e publique. Site pronto com sua cor e logo, sem código.
2. Leads ilimitados no seu WhatsApp, registrados no painel. Planos desde R$ 24,90/mês.
3. 6 templates prontos e domínio próprio no plano Pro. Navegue numa demo completa ao vivo.
4. Sem taxa de setup e sem fidelidade. Sua vitrine no ar ainda hoje. Cancele quando quiser.

**Sitelinks:** Ver demos ao vivo (/demo) · Planos e preços (/#planos) ·
Tabela FIPE no cadastro (/blog/tabela-fipe-precificacao-estoque) · Como funciona (/#como)

**Frases de destaque:** Sem taxa de setup · Leads no WhatsApp · Tabela FIPE inclusa ·
No ar em minutos · Cancele quando quiser

---

## Convenção de UTM

`?utm_source={meta|google|wpp|afiliado}&utm_medium={paid|organic}&utm_campaign={prosp|rmkt|search-bofu}&utm_content={arte}`

Exemplos:
- Meta prospecção, arte herói: `?utm_source=meta&utm_medium=paid&utm_campaign=prosp&utm_content=feed01-hero`
- Search fundo de funil: `?utm_source=google&utm_medium=paid&utm_campaign=search-bofu&utm_content=rsa-site`
- Grupo de WhatsApp: `?utm_source=wpp&utm_medium=organic&utm_campaign=grupos&utm_content=post-blog-marketplace`

---

## Índice das artes (`marketing/artes/`)

| Arquivo | Ângulo | Formato | Uso |
|---|---|---|---|
| feed-01-hero | A3 velocidade | 1:1 | Prospecção geral |
| feed-01b-hero | A3 velocidade | 4:5 | Prospecção (feed mobile — preferir) |
| feed-02-dor-portal | A2 independência | 1:1 | Prospecção persona portal + rmkt |
| feed-03-preco | A1 preço | 1:1 | Prospecção — 1º ângulo do teste |
| feed-04-google | A4 confiança | 1:1 | Prospecção personas 2 e 3 |
| feed-05-agencia | A5 vs. agência | 1:1 | Prospecção loja tradicional |
| story-01-3-passos | A3 velocidade | 9:16 | Stories/Reels |
| story-02-preco | A1 preço | 9:16 | Stories/Reels |
| carrossel-c1/c2/c3 | A1→prova→WhatsApp | 1:1 ×3 | Carrossel Meta (ordem c1-c2-c3) |
| rmkt-01-anual | Oferta anual | 1:1 | Remarketing 30/90d |
| rmkt-02-garantia | Garantia 7 dias | 1:1 | Remarketing — ⚠️ após implementar garantia |
| rmkt-03-demo | Demo ao vivo | 1:1 | Remarketing frio→morno (destino /demo) |

Fontes editáveis (HTML/CSS) em `artes/fontes/` — editar e re-printar em 1080px
de viewport (@2x) para gerar variações.
