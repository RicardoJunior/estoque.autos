# Prospecção — estoque.autos

Pipeline que transforma o dump `loja-carros.csv` numa lista ranqueada de lojas
de carros e fatia os destinatários em lotes de aquecimento. Mesma estratégia do
imoveis.plus, com o modelo de pontuação recalibrado para revenda de veículos.

## Uso

```bash
CSV=../../../loja-carros.csv   # o dump mora FORA do repo, na pasta acima

# 1) Ranqueia por chance de conversão (dedup por CNPJ, filtra loja de verdade).
node prospect.mjs score $CSV

# 2) (opcional) Enriquece com e-mail do sócio via parceiro chargefy.
#    Precisa de CHARGEFY_API_KEY no .env — hoje AUSENTE neste projeto.
node prospect.mjs enrich prospects-ranked.csv --limit 200

# 3) Recorta a audiência final: SP, recentes, gmail, nota máxima.
node prospect.mjs audience prospects-ranked.csv --mode empresa --uf SP \
  --anos 2022,2023,2024 --min-score 15 --dominios gmail.com --limit 725

# 4) Fatia em lotes.
node prospect.mjs lotes audience-final.csv --sizes 125,200,200,200
```

Rodadas seguintes: passe `--exclude audience-final.csv` no `score` e no
`audience` para nunca repetir quem já recebeu.

## O que o dump é (e o que ele não é)

`loja-carros.csv` — 35 MB, 160.115 linhas, latin1, **sem cabeçalho**, 13 colunas
fixas: cnpj, razão social, nome fantasia, e-mail, cep, logradouro, bairro,
município, uf, capital social, porte, cpf do sócio (mascarado), nome do sócio.
Uma linha por sócio, então 160 mil linhas viram **96.042 CNPJs únicos**.

Duas coisas que ele **não** tem e que mudaram o desenho do pipeline:

**Não tem data de abertura.** A idade sai da raiz do CNPJ, que desde 1998 é
alocada em ordem nacional. A conversão foi calibrada com duas fontes: as 200
linhas do imoveis.plus que traziam CNPJ e data lado a lado (2017–2022) e 32
consultas à BrasilAPI cobrindo 44M–58M. Os 10 pontos de controle batem 100%.

| Raiz do CNPJ | Ano | Raiz do CNPJ | Ano |
| --- | --- | --- | --- |
| ≥ 26,5M | 2017 | ≥ 41,0M | 2021 |
| ≥ 29,5M | 2018 | ≥ 44,8M | 2022 |
| ≥ 32,3M | 2019 | ≥ 48,7M | 2023 |
| ≥ 35,8M | 2020 | ≥ 53,2M | 2024 |

**Não é filtrado por CNAE.** Numa amostra de 32 CNPJs vieram revestimentos,
aluguel de máquinas, corretora de seguros, construção de edifícios, vestuário,
compra e venda de imóveis e serviço de reboque. Cerca de 40% do dump não é loja
de carro — daí o filtro por nome (`LOJA_CARRO` × `FORA_DO_ICP` no script).

## A foto é de outubro de 2024

A densidade de raízes cresce até 57M (2.260 CNPJs) e despenca em 58M (155). Os
3.525 CNPJs acima de 59M são CGC legado de antes de 1998 — a amostra trouxe uma
loja de 1988 com raiz 59,18M, por isso ali a idade fica `indeterminada`.

Consequência prática: **não existe loja aberta em 2025 ou 2026 nesta base.** O
"recente" possível é 2022–2024, ou seja, lojas com 2 a 4 anos hoje. Para atingir
quem abriu em 2025/2026 é preciso um dump novo.

## Modelo de pontuação

ICP: revenda multimarcas pequena, aberta há pouco, com e-mail de dono e sem cara
de site próprio.

| Sinal | Peso |
| --- | --- |
| Nome de loja de carros (veículos, automóveis, multimarcas, seminovos, motors…) | +4 |
| Micro ou pequeno porte | +2 |
| Porte "DEMAIS" | −1 |
| Gmail no cadastro | +4 (1 por ter e-mail + 3 pela entrega) |
| Webmail moderno (outlook, icloud) | +2 |
| Webmail legado (hotmail, yahoo, uol, terra, bol…) | −2 |
| Domínio próprio | 0 (provavelmente já tem site) |
| E-mail de contador | −6 |
| Grupo grande de concessionária (parvi, barigui, caoa, saga…) | −10 |
| Aberta há 2–4 anos | +3 |
| Aberta há 5–8 anos | +1 |
| Aberta há ≤ 1 ano ou > 8 anos | −1 |
| Capital R$ 10 mil – R$ 300 mil (núcleo do ICP) | +2 |
| Capital R$ 5 mil – R$ 10 mil | +1 |
| Capital R$ 300 mil – R$ 600 mil | +1 |
| Capital R$ 600 mil – R$ 1 milhão | −2 |
| Capital abaixo de R$ 5 mil | −1 |
| Capital não declarado (3,7% da base) | 0 |
| Capital ≥ R$ 1 milhão | **descarte** |
| Tem nome fantasia (marca) | +1 |
| Fora do ICP (peças, moto, caminhão, locadora, transporte, imobiliária, atacado, seguro, sucata, posto…) | −8 e descarte |

O peso do e-mail não é chute: vem do bounce **medido** nos 400 envios do
imoveis.plus — gmail 2,9% · hotmail 15,7% · yahoo.com.br 15,4% · uol 50% ·
terra 83%, com o bloco legado inteiro em 23,3%. Num disparo de 100, mandar para
caixa legada é queimar reputação de domínio sem retorno.

### Por que a faixa de capital é essa

Distribuição do capital social entre os 42.955 CNPJs do ICP que o declaram:

| p10 | p25 | p50 | p75 | p90 | p95 | p99 |
| --- | --- | --- | --- | --- | --- | --- |
| R$ 20 mil | R$ 50 mil | **R$ 100 mil** | R$ 150 mil | R$ 450 mil | R$ 1 mi | R$ 12,5 mi |

A faixa de R$ 10 mil a R$ 300 mil concentra 86% da base (36.744 lojas) — é a
revenda de bairro que o produto atende. Abaixo de R$ 5 mil costuma ser
intermediação de uma pessoa só, sem pátio. Acima de R$ 1 milhão (o p95) não é
mais loja pequena: é grupo, concessionária ou frota.

Duas ressalvas honestas. Primeira: capital social é número **declarado**, não
capital de giro real — micro LTDA costuma declarar R$ 100 mil redondos
independente do tamanho (daí a mediana exata em R$ 100 mil). Ele funciona bem
como teto, para cortar o gigante, e mal como instrumento de precisão; o porte
continua sendo o sinal mais forte. Segunda: o teto é **descarte**, não
penalidade. Com os −2 que o modelo tinha antes, uma empresa de capital milionário
ainda somava 12 pontos e passava por um `--min-score 12` — 5.171 CNPJs entravam
por essa porta.

## Resultado desta rodada

```
96.042 CNPJs únicos
 −38.093  nome não é de loja de carros
 − 8.860  fora do ICP (peças, moto, locadora, transporte, imobiliária…)
 − 5.171  capital ≥ R$ 1 milhão
 − 1.379  score ≤ 0
 =42.539  dentro do ICP        (37.048 com e-mail no cadastro)
```

Por ano de abertura: 2016 ou antes 14.776 · 2017 1.749 · 2018 2.033 · 2019 2.829
· 2020 3.736 · 2021 3.415 · 2022 3.512 · 2023 4.765 · 2024 4.535 ·
indeterminado 1.189.

Por faixa de capital: não declarado 1.644 · abaixo de R$ 5 mil 449 · R$ 5–10 mil
714 · **R$ 10–300 mil 36.744** · R$ 300–600 mil 2.439 · R$ 600 mil–1 mi 549.

### A rodada 1: São Paulo

Recorte: **UF = SP**, recentes (2022–2024), gmail, score ≥ 15.

```
11.284  lojas de SP dentro do ICP
 3.456  recentes (2022–2024)
 1.423  + gmail no cadastro
 1.144  + score ≥ 15   ← pool disponível
   725  usados nesta rodada
```

Os 725 têm todos **score 16**, a nota máxima. Capital de R$ 10 mil a R$ 300 mil
(p25 R$ 30 mil, mediana R$ 50 mil), espalhados por **148 municípios**: a capital
leva 203, e o resto se divide entre Campinas 31, Guarulhos 21, Sorocaba 20, São
Bernardo 19, Santo André 18, São José dos Campos 18, Ribeirão Preto 16 e mais 140
cidades. Por ano de abertura: 2024 268 · 2023 255 · 2022 202.

Sobra no pool de SP para a rodada 2: **419** lojas de score ≥ 15. Baixar o corte
rende pouco — score ≥ 14 acrescenta só 24 e score ≥ 13, mais 53. Para uma rodada
2 grande em SP, o caminho é abrir os webmails modernos (outlook/icloud, que hoje
não passam de 14 pontos) ou aceitar 2021 na janela de "recente". Passe
`--exclude audience-final.csv` para não repetir ninguém.

## Os lotes

| Lote | Arquivo | Destinatários | Municípios | Anos (22 · 23 · 24) |
| --- | --- | --- | --- | --- |
| 1 | `lote-1.csv` | 125 | 57 | 31 · 44 · 50 |
| 2 | `lote-2.csv` | 200 | 74 | 49 · 74 · 77 |
| 3 | `lote-3.csv` | 200 | 77 | 55 · 71 · 74 |
| 4 | `lote-4.csv` | 200 | 67 | 67 · 66 · 67 |

725 no total, sem sobreposição entre lotes (conferido). Todos score 16.

Os lotes são fatias de uma lista embaralhada por hash estável dentro da faixa de
score, então cada um é uma amostra comparável — dá para ler bounce e resposta de
um lote e projetar para o seguinte. A distribuição por ano e por município fica
parecida nos quatro; São Paulo capital fica entre 27% e 29% de cada lote, que é
o peso dela no pool.

Espace os lotes em alguns dias e leia, entre um e outro: taxa de entrega,
bounce, reclamação de spam e respostas.

**Sobre o ritmo.** 125 e depois 200 é uma subida rápida para um subdomínio sem
histórico nenhum de envio. A referência do imoveis.plus é começar bem menor: lá
o primeiro bloco de 120 endereços em caixa legada deu 23,3% de bounce, o que
sozinho já basta para o Resend suspender a conta. Aqui o risco é menor porque os
725 são todos gmail (2,9% de bounce medido), mas o primeiro lote é onde se
descobre isso — se o lote 1 fechar com bounce acima de 5% ou qualquer
reclamação de spam, pare e reveja antes do lote 2.

## O que falta para disparar

Nada aqui manda e-mail — de propósito. E hoje faltam três coisas:

1. **`CHARGEFY_API_KEY`** não está no `.env` deste projeto (está no do
   imoveis.plus). Sem ela o `enrich` não roda. Para esta rodada o impacto é
   pequeno: os 100 já têm gmail no cadastro e o modo `empresa` usa exatamente
   esse endereço. O que se perde é a validação — o parceiro devolve um
   `EMAIL_SCORE` por endereço e permitiria descartar de antemão o que ele já
   sabe ser "RUIM".
2. **`RESEND_API_KEY`** também não está no `.env` daqui.
3. **Subdomínio dedicado**, ex.: `contato.estoque.autos`, autenticado à parte.
   Isto não é preciosismo: o e-mail transacional do produto (login, cadastro,
   recuperação de senha) sai pelo mesmo Resend. Um disparo frio mal feito gera
   reclamação e bounce e pode **suspender a conta**, derrubando o login de todos
   os lojistas que já pagam. O disparo tem que sair por domínio isolado, via
   **Resend Broadcasts** (descadastro embutido), com identificação do remetente
   e CNPJ no rodapé — exigência de LGPD.

## Dados sensíveis

Os `.csv` desta pasta e o `.cache/` contêm dados pessoais: e-mails, nome de
sócio e, no cache do parceiro, dossiê completo (CPF, endereço, telefone). Estão
no `.gitignore` da raiz — **não versione, não suba para lugar nenhum.**
