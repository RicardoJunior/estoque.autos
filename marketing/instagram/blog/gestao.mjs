/** Carrosséis dos posts da categoria Gestão. */
const NAMES = ['01-capa', '02-resumo', '03-resumo', '04-resumo', '05-conclusao']
const FOOT = 'post completo no blog · link na bio'
const EYE = 'gestão'

export const GESTAO = [
  {
    dir: 'giro-de-estoque-carros-quantos-dias',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 82, title: 'Quantos dias<br>seu carro pode<br>ficar <em>parado</em>?', sub: 'A régua de 30, 60 e 90 dias — e o que fazer em cada faixa.' },
      { kind: 'list', eyebrow: 'as faixas', size: 64, title: 'O relógio do pátio', items: [
        '<strong>Até 30–45 dias:</strong> zona saudável — a margem planejada se realiza',
        '<strong>45 a 60 dias:</strong> alerta — preço, foto ou anúncio estão errados',
        '<strong>Acima de 90 dias:</strong> prejuízo — a conversa vira quanto parar de perder',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'régua de ação', size: 62, title: 'Nenhum carro muda<br>de faixa sem ação', items: [
        '•<strong>0–30 dias:</strong> fotos padrão e anúncio completo em todos os canais',
        '•<strong>30–60:</strong> corte com critério, refaça fotos, ofereça à carteira',
        '•<strong>60–90:</strong> preço agressivo, destaque e troca com outro lojista',
        '•<strong>90+:</strong> girar com margem mínima — repasse, leilão ou permuta',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'a conta', size: 62, title: 'Como calcular<br>o giro mensal', items: [
        'Estoque médio = (carros no dia 1 + no último dia) ÷ 2',
        'Conte as vendas do mês',
        'Vendas ÷ estoque médio = giro do mês',
        'Dias do mês ÷ giro = dias médios de pátio',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'por onde começar', size: 70, title: 'Carro parado<br>não é azar', sub: 'Ordene o estoque por data de entrada, separe quem passou de 60 dias e defina uma ação por carro ainda esta semana.', foot: FOOT },
    ],
    legenda: `Todo pátio tem aquele carro que "está quase vendendo" há três meses.

Giro de estoque é o indicador que tira essa conversa da sensação e coloca no número: ele diz quantas vezes o seu capital trabalha por ano e denuncia, carro a carro, onde o dinheiro está travado.

As faixas que o mercado de usados costuma usar:
→ Até 30–45 dias: zona saudável. O carro foi bem comprado e bem anunciado.
→ 45 a 60 dias: zona de alerta. Preço, foto, anúncio ou o próprio carro estão errados — é hora de mexer, não de esperar.
→ Acima de 90 dias: zona de prejuízo. Entre capital preso, desvalorização e custo de pátio, a margem planejada já foi embora em silêncio.

A régua de ação, por idade:
0–30 dias — fotos padrão, anúncio completo em todos os canais, preço de mercado
30–60 — reduzir preço com critério, refazer fotos, oferecer ativamente à carteira
60–90 — preço agressivo, destaque nos portais, avaliar troca com outro lojista
90+ — girar com margem mínima ou zero: repasse, leilão de lojista ou permuta

Duas regras tornam a régua eficaz: a revisão é semanal, sempre no mesmo dia, com o estoque ordenado do carro mais velho para o mais novo. E reduzir preço cedo custa menos que reduzir tarde — o primeiro corte, aos 30 dias, quase sempre é menor que o corte desesperado feito aos 100.

Para calcular o giro do mês: estoque médio = (carros no dia 1 + no último dia) ÷ 2. Depois, vendas ÷ estoque médio = giro. E dias do mês ÷ giro = seus dias médios de pátio.

Post completo, com as três causas mais comuns de encalhe, no blog. Link na bio.

#estoqueautos #girodeestoque #lojadecarros #revendadeveiculos #gestaodeestoque #carrosusados #seminovos #carroencalhado #gestaodeloja #vendadecarros #lojadeveiculos #revendedordecarros`,
  },

  {
    dir: 'gestao-de-estoque-loja-de-carros',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 82, title: 'Pátio cheio<br>não é loja<br><em>saudável</em>', sub: 'Gestão de estoque é controlar o que entra, quanto tempo fica e por quanto sai.' },
      { kind: 'list', eyebrow: 'o mix', size: 60, title: 'Três papéis dentro<br>do mesmo pátio', items: [
        '<strong>Carros de giro:</strong> populares da sua praça — pagam as contas do mês',
        '<strong>Carros de margem:</strong> mais desejados, giram devagar e lucram mais',
        '<strong>Carros de vitrine:</strong> chamam gente para a loja — e podem demorar',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'o custo invisível', size: 60, title: 'O que um carro<br>parado te cobra', items: [
        '•<strong>Capital preso:</strong> o dinheiro dele não compra outro que giraria',
        '•<strong>Desvalorização:</strong> a tabela cai e o carro envelhece um ano-modelo',
        '•<strong>Custo de pátio:</strong> aluguel, seguro, lavagem, bateria, documentação',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'rotina', size: 58, title: 'Trinta minutos<br>toda segunda-feira', items: [
        'Liste o estoque por idade, do mais velho para o mais novo',
        'Compare cada carro com os anúncios da sua região',
        'Cheque leads e visitas da semana, carro a carro',
        'Registre a decisão — inclusive quando for "mantém"',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'por onde começar', size: 68, title: 'Comece pelo<br>inventário', sub: 'Liste cada carro do pátio com data de entrada, custo total e preço atual, e ordene por dias de estoque. Três carros vão pular da lista.', foot: FOOT },
    ],
    legenda: `Muita revenda quebra com o pátio lotado.

O estoque é onde mora quase todo o dinheiro de uma loja de carros. Cada vaga é capital investido — e pátio cheio só significa loja saudável se aqueles carros estiverem girando.

Um mix equilibrado tem três papéis:
→ Carros de giro: populares na faixa de preço mais procurada da sua cidade. Vendem rápido, com margem menor, e pagam as contas do mês.
→ Carros de margem: modelos mais desejados ou difíceis de achar. Giram um pouco mais devagar e deixam lucro maior por unidade.
→ Carros de vitrine: uma ou outra unidade que traz gente para a loja — desde que você aceite que podem demorar a sair.

E o carro parado cobra em três frentes ao mesmo tempo: capital preso (o dinheiro dele não compra outro que giraria), desvalorização (a tabela cai e ele envelhece mais um ano-modelo) e custo de pátio (aluguel, seguro, lavagem, bateria, documentação vencendo).

A rotina que resolve cabe em 30 minutos por semana:
1. Escolha um dia fixo — segunda de manhã funciona bem
2. Liste o estoque por idade, do mais velho para o mais novo
3. Compare cada carro com anúncios equivalentes da sua região
4. Cheque leads e visitas por carro: anúncio ativo com zero contato tem problema de preço ou de foto
5. Registre a decisão, mesmo quando for "mantém"

Post completo, com padronização de cadastro e quando aceitar prejuízo para girar, no blog. Link na bio.

#estoqueautos #gestaodeestoque #lojadecarros #revendadeveiculos #carrosusados #seminovos #girodeestoque #gestaodeloja #mixdeestoque #vendadecarros #lojadeveiculos #revendedordecarros`,
  },

  {
    dir: 'como-avaliar-carro-na-compra',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 82, title: 'O lucro não<br>se faz na venda.<br>Se faz na <em>compra</em>', sub: 'O checklist das três frentes — e a conta do teto de compra.' },
      { kind: 'list', eyebrow: 'frente 1 e 2', size: 58, title: 'Mecânica e estética', items: [
        '•<strong>Motor frio:</strong> partida, ruído, fumaça, vazamento, aspecto do óleo',
        '•<strong>Câmbio e suspensão:</strong> engates, trancos, folgas, desgaste irregular',
        '•<strong>Pintura e estrutura:</strong> tom entre peças, longarinas, folgas nos vãos',
        '•<strong>Test drive de verdade:</strong> alguns km, com trecho de via rápida',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'frente 3', size: 58, title: 'Documental — onde moram<br>os maiores prejuízos', items: [
        'Débitos: IPVA, licenciamento e multas no Detran do estado',
        'Restrições: gravame ativo, bloqueio judicial, comunicação de venda',
        'Histórico: passagem por leilão, sinistro, indenização integral',
        'Chassi e motor conferidos fisicamente contra o documento',
      ], foot: FOOT },
      { kind: 'cards', eyebrow: 'a conta', size: 60, title: 'Teto de compra,<br>de trás para frente', cards: [
        { lbl: 'Preço-alvo de venda', big: 'R$ 60.000', note: 'pesquisa real de comparáveis na sua praça' },
        { lbl: '(−) preparação, documentação e custos de venda', big: 'R$ 6.000', note: 'mecânica, estética, pneus, transferência, comissão' },
        { lbl: '(−) margem que a loja precisa', big: 'R$ 6.000', on: true, note: '<strong>= teto de compra: R$ 48.000.</strong> Valores ilustrativos — o que importa é o método' },
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'a regra', size: 66, title: 'Se o dono não<br>aceita o teto,<br>não compre', sub: 'Todo carro pago acima da conta entra no pátio já encalhado — só que ninguém percebe ainda. E nenhum carro entra no estoque sem laudo cautelar.', foot: FOOT },
    ],
    legenda: `Na revenda de usados, o lucro não se faz na venda — se faz na compra.

Um carro bem comprado se vende quase sozinho; um carro mal comprado nenhum vendedor salva. E avaliar carro é processo, não olho clínico: quem confia só na experiência um dia compra um batido e recuperado com aparência de histórico limpo.

O checklist tem três frentes.

Mecânica, com o carro frio: partida, ruídos, fumaça, vazamentos e aspecto do óleo; cor do líquido de arrefecimento e borra no reservatório; engates no manual e trocas no automático; folgas na suspensão e desgaste irregular dos pneus; freios, elétrica e ar-condicionado. Fecha com test drive de alguns quilômetros, incluindo via rápida.

Estética: diferença de tom entre peças, tinta em borrachas e parafusos, longarinas e pontos de solda, folgas desiguais nos vãos, datas de fabricação de vidros e faróis, desgaste do interior coerente com a quilometragem. Anote cada apontamento com foto.

Documental — onde moram os maiores prejuízos: débitos (IPVA, licenciamento, multas), restrições (gravame, bloqueio judicial), histórico de sinistro e leilão, chassi e motor batendo com o documento e procedência de quem está vendendo.

E o laudo cautelar não se pula: nenhum carro entra no estoque sem ele, e toda compra fica condicionada à aprovação, por escrito.

A conta do teto de compra é de trás para frente: preço-alvo de venda (pesquisa real de comparáveis na sua praça), menos preparação, documentação e custos de venda, menos a margem de que a loja precisa. O que sobrar é o limite — sem exceção de ocasião. Se o proprietário não aceita, a resposta certa é não comprar.

Post completo, com o checklist item a item, no blog. Link na bio.

#estoqueautos #avaliacaodeveiculos #compradeestoque #laudocautelar #lojadecarros #revendadeveiculos #carrosusados #seminovos #checklist #vendadecarros #lojadeveiculos #revendedordecarros`,
  },

  {
    dir: 'mix-de-estoque-carros-mais-procurados',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 78, title: 'Os carros que o<br>brasileiro mais<br><em>procura</em> em 2026', sub: 'O ranking de buscas — e por que ele não é uma lista de compras.' },
      { kind: 'cards', eyebrow: 'buscas no google', size: 62, title: 'O top 3 do<br>primeiro semestre', cards: [
        { lbl: 'Hyundai HB20', big: '~223 mil', note: 'buscas no semestre' },
        { lbl: 'VW Gol', big: '~195 mil', note: 'nem sai mais de fábrica — a procura é por usado' },
        { lbl: 'Chevrolet Onix', big: '~171 mil', on: true, note: '<strong>Palio, Ka e Fox</strong> também no top 10' },
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'a leitura certa', size: 58, title: 'Demanda não<br>é margem', items: [
        '<strong>Popular de entrada</strong> — giro rápido, margem menor: volume e caixa girando',
        '<strong>Compacto atual</strong> — giro rápido, margem intermediária: carro-chefe',
        '<strong>Médio consolidado</strong> — mais lento, margem maior: lucro por venda',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'demanda local', size: 58, title: 'A sua cidade não é<br>a média do Brasil', items: [
        '•Registre <strong>leads por modelo</strong> — em 30 dias você enxerga sua praça',
        '•Meça o tempo de pátio <strong>por segmento</strong>, não só a média da loja',
        '•Teste com <strong>uma ou duas unidades</strong> antes de comprar o lote',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'por onde começar', size: 64, title: 'Conte o pátio.<br>Depois conte<br>os leads', sub: 'A diferença entre as duas listas é o seu plano de compra: onde chega lead e falta carro é para onde vai o próximo capital.', foot: FOOT },
    ],
    legenda: `Montar estoque no achismo é o jeito mais caro de aprender sobre demanda.

Levantamentos de 2026 mostram o que o brasileiro digitou no Google no primeiro semestre:
→ Hyundai HB20 — cerca de 223 mil buscas
→ VW Gol — cerca de 195 mil
→ Chevrolet Onix — cerca de 171 mil
→ Palio, Ford Ka e Fox também no top 10
→ Civic e Corolla fortes entre os médios

A leitura mais importante não está nos números, e sim no padrão: usado barato tem demanda enorme. Gol, Palio, Ka e Fox nem saem mais de fábrica — quem pesquisa esses nomes está procurando um usado acessível, com mecânica conhecida e peça em qualquer esquina.

Mas atenção: o ranking não é lista de compras. Demanda alta significa giro rápido, não lucro alto por unidade.
Popular de entrada — giro rápido, margem menor: volume e caixa girando
Compacto atual (HB20, Onix) — giro rápido, margem intermediária: o carro-chefe da vitrine
Médio consolidado (Civic, Corolla) — giro mais lento, margem maior: lucro por venda
Seminovo premium — lento e pressionado pela queda do 0km: só com demanda comprovada

E o top 10 do Google é a média do Brasil; a sua cidade não é. Interior pede picape; capital pede compacto automático; cidade universitária gira o carro de entrada mais rápido ainda.

Como testar a demanda local: registre leads por modelo, meça tempo de pátio por segmento, acompanhe conversão e margem por faixa, teste um segmento novo com uma ou duas unidades antes do lote e rebalanceie a cada ciclo de compra.

Post completo, com os erros que travam o pátio, no blog. Link na bio.

#estoqueautos #mixdeestoque #carrosmaisprocurados #lojadecarros #revendadeveiculos #carrosusados #seminovos #compradeestoque #hb20 #onix #gol #gestaodeestoque`,
  },

  {
    dir: 'garantia-de-carro-usado-cdc',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 84, title: '"Vendido no<br>estado" <em>não</em><br>protege sua loja', sub: 'O que o CDC realmente exige da revenda de usados.' },
      { kind: 'list', eyebrow: 'a lei', size: 60, title: '90 dias de<br>garantia legal', items: [
        '•Existe <strong>por força de lei</strong> — não precisa constar no contrato',
        '•<strong>Não pode ser reduzida</strong> por cláusula nenhuma',
        '•Cobre <strong>vício</strong>: defeito que já existia e compromete o uso',
        '•<strong>Não cobre</strong> desgaste natural compatível com idade e km',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'na prática', size: 58, title: 'Vício oculto ou<br>desgaste natural?', items: [
        '<strong>Loja:</strong> motor superaquecendo na 1ª semana por junta comprometida',
        '<strong>Loja:</strong> câmbio automático com defeito recorrente após a compra',
        '<strong>Comprador:</strong> pastilhas, pneus, palhetas e itens de revisão comum',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'como baratear', size: 58, title: 'Cinco passos para<br>a garantia parar<br>de doer', items: [
        'Compre bem — a maior parte dos problemas nasce na aquisição',
        'Revisão de entrada em todo veículo, antes de anunciar',
        'Documente o estado com laudo e checklist datados',
        'Anuncie com transparência: avaria descrita não é vício oculto',
        'Provisione um percentual do lucro de cada venda',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'a virada', size: 62, title: 'Garantia bem feita<br>é argumento<br>de venda', sub: 'É exatamente o que diferencia comprar na loja de comprar de particular — e ajuda a defender a margem em vez de dar desconto.', foot: FOOT },
    ],
    legenda: `Cláusula de "vendido no estado" não protege loja nenhuma.

Pelo Código de Defesa do Consumidor, carro é bem durável e tem garantia legal de 90 dias. Ela existe por força de lei: não precisa constar no contrato, não pode ser reduzida e vale em toda venda de loja para consumidor final — carro novo ou com muitos anos de uso.

O que ela cobre é vício: o defeito que compromete o uso ou reduz o valor do veículo e que já existia, ainda que escondido, quando o carro foi entregue. O que ela não cobre é desgaste natural: o consumo normal de peças compatível com a idade e a quilometragem que o comprador conhecia.

Na prática:
→ Motor superaquecendo na primeira semana por junta já comprometida — vício oculto, loja
→ Câmbio automático com defeito recorrente logo após a compra — vício oculto, loja
→ Pastilhas de freio no fim da vida útil — desgaste natural, comprador
→ Pneus, palhetas, lâmpadas e itens de revisão comum — desgaste natural, comprador
→ Infiltração ou pane elétrica de avaria antiga não informada — vício oculto, loja

O que protege a loja não é a cláusula: é a transparência documentada. Carro anunciado com avarias descritas, laudo apresentado e preço coerente com o estado dificilmente gera condenação, porque o comprador sabia o que estava levando. O mesmo carro vendido como "impecável" é passivo com data marcada.

Cinco passos para reduzir o custo da garantia: compre bem; faça revisão de entrada em todo veículo antes de anunciar; documente o estado com laudo e checklist datados; anuncie com transparência; e provisione um percentual do lucro de cada venda num fundo interno.

Feita assim, a garantia deixa de ser ameaça e vira argumento de venda — é o que diferencia comprar na loja de comprar de particular.

Post completo, com o termo de garantia e como resolver reclamação sem virar processo, no blog. Link na bio.

#estoqueautos #garantia #cdc #direitodoconsumidor #viciooculto #lojadecarros #revendadeveiculos #carrosusados #seminovos #posvenda #vendadecarros #lojadeveiculos`,
  },

  {
    dir: 'golpes-na-compra-e-venda-de-carros',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 84, title: 'Comprovante<br>não é pagamento.<br><em>Extrato</em> é', sub: 'Os 5 golpes mais comuns contra loja de carros — e a defesa de cada um.' },
      { kind: 'list', eyebrow: 'os golpes', size: 58, title: 'Como cada<br>um funciona', items: [
        '<strong>Pix falso:</strong> app gera comprovante perfeito e o carro sai antes do dinheiro',
        '<strong>Boleto falso:</strong> código de barras trocado, a dívida original continua',
        '<strong>Clonagem de anúncio:</strong> suas fotos, preço menor, sinal no Pix do golpista',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'os golpes', size: 58, title: 'E os dois que<br>acontecem no pátio', items: [
        '<strong>Test drive:</strong> pede para dirigir, não volta — ou troca a chave por uma parecida',
        '<strong>Leilão e débito ocultos:</strong> a loja é vítima na troca, e o prejuízo só aparece na revenda',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'a defesa', size: 58, title: 'Regras que<br>fecham o rombo', items: [
        '•Carro só sai com valor <strong>conferido no app do banco</strong>, por um responsável',
        '•Boleto emitido no <strong>canal oficial</strong> e beneficiário validado na tela do banco',
        '•Test drive com <strong>CNH retida</strong>, acompanhante e rota definida por vocês',
        '•<strong>Cautelar em toda troca</strong>, sem exceção para cliente simpático',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'por onde começar', size: 62, title: 'Uma regra<br>por semana', sub: 'Comece pela que fecha o maior rombo: pagamento confirmado no extrato antes de qualquer carro sair. Comunique por escrito e não abra exceção.', foot: FOOT },
    ],
    legenda: `Comprovante não é pagamento. Extrato é.

Mercado aquecido atrai comprador — e golpista. Com cerca de 940 mil transações de usados só em abril de 2026, a revenda virou alvo preferencial de fraudes. Os cinco golpes mais comuns:

1. Comprovante Pix falso ou adulterado. Existem aplicativos que geram comprovantes com nome, valor e horário sob medida. Sinal de alerta: pressa anormal para levar o carro, pagamento "agora mesmo" fora do horário bancário. Defesa: o carro só sai depois que o valor aparece no extrato, conferido no app do banco da loja, por um responsável definido.

2. Boleto falso. Código de barras adulterado em quitação de financiamento, fornecedor ou despachante. Defesa: emita ou confira o boleto no site oficial da instituição e valide o nome do beneficiário na tela de pagamento do banco.

3. Clonagem de anúncio. O golpista copia suas fotos, anuncia mais barato e pede um Pix de "reserva". Defesa: alertas do Google com o nome e o telefone da loja, varredura semanal nos canais e um site próprio onde os preços e contatos oficiais ficam claros.

4. Golpe do test drive. Defesa: CNH original retida na loja, dados registrados, vendedor acompanhando e rota definida por vocês. Nunca fora da loja, nunca sozinho.

5. Leilão ou débitos ocultados na troca — aqui a loja é vítima na compra. Defesa: checagem cautelar em toda troca, sem exceção, além de consulta de débitos e restrições antes de assinar qualquer coisa.

Comece pela regra que fecha o maior rombo — pagamento confirmado no extrato — e implante uma nova por semana. Em um mês a política inteira está de pé.

Post completo, com a política de segurança em 6 passos, no blog. Link na bio.

#estoqueautos #golpes #pixfalso #segurança #lojadecarros #revendadeveiculos #carrosusados #seminovos #fraude #testdrive #vendadecarros #lojadeveiculos`,
  },

  {
    dir: 'indicadores-kpis-loja-de-carros',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 80, title: 'Dez números<br>que dizem onde<br>a loja <em>perde</em>', sub: 'Os KPIs essenciais da revenda — com fórmula e frequência.' },
      { kind: 'list', eyebrow: 'estoque e margem', size: 58, title: 'Os que definem<br>o lucro', items: [
        '<strong>Dias médios de pátio:</strong> soma dos dias dos vendidos ÷ carros vendidos',
        '<strong>Margem bruta por carro:</strong> venda − (compra + preparação + doc + comissão)',
        '<strong>Custo de preparação:</strong> por carro, comparado com o previsto na avaliação',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'funil e caixa', size: 58, title: 'Os que mostram<br>o gargalo', items: [
        '•<strong>Leads por canal</strong> e conversão lead→visita→venda, toda semana',
        '•<strong>Tíquete médio:</strong> faturamento ÷ carros vendidos',
        '•<strong>Ponto de equilíbrio:</strong> despesa fixa ÷ margem média = carros/mês',
      ], foot: FOOT },
      { kind: 'cards', eyebrow: 'o número-chave', size: 60, title: 'Ponto de equilíbrio<br>em carros/mês', cards: [
        { lbl: 'despesa fixa mensal', big: 'R$ 30.000', note: 'aluguel, folha, contador, sistemas, energia' },
        { lbl: 'margem bruta média por carro', big: 'R$ 5.000', note: 'com preparação, documentação e comissão descontadas' },
        { lbl: 'a partir do 7º carro, a loja lucra', big: '6 carros/mês', on: true, note: '<strong>Exemplo ilustrativo.</strong> É a divisão mais importante da loja' },
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'por onde começar', size: 64, title: 'Comece com<br>quatro, não<br>com dez', sub: 'Dias de pátio, margem por carro, leads por canal e ponto de equilíbrio. Os outros entram quando esses virarem hábito.', foot: FOOT },
    ],
    legenda: `Tem loja que vende bem e vive apertada — e o dono só descobre o porquê quando fecha o ano no contador.

O problema quase nunca é falta de esforço: é falta de medida. A boa notícia é que loja de carros precisa de poucos indicadores. Dez números cobrem estoque, margem, funil, saúde financeira e reputação:

1. Dias médios de pátio — soma dos dias de estoque dos vendidos ÷ carros vendidos (semanal)
2. Margem bruta por carro — venda − (compra + preparação + documentação + comissão)
3. Custo de preparação — por carro, comparado com o previsto na avaliação
4. Leads por canal — contatos novos por origem (semanal)
5. Conversão lead→visita→venda (semanal)
6. Tíquete médio — faturamento ÷ carros vendidos (mensal)
7. Despesa fixa mensal (mensal)
8. Ponto de equilíbrio — despesa fixa ÷ margem média por carro = carros/mês
9. Avaliações no Google — nota média e volume de avaliações novas
10. Retorno de financiamento — receita ÷ carros financiados

O número 8 é a divisão mais importante da loja. Exemplo ilustrativo: despesa fixa de R$ 30.000 e margem média de R$ 5.000 por carro dão ponto de equilíbrio de 6 carros/mês — a partir do sétimo, a loja lucra. Esse número transforma meta em matemática e dá régua objetiva para contratar, mudar de ponto ou segurar estoque.

Comece com quatro, não com dez: dias de pátio, margem por carro, leads por canal e ponto de equilíbrio. Defina de onde vem cada número, crie o ritual de leitura de 20 minutos toda segunda e, todo mês, transforme o pior indicador num plano de ação com responsável e prazo.

Post completo, com a tabela dos 10 indicadores, no blog. Link na bio.

#estoqueautos #kpis #indicadores #gestaodeloja #lojadecarros #revendadeveiculos #carrosusados #seminovos #pontodeequilibrio #margem #vendadecarros #lojadeveiculos`,
  },

  {
    dir: 'como-abrir-uma-loja-de-carros',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 80, title: 'Abrir uma loja<br>de carros:<br>o <em>passo a passo</em>', sub: 'Do CNPJ ao primeiro carro vendido — na ordem certa.' },
      { kind: 'list', eyebrow: 'primeiro passo', size: 58, title: 'Não é alugar o ponto.<br>É sentar com<br>o contador', items: [
        '<strong>Tipo de empresa</strong> e registro na Junta Comercial',
        '<strong>CNAE correto</strong> — ele condiciona alvará, inscrição estadual e Renave',
        '<strong>Regime tributário</strong> — em certos formatos, o imposto incide sobre a diferença entre compra e venda, não sobre o valor cheio',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'o capital', size: 58, title: 'O dinheiro se divide<br>em três caixas', items: [
        '•<strong>Estoque:</strong> a maior fatia — os carros que você vai revender',
        '•<strong>Capital de giro:</strong> preparação, documentação, anúncios e contas',
        '•<strong>Estrutura:</strong> reforma leve, placas, sistema, site e material de foto',
      ], foot: 'reserve de 20% a 40% do total para giro e estrutura' },
      { kind: 'list', eyebrow: 'os primeiros carros', size: 58, title: 'Quatro fontes<br>de estoque', items: [
        'Leilão — preço menor, mas a origem fica no histórico',
        'Particular — melhor custo, exige captação ativa',
        'Troca — com o tempo, vira fonte natural de estoque barato',
        'Consignação — vitrine cheia sem imobilizar capital',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'os primeiros 90 dias', size: 62, title: 'Rode o ciclo<br>completo várias<br>vezes', sub: 'Comprar, preparar, anunciar, vender, documentar e recomprar. Priorize giro em vez de margem gorda — e anote tudo.', foot: FOOT },
    ],
    legenda: `A diferença entre a revenda que prospera e a que devolve o ponto em um ano raramente está nos carros: está no que foi decidido antes do primeiro anúncio.

O primeiro passo não é alugar o ponto — é sentar com um contador que atenda outras revendas. Três definições saem daí: tipo de empresa, CNAE correto (ele condiciona alvará, inscrição estadual e a habilitação no Renave) e regime tributário. Esse último não é burocracia a despachar: a revenda de usados tem particularidades — em determinados formatos a tributação incide sobre a diferença entre compra e venda, não sobre o valor cheio do carro, o que muda completamente a conta.

Sobre o ponto, a pergunta certa não é "qual é o melhor?", e sim "quantos carros por mês eu preciso vender para pagar esse ponto?". Hoje a maioria dos compradores chega pelo anúncio, não pela calçada — um ponto mais barato com presença digital caprichada costuma vencer o pátio caro mal anunciado.

O capital se divide em três caixas: estoque (a maior fatia), capital de giro (preparação, documentação, anúncios, aluguel e contas enquanto as vendas não engrenam) e estrutura (reforma leve, placas, câmeras, sistema, site e material de fotografia). Referência prática: reserve de 20% a 40% do total para giro e estrutura. Melhor abrir com dois carros a menos do que abrir sem fôlego de caixa.

As quatro fontes dos primeiros carros: leilão, particular, troca e consignação — essa última enche a vitrine sem imobilizar capital, ideal para o começo.

E não esqueça das licenças: alvará, vistoria do corpo de bombeiros, inscrição estadual e habilitação no Renave.

O objetivo dos primeiros 90 dias não é lucro máximo — é rodar o ciclo completo várias vezes e anotar tudo: custo real por carro, dias em estoque, origem de cada lead.

Post completo, com os 8 passos, no blog. Link na bio.

#estoqueautos #abrirloja #lojadecarros #revendadeveiculos #empreendedorismo #carrosusados #seminovos #cnpj #renave #planejamento #vendadecarros #lojadeveiculos`,
  },

  {
    dir: 'transferencia-e-documentacao-de-veiculos-lojista',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 76, title: 'ATPV-e, Renave<br>e comunicação<br>de <em>venda</em>', sub: 'O fluxo de documentação que protege a loja, da compra à entrega.' },
      { kind: 'list', eyebrow: 'antes de pagar', size: 60, title: 'Nunca pague<br>antes de consultar', items: [
        '<strong>Débitos:</strong> IPVA, licenciamento e multas — dívida acompanha o veículo',
        '<strong>Restrições:</strong> alienação, bloqueio judicial, restrição administrativa',
        '<strong>Histórico:</strong> leilão, sinistro, roubo/furto e recall pendente',
        '<strong>Identificação:</strong> chassi e motor batendo com o documento',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'renave', size: 58, title: 'Entrada e saída<br>sem passar pelo<br>nome da loja', items: [
        '•Na compra: nota de entrada + registro no Renave',
        '•Na venda: nota de saída e transferência direto ao comprador',
        '•Fim do carro "no nome de terceiro" rodando com procuração',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'não confunda', size: 58, title: 'Transferir ≠<br>comunicar a venda', items: [
        '<strong>ATPV-e:</strong> o comprador efetiva a transferência no Detran dele',
        '<strong>Comunicação de venda:</strong> corta sua responsabilidade por multas novas',
        'A loja faz os dois lados — e confere se o antigo dono comunicou',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'por onde começar', size: 62, title: 'Dois checklists:<br>entrada e saída', sub: 'Documentação boa não vende carro — mas documentação ruim desfaz venda, queima indicação e come o tempo que devia estar no pátio.', foot: FOOT },
    ],
    legenda: `Todo carro que entra no pátio traz junto um histórico: dono anterior, débitos, multas, restrições e prazos correndo.

Antes de comprar, a regra de ouro é nunca pagar antes de consultar. O mínimo: débitos (IPVA, licenciamento, multas — dívida do veículo acompanha o veículo), restrições (alienação fiduciária, bloqueio judicial, restrição administrativa), histórico (leilão, sinistro, roubo/furto, recall) e identificação (chassi e motor batendo com o documento — divergência aqui é motivo para desistir).

O Renave mudou a vida do lojista: ele permite lançar digitalmente a entrada e a saída de veículos do estoque, sem transferir cada carro para o nome da empresa. Na compra, nota de entrada e registro; na venda, nota de saída e transferência direto para o comprador final. O ganho é triplo: elimina a transferência intermediária, dá rastreabilidade fiscal e acaba com a figura arriscada do carro "no nome de terceiro" rodando com procuração.

E não confunda duas coisas: o ATPV-e é a autorização eletrônica que o comprador usa para efetivar a transferência no Detran dele. A comunicação de venda é outro registro — é ela que corta, a partir da data informada, a sua responsabilidade por multas e débitos novos. Transferir é obrigação do comprador; comunicar a venda é proteção de quem vendeu. A loja faz os dois lados.

Detalhe que muita loja esquece: multa tomada em test drive é problema da loja enquanto o condutor não for identificado. Mantenha um registro simples de quem dirigiu, quando e com qual carro.

Padronize com dois checklists — um de entrada (consultas, laudo, nota, Renave) e um de saída (débitos zerados, gravame baixado, nota, ATPV-e ou saída Renave, comunicação de venda, arquivo do dossiê).

Post completo, com os 6 passos da entrega e os erros mais comuns, no blog. Link na bio.

#estoqueautos #documentacao #atpve #renave #detran #transferencia #lojadecarros #revendadeveiculos #carrosusados #seminovos #despachante #lojadeveiculos`,
  },

  {
    dir: 'carro-de-leilao-para-revenda-vale-a-pena',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 80, title: 'Carro de leilão<br>vale a pena<br>para a <em>loja</em>?', sub: 'O deságio é real — e menor do que parece. A conta completa.' },
      { kind: 'list', eyebrow: 'os três tipos', size: 58, title: 'Cada leilão tem<br>um risco', items: [
        '<strong>Financeira:</strong> retomados por inadimplência — risco menor, porta de entrada',
        '<strong>Seguradora:</strong> sinistrados — só com oficina e funilaria próprias',
        '<strong>Judicial:</strong> penhoras e apreensões — pendências jurídicas e posse',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'o pedágio', size: 58, title: 'Entre o martelo<br>e o seu pátio', items: [
        '•Taxa do leiloeiro, prevista no edital e paga na hora',
        '•Taxas administrativas, pátio e remoção',
        '•Transporte — o carro raramente sai rodando',
        '•Reparos, preparação e documentação do lote',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'a marca que fica', size: 58, title: 'A restrição no<br>histórico não sai', items: [
        '<strong>Na revenda:</strong> vale menos e parte dos compradores descarta de saída',
        '<strong>No seguro:</strong> vistoria prévia, recusa ou cobertura limitada',
        '<strong>No anúncio:</strong> informar a origem é obrigação pelo CDC, não gentileza',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'o teste', size: 62, title: 'Faça a conta<br>no papel antes<br>do primeiro lance', sub: 'Lance máximo + taxas + transporte + preparação + documentação, contra o preço de revenda declarando a origem. Se não fecha no papel, não fecha no pátio.', foot: FOOT },
    ],
    legenda: `O anúncio é tentador: carro com desconto relevante, pátio inteiro para escolher, arremate online. Mas o leilão cobra pedágio em três lugares que não aparecem no lance.

Primeiro, o tipo de leilão define o risco:
→ Financeira — carros retomados por inadimplência. Risco menor, porta de entrada natural.
→ Seguradora — sinistrados e recuperados. Descontos maiores, mas exige capacidade real de avaliar dano estrutural.
→ Judicial — penhoras e apreensões. Edital complexo, débitos e discussões de posse.

Segundo, o deságio é menor do que parece. Entre o martelo e o seu pátio a conta engorda: taxa do leiloeiro, taxas administrativas e de pátio, transporte (o carro raramente sai rodando), reparos e preparação, documentação e eventuais débitos do lote. Some tudo antes de comemorar — e lembre que parte do desconto que sobrar é do comprador final, que vai exigir abatimento pela origem.

Terceiro, a restrição no histórico não sai. Na revenda, o carro vale menos e parte dos compradores simplesmente descarta veículos de leilão. No seguro do comprador, seguradoras costumam exigir vistoria prévia e podem recusar a apólice.

E informar é obrigação, não gentileza: pelo CDC, a origem de leilão é informação essencial — omiti-la pode levar ao desfazimento da venda, com devolução e indenização. Anúncio e contrato devem declarar a procedência.

Faz sentido quando a loja tem oficina ou funilaria própria, alguém capaz de avaliar dano estrutural, capital para o ciclo mais longo e público que prioriza preço. Não faz sentido quando a loja depende de terceiros para todo reparo, o posicionamento é de seminovos premium ou o caixa está justo.

Antes de se cadastrar em qualquer leilão, faça o teste no papel com um lote real. Se a margem não for melhor que a das suas compras atuais, não arremate.

Post completo, com os 6 passos para comprar com segurança, no blog. Link na bio.

#estoqueautos #leilaodeveiculos #compradeestoque #lojadecarros #revendadeveiculos #carrosusados #seminovos #sinistro #cautelar #margem #vendadecarros #lojadeveiculos`,
  },

  {
    dir: 'carro-eletrico-e-hibrido-usado-para-revenda',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 78, title: 'Elétrico usado<br>no seu pátio:<br>entra ou <em>não</em>?', sub: 'Os números de 2026 mostram dois mercados dentro do mesmo grupo.' },
      { kind: 'cards', eyebrow: 'dados de 2026', size: 60, title: 'Um mercado<br>partido ao meio', cards: [
        { lbl: 'elétricos usados abaixo de R$ 170 mil', big: '−7,9%', note: 'depreciação média — segura valor' },
        { lbl: 'BYD Song Plus 2023 (híbrido)', big: '−34%', note: 'na FIPE de junho de 2026; JAC E-JS4, −37,5%' },
        { lbl: 'elétrico usado, tempo até vender', big: '47 dias', on: true, note: '<strong>mais rápido que o flex (53)</strong> e que o híbrido pleno (54)' },
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'a regra prática', size: 58, title: 'O problema não é<br>o motor. É o tíquete', items: [
        '<strong>Elétrico de entrada:</strong> pode entrar — é carro de giro, não curiosidade',
        '<strong>Híbrido ou elétrico caro:</strong> só com desconto forte na compra',
        '<strong>Modelo com histórico ruim de revenda:</strong> evite ou pague muito barato',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'na avaliação', size: 58, title: 'O que pedir antes<br>de aceitar na troca', items: [
        '•<strong>Relatório de saúde da bateria (SoH)</strong> — é o motor desse carro',
        '•<strong>Garantia de fábrica da bateria</strong> — e se é transferível ao próximo dono',
        '•<strong>Histórico de uso e recarga</strong> — app, carga rápida e sinistro pesam mais',
        '•<strong>Margem de segurança maior</strong> que a de um flex equivalente',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'por onde começar', size: 62, title: 'Comece por um<br>elétrico de entrada', sub: 'Exija o relatório de bateria, confirme a garantia transferível, anuncie o custo por quilômetro e compare os dias até a venda com os seus flex.', foot: FOOT },
    ],
    legenda: `Cliente oferece um BYD na troca. Você aceita? Por quanto?

Em 2026 isso deixou de ser pergunta teórica. Os levantamentos do ano mostram um mercado partido ao meio:
→ Elétricos usados abaixo de R$ 170 mil: depreciação média de apenas 7,9%
→ BYD Dolphin Mini: segura valor (de −3,6% a −15%, conforme a janela)
→ BYD Seal 2024: −23%
→ BYD Song Plus 2023 (híbrido): −34% na FIPE de junho de 2026
→ JAC E-JS4: −37,5%; casos extremos passaram de −50%

O padrão é claro: o problema não é o motor elétrico, é o tíquete alto. E a liquidez confirma — pelo índice MDS de janeiro de 2026, o elétrico usado levava em média 47 dias para vender, mais rápido que o flex (53) e que o híbrido pleno (54).

A regra prática para o pátio:
1. Elétrico de entrada (abaixo de R$ 170 mil) pode entrar. Trate como carro de giro.
2. Híbrido ou elétrico caro, só com desconto forte na compra — a margem de segurança precisa ser bem maior que a de um flex.
3. Modelo com histórico ruim de revenda: evite ou pague muito barato.

Na avaliação, quatro exigências: relatório de saúde da bateria (SoH), garantia de fábrica com confirmação de que é transferível, histórico de uso e recarga, e ancoragem no preço de venda realista da sua região — não na FIPE cheia, que demora a refletir quedas bruscas.

E o momento de maior risco não é a venda: é a avaliação do carro do cliente. Aceitar a âncora dele para não perder a venda é comprar o prejuízo dele.

Post completo, com a precificação sem histórico FIPE longo, no blog. Link na bio.

#estoqueautos #carroeletrico #hibrido #byd #avaliacaodeveiculos #depreciacao #lojadecarros #revendadeveiculos #carrosusados #seminovos #mixdeestoque #eletrificados`,
  },
]
