/** Carrosséis dos posts da categoria Financeiro. */
const NAMES = ['01-capa', '02-resumo', '03-resumo', '04-resumo', '05-conclusao']
const FOOT = 'post completo no blog · link na bio'
const EYE = 'financeiro'

export const FINANCEIRO = [
  {
    dir: 'como-precificar-carros-usados',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 84, title: 'Precificar carro<br>usado sem<br><em>chutar</em>', sub: 'FIPE é referência. Quem define o preço é o mercado da sua região.' },
      { kind: 'list', eyebrow: 'a pesquisa', size: 58, title: 'Como achar o preço<br>de mercado local', items: [
        'Comparáveis de verdade: mesmo modelo, versão, ano, km e região',
        'Reúna de 5 a 8 anúncios e descarte os extremos',
        'Preço anunciado ≠ preço de venda — anúncio carrega gordura',
        'Anúncio parado há meses é evidência de preço errado',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'de fora para dentro', size: 58, title: 'Comece pelo preço<br>de venda, nunca<br>pelo custo', items: [
        '•Defina o <strong>preço-alvo</strong>: o valor que sai de verdade em 30 a 45 dias',
        '•Subtraia preparação, documentação e a <strong>margem-alvo</strong>',
        '•O resultado é o seu <strong>preço máximo de compra</strong>',
        '•Anuncie com gordura pequena, sem sair da faixa dos filtros de busca',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'preço tem validade', size: 58, title: 'Reprecificação<br>semanal por<br>idade de pátio', items: [
        '<strong>0–30 dias:</strong> sustente o preço',
        '<strong>31–60:</strong> refaça a pesquisa — o mercado pode ter andado',
        '<strong>61–90:</strong> corte de verdade, o bastante para mudar de faixa na busca',
        '<strong>90+:</strong> decisão de gestão: repasse, leilão ou troca por estoque que gira',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'por onde começar', size: 62, title: 'Meia hora,<br>toda semana,<br>pátio inteiro', sub: 'Pegue hoje os três carros há mais tempo parados e refaça a pesquisa do zero, como se fosse anunciá-los agora.', foot: FOOT },
    ],
    legenda: `Preço errado custa caro duas vezes: caro demais, o carro não aparece nas buscas e envelhece no pátio; barato demais, vende rápido e deixa uma margem doada que ninguém devolve.

A FIPE é média nacional. Ela não sabe o estado do seu carro, a quilometragem, os opcionais — nem em que cidade ele está. Serve como régua de negociação, base de crédito dos bancos e termômetro de tendência. Não serve como preço de compra nem de venda.

Como pesquisar o mercado local:
→ Busque comparáveis de verdade: mesmo modelo, versão, ano, faixa de km e região
→ Reúna de 5 a 8 anúncios e descarte os extremos — o muito barato costuma ter problema; o muito caro, teimosia
→ Diferencie preço anunciado de preço de venda
→ Observe o tempo de anúncio: carro parado há meses pelo mesmo valor é preço errado
→ Refaça a pesquisa na hora de comprar

A ordem certa é de fora para dentro. Defina o preço-alvo de venda (o valor pelo qual o carro realmente sai em 30 a 45 dias), liste os custos do carro específico, reserve a margem-alvo e subtraia tudo. O resultado é o preço máximo de compra — o número que protege sua margem na negociação e na avaliação da troca. Depois anuncie com gordura pequena, sem sair da faixa competitiva dos filtros.

E preço tem validade. Uma revisão por semana, olhando a idade de cada carro: 0–30 dias sustente; 31–60 refaça a pesquisa e corrija; 61–90 corte de verdade, o suficiente para mudar de faixa nos filtros (redução simbólica não gera clique novo); acima de 90 a decisão é de gestão, não de preço.

Detalhe que rende: finais 900 e 990 funcionam. R$ 49.990 aparece na busca "até R$ 50 mil" e é lido como "quarenta e nove".

Post completo, com a margem por faixa de valor e as âncoras de preço, no blog. Link na bio.

#estoqueautos #precificacao #tabelafipe #margem #lojadecarros #revendadeveiculos #carrosusados #seminovos #precodevenda #girodeestoque #vendadecarros #lojadeveiculos`,
  },

  {
    dir: 'margem-de-lucro-venda-de-carros-usados',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 82, title: 'Quanto uma loja<br>ganha por<br><em>carro</em>?', sub: 'A diferença entre a margem da negociação e a que chega na conta.' },
      { kind: 'list', eyebrow: 'duas contas', size: 60, title: 'Bruta é a da mesa.<br>Líquida é a do banco', items: [
        '<strong>Margem bruta:</strong> venda − compra, preparação e documentação',
        '<strong>Margem líquida:</strong> ainda desconta comissão, impostos, rateio de fixas e custo do capital parado',
        'Faixa comum de bruta no mercado: <strong>8% a 15%</strong> sobre a venda',
      ], foot: FOOT },
      { kind: 'cards', eyebrow: 'dre de uma venda', size: 60, title: 'Onde some metade<br>da margem', cards: [
        { lbl: 'preço de venda', big: 'R$ 50.000', note: '(−) aquisição R$ 42.000 · preparação e documentação R$ 2.000' },
        { lbl: 'margem bruta', big: 'R$ 6.000', note: '12% — (−) comissão, impostos, rateio de fixas e custo financeiro' },
        { lbl: 'margem líquida', big: 'R$ 3.000', on: true, note: '<strong>6%.</strong> Exemplo ilustrativo — o que importa é a estrutura da conta' },
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'sem subir o preço', size: 58, title: 'Cinco alavancas<br>de margem', items: [
        '•<strong>Compre melhor</strong> — ganhar um ponto na compra é mais fácil que na venda',
        '•<strong>Padronize a preparação</strong> e elimine retrabalho de oficina',
        '•<strong>Some F&I:</strong> retorno de financiamento, seguros e acessórios',
        '•<strong>Reduza o tempo de pátio</strong> e alinhe a comissão à margem, não ao preço',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'por onde começar', size: 62, title: 'Monte o DRE<br>das últimas<br>dez vendas', sub: 'A média que aparecer é a sua margem — não a que você imagina. Depois escolha uma alavanca por trimestre.', foot: FOOT },
    ],
    legenda: `"Quanto uma loja ganha por carro?" é a pergunta que todo lojista ouve e que quase ninguém responde direito.

Primeiro, separe duas contas. Margem bruta é o preço de venda menos o custo direto: aquisição, preparação e documentação — é a conta que se faz ao fechar o negócio. Margem líquida é o que sobra depois de comissão do vendedor, impostos, rateio das despesas fixas e custo financeiro do capital parado no pátio.

Não existe estatística oficial, mas as faixas que circulam no mercado são consistentes: margem bruta frequentemente entre um dígito alto e baixos dois dígitos — pense em 8% a 15% sobre o preço de venda como referência, não como regra. A líquida fica sensivelmente abaixo.

Um DRE ilustrativo de uma venda:
Preço de venda R$ 50.000
(−) aquisição R$ 42.000
(−) preparação e documentação R$ 2.000
= margem bruta R$ 6.000 (12%)
(−) comissão R$ 600 · impostos R$ 500 · rateio de fixas R$ 1.500 · custo financeiro R$ 400
= margem líquida R$ 3.000 (6%)

Metade da margem bruta evaporou em custos que não aparecem na negociação.

E o resultado do ano não é a margem de uma venda — é a margem multiplicada pelas vendas que cada vaga do pátio produz. Uma vaga que gira a cada 45 dias entrega o dobro da mesma vaga girando a cada 90. Segurar preço por meses para "defender a margem" costuma destruir exatamente a margem que se queria defender.

Cinco alavancas sem mexer no preço: compre melhor, padronize a preparação, some receitas de F&I, reduza o tempo de pátio e alinhe a comissão à margem.

Post completo, com os 5 passos para calcular a sua margem real, no blog. Link na bio.

#estoqueautos #margemdelucro #dre #financas #lojadecarros #revendadeveiculos #carrosusados #seminovos #precificacao #girodeestoque #gestaofinanceira #lojadeveiculos`,
  },

  {
    dir: 'fluxo-de-caixa-loja-de-veiculos',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 80, title: 'Loja lucrativa<br>no relatório,<br><em>quebrada</em> na conta', sub: 'Por que revenda vende bem e não tem dinheiro — e como organizar o caixa.' },
      { kind: 'list', eyebrow: 'o ciclo perigoso', size: 58, title: 'O lucro está<br>preso no pátio', items: [
        'A loja vende, vê o "lucro" e compra mais carros',
        'O estoque cresce, o resultado no papel parece ótimo',
        'O caixa seca — e a despesa fora da curva chega',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'primeiro de tudo', size: 58, title: 'Separe a pessoa<br>física da jurídica', items: [
        '•<strong>Conta bancária separada</strong> — toda entrada e saída passa por ela',
        '•<strong>Pró-labore fixo:</strong> valor definido, todo mês, na mesma data',
        '•<strong>Cartão e Pix da empresa</strong> só para despesa da empresa',
        '•<strong>Socorro entre PF e PJ documentado</strong>, com plano de devolução',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'projeção de 90 dias', size: 58, title: 'Um filme de 12<br>semanas, não<br>uma foto', items: [
        'Comece pelo saldo real de hoje, sem contar o que há a receber',
        'Lance as saídas certas, semana a semana',
        'Estime entradas pela média das últimas 12 semanas, não pelo melhor mês',
        'Aja sobre a pior semana antes que ela chegue',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'o ritual', size: 62, title: 'Toda segunda,<br>trinta minutos', sub: 'Extrato da semana aberto, cada movimentação em uma das sete categorias, saldo fechado. Um mês disso e você vê o problema chegando de longe.', foot: FOOT },
    ],
    legenda: `Vender bem o mês inteiro e ainda faltar dinheiro para pagar o boleto é das experiências mais comuns de quem tem revenda.

Isso raramente significa que o negócio é ruim. O carro que você comprou por R$ 45 mil para vender por R$ 52 mil não é lucro — é dinheiro parado no pátio. Loja de veículos tem uma característica que quase nenhum outro varejo tem: praticamente todo o capital fica imobilizado em poucas unidades de valor alto.

O ciclo perigoso: a loja vende, vê o "lucro" e usa o dinheiro para comprar mais carros. O estoque cresce, o resultado no papel parece ótimo — e o caixa seca. É por isso que existe loja lucrativa no relatório e quebrada na conta corrente.

Antes de qualquer planilha, separe PF de PJ: conta bancária só da loja, pró-labore fixo na mesma data todo mês, cartão e Pix da empresa apenas para despesa da empresa, e socorro entre as duas pontas documentado.

O ritual que funciona: toda segunda-feira, 30 a 40 minutos. Extrato da semana anterior aberto, cada movimentação lançada numa categoria, saldo fechado. Sete categorias bastam: compra de veículos, preparação, documentação, despesas fixas, despesas de venda, impostos e taxas, retiradas.

E a projeção de 90 dias, em 5 passos: comece pelo saldo real (sem incluir valores a receber); lance as saídas certas semana a semana; estime as entradas com conservadorismo, pela média das últimas 12 semanas; calcule o saldo projetado de cada semana; e aja sobre a pior semana antes que ela chegue. Saldo negativo previsto com seis semanas de antecedência se resolve com calma. Com três dias, resolve-se com juros.

Sinais de alerta: pagar despesa antiga com venda nova, contar com retorno de financiamento para fechar o mês, não saber o saldo de cabeça, estoque crescendo com saldo caindo.

Post completo, com a reserva de oportunidade, no blog. Link na bio.

#estoqueautos #fluxodecaixa #gestaofinanceira #financas #lojadecarros #revendadeveiculos #carrosusados #seminovos #capitaldegiro #planejamentofinanceiro #vendadecarros #lojadeveiculos`,
  },

  {
    dir: 'capital-de-giro-revenda-de-carros',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 76, title: 'Quanto dinheiro<br>precisa para<br>tocar uma <em>revenda</em>?', sub: 'A conta de partida — e por que o giro multiplica o capital.' },
      { kind: 'cards', eyebrow: 'a conta', size: 60, title: 'Estoque mais<br>reserva de fixas', cards: [
        { lbl: 'nº de carros × custo médio por carro', big: 'estoque', note: 'compra + preparação + documentação + transporte' },
        { lbl: 'despesas fixas mensais × 3 a 6 meses', big: 'reserva', note: 'revenda descapitalizada não quebra na compra — quebra 3 meses depois' },
        { lbl: 'a soma dos dois', big: 'capital de giro', on: true, note: '<strong>Ajuste às suas variáveis:</strong> populares no interior e premium na capital dão números muito diferentes' },
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'o multiplicador', size: 58, title: 'Giro importa mais<br>que tamanho<br>de pátio', items: [
        '<strong>90 dias</strong> por vaga → ~4 giros/ano → ~32 vendas com 8 carros',
        '<strong>60 dias</strong> → ~6 giros/ano → ~48 vendas',
        '<strong>45 dias</strong> → ~8 giros/ano → ~64 vendas',
        'Mesmo capital. Nenhum real a mais investido',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'as fontes', size: 58, title: 'De onde vem<br>o dinheiro', items: [
        '•<strong>Capital próprio:</strong> mais barato e mais seguro — e mais lento',
        '•<strong>Floor plan:</strong> financia o estoque, mas os juros correm por dia',
        '•<strong>Consignação:</strong> pátio cheio sem imobilizar capital',
        '•<strong>O que não usar:</strong> crédito pessoal e cheque especial',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'a prioridade', size: 62, title: 'Se a loja já existe,<br>meça o giro antes<br>de captar capital', sub: 'Dinheiro novo em cima de giro lento só compra mais encalhe.', foot: FOOT },
    ],
    legenda: `"Quanto dinheiro precisa para tocar uma revenda de carros?" é a pergunta mais feita por quem quer entrar no ramo — e uma das menos respondidas com conta de verdade.

A conta de partida:
Capital de giro = (nº de carros no pátio × custo médio por carro) + (despesas fixas mensais × 3 a 6 meses)

E o custo médio por carro não é só o valor de compra: inclua preparação, documentação e transporte. Um exemplo com números redondos, só para ilustrar: 8 carros no pátio, custo médio de R$ 40 mil e despesas fixas de R$ 20 mil/mês pedem R$ 320 mil em estoque mais R$ 60 mil a R$ 120 mil de reserva — algo entre R$ 380 mil e R$ 440 mil. Ajuste às suas variáveis.

A armadilha é achar que capital de giro é só o dinheiro dos carros. Revenda descapitalizada raramente quebra na compra do estoque: quebra três meses depois, quando as fixas vencem e o estoque ainda não girou.

E o giro multiplica o capital. Cada vaga do pátio é um slot: se o carro que a ocupa vende em 45 dias em vez de 90, aquela vaga gera o dobro de vendas no ano, sem um real a mais investido.
90 dias por vaga → ~4 giros/ano → ~32 vendas com 8 carros
60 dias → ~6 giros → ~48 vendas
45 dias → ~8 giros → ~64 vendas
30 dias → ~12 giros → ~96 vendas

As fontes: capital próprio (mais barato e seguro, porém lento), floor plan (financia o estoque, mas os juros correm por dia — vira armadilha para quem encalha) e consignação (pátio cheio sem imobilizar capital). O que não usar: crédito pessoal e cheque especial.

Se a loja já existe, a prioridade não é captar mais capital — é medir o giro e destravar o que está parado. Dinheiro novo em cima de giro lento só compra mais encalhe.

Post completo, com os 5 passos para calcular o seu número, no blog. Link na bio.

#estoqueautos #capitaldegiro #financas #floorplan #consignacao #lojadecarros #revendadeveiculos #carrosusados #seminovos #girodeestoque #gestaofinanceira #lojadeveiculos`,
  },

  {
    dir: 'tabela-fipe-precificacao-estoque',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 84, title: 'A FIPE é âncora,<br><em>não</em> preço<br>de venda', sub: 'Como usar a tabela a seu favor na precificação do estoque.' },
      { kind: 'list', eyebrow: 'o que ela é', size: 60, title: 'Preço médio<br>nacional, atualizado<br>todo mês', items: [
        'Organizada por marca, modelo, versão e ano',
        'Calculada a partir de anúncios e negociações reais',
        'Serve como referência — nunca como preço fixo de compra ou venda',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'o que ajustar', size: 58, title: 'O que entra na<br>conta além dela', items: [
        '•<strong>Estado</strong> — lataria, pintura, interior, pneus',
        '•<strong>Quilometragem</strong> — abaixo da média valoriza; muito acima desvaloriza',
        '•<strong>Procedência</strong> — único dono, revisões em dia, sem sinistro',
        '•<strong>Opcionais e demanda regional</strong> — 4x4 no interior, compacto na capital',
      ], foot: FOOT },
      { kind: 'cards', eyebrow: 'exemplo', size: 60, title: 'SUV com FIPE<br>de R$ 120 mil', cards: [
        { lbl: 'único dono, baixa km, revisões em dia', big: 'R$ 124.900', note: 'acima da FIPE — e com o porquê explicado no anúncio' },
        { lbl: 'estado médio, km na média', big: 'R$ 119.900', note: 'próximo da FIPE' },
        { lbl: 'precisa girar rápido', big: 'R$ 114.900', on: true, note: '<strong>abaixo da FIPE</strong> — decisão de giro, não de desespero' },
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'por onde começar', size: 62, title: 'Todo início de mês,<br>quando a tabela<br>vira', sub: 'Pegue os cinco carros mais antigos do pátio, consulte a FIPE atualizada e compare com o preço anunciado.', foot: FOOT },
    ],
    legenda: `Seu cliente vai consultar a FIPE antes de fechar negócio. Saber usá-la a seu favor ajuda a precificar com segurança e a justificar o valor.

A tabela FIPE traz o preço médio de veículos no mercado nacional, por marca, modelo, versão e ano, calculado a partir de anúncios e negociações reais. Ela é atualizada mensalmente — trabalhar com a versão mais recente evita anunciar acima ou abaixo do mercado sem perceber.

E ela é ponto de partida, não palavra final. Em cima do valor FIPE, ajuste por:
→ Estado de conservação — lataria, pintura, interior, pneus
→ Quilometragem — abaixo da média valoriza; muito acima desvaloriza
→ Procedência e histórico — único dono, revisões em dia, sem sinistro
→ Opcionais — teto solar, multimídia, bancos de couro, blindagem
→ Demanda regional — um 4x4 vale mais no interior; um compacto, na capital
→ Sua margem — aquisição, preparação, garantia e lucro

Um exemplo com um SUV de FIPE R$ 120.000:
Único dono, baixa km, revisões em dia → R$ 124.900 (acima da tabela)
Estado médio, km na média → R$ 119.900 (próximo da tabela)
Precisa girar rápido → R$ 114.900 (abaixo da tabela)

Use a FIPE como âncora e deixe claro na negociação por que o seu preço está onde está. Isso transmite transparência e reduz a queda de braço no fechamento.

Boas práticas: revise os preços todo mês, quando a tabela vira; marque como vendido ou arquive o que já saiu; destaque no anúncio o que justifica o preço; e evite "consulte o valor" — preço visível gera mais contato.

Post completo, com o fluxo de cadastro pela base FIPE, no blog. Link na bio.

#estoqueautos #tabelafipe #precificacao #fipe #lojadecarros #revendadeveiculos #carrosusados #seminovos #precodevenda #estoque #vendadecarros #lojadeveiculos`,
  },

  {
    dir: 'queda-preco-carro-zero-impacto-usados',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 78, title: 'O 0km caiu.<br>Seu teto de<br>preço <em>também</em>', sub: 'Primeira queda em seis anos — e o que muda no seu pátio.' },
      { kind: 'list', eyebrow: 'o efeito cascata', size: 58, title: 'Quanto mais novo<br>e mais caro, mais<br>exposto', items: [
        '<strong>Seminovo de 1 a 3 anos:</strong> exposição alta — reprecifique toda semana',
        '<strong>Usado de 4 a 8 anos:</strong> exposição média — ajuste a cada 1 ou 2 semanas',
        '<strong>8 anos ou mais, tíquete baixo:</strong> exposição baixa — rotina normal',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'o risco real', size: 58, title: 'Estoque comprado<br>com preço de ontem', items: [
        '•A tentação é defender a margem e esperar o comprador aparecer',
        '•Só que cada semana parada tende a piorar o preço final',
        '•Vender com margem menor e recolocar o dinheiro na referência nova costuma ser melhor negócio',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'na compra, agora', size: 58, title: 'Três ajustes<br>imediatos', items: [
        'Avalie pelo preço de venda de amanhã, não de ontem',
        'Aumente a margem de segurança entre compra e venda',
        'Priorize giro comprovado, não margem teórica alta',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'a oportunidade', size: 60, title: 'O cliente que<br>desistiu do zero<br>procura você', sub: 'A parcela do 0km segue pesada. O seminovo com desconto recente é exatamente o que essa pessoa quer.', foot: FOOT },
    ],
    legenda: `Em julho de 2026, o preço médio do carro zero no Brasil teve a primeira queda em seis anos. Para as concessionárias, é manchete. Para quem vive de usados, é um recado: o teto de preço do seu estoque acabou de descer.

O seminovo só vale o que vale porque existe uma distância confortável até o zero equivalente. Quando o 0km recua, essa distância encolhe — e o comprador faz a conta: "por um pouco mais, levo o zero com garantia de fábrica". O efeito desce em cascata: aperta o seminovo de 1 a 3 anos, que pressiona o de 4 a 6, que pressiona o intermediário.

Exposição por perfil de carro:
→ Seminovo de 1 a 3 anos, versão parecida com a das concessionárias: alta — reprecificar toda semana e priorizar o giro
→ Usado de 4 a 8 anos, modelos de alta procura: média — acompanhar anúncios da região e ajustar a cada uma ou duas semanas
→ Usado de 8 anos ou mais, tíquete baixo: baixa — rotina normal

O risco real não é o carro que você vai comprar amanhã: é o que já está no pátio, avaliado e pago com a tabela antiga. A tentação é defender a margem e esperar. Só que carro parado é capital imobilizado, desvalorização correndo e despesa de pátio — em mercado que se move para baixo, cada semana de espera tende a piorar o preço final.

Na compra, três ajustes: avalie pelo preço de venda de amanhã, aumente a margem de segurança e priorize giro comprovado em vez de margem teórica alta.

E a oportunidade: mesmo com o 0km mais barato, o financiamento segue pesado (chegou a 27,7% ao ano em janeiro de 2026 para carro zero). Muita gente desiste na simulação — e o seminovo com desconto recente é exatamente o que ela procura.

Post completo, com a reprecificação semanal em 5 passos, no blog. Link na bio.

#estoqueautos #precificacao #carrozero #mercadodeusados #lojadecarros #revendadeveiculos #carrosusados #seminovos #margem #girodeestoque #compradeestoque #lojadeveiculos`,
  },

  {
    dir: 'retorno-de-financiamento-loja-de-carros',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 76, title: 'O financiamento<br>pode valer mais<br>que o <em>carro</em>', sub: 'Como funciona o retorno — e como vender com transparência.' },
      { kind: 'list', eyebrow: 'a mecânica', size: 58, title: 'A loja origina,<br>o banco paga', items: [
        'A loja monta a proposta e envia aos bancos parceiros',
        'Um banco aprova e o cliente assina',
        'O banco deposita o valor do carro — a venda vira dinheiro à vista',
        'A comissão de originação é creditada à loja',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'o que move o %', size: 58, title: 'Não existe<br>tabela universal', items: [
        '•<strong>Instituição</strong> e campanhas do período',
        '•<strong>Prazo</strong> — contratos mais longos tendem a pagar mais',
        '•<strong>Taxa negociada</strong> — e é aqui que mora o conflito de interesse',
        '•<strong>Entrada, perfil do cliente e volume</strong> da loja',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'a linha', size: 58, title: 'Oferecer sim.<br>Empurrar não', items: [
        '<strong>CET sempre na mesa</strong> — taxa, custo total e comparação',
        '<strong>Não alongue prazo</strong> só para elevar o retorno',
        '<strong>Apresente 2 ou 3 cenários</strong> e deixe o cliente escolher',
        '<strong>Venda casada é proibida</strong> — seguro e acessórios são opcionais',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'por onde começar', size: 60, title: 'Credencie um<br>segundo banco<br>ainda este mês', sub: 'Perfis diferentes aprovam públicos diferentes. Registre aprovação e retorno por instituição e, em um trimestre, você sabe quanto o financiamento rende por venda.', foot: FOOT },
    ],
    legenda: `Em muita revenda, o financiamento deixou de ser "a forma como o cliente paga" e virou peça central do resultado.

Como funciona: quando o cliente financia pela loja, ela atua como intermediária da originação. Monta a proposta, envia aos bancos, reúne documentos e formaliza o contrato aprovado. O banco paga o valor do carro à vista para a loja — e paga também uma comissão pelo serviço de originação: o retorno.

Repare no detalhe do caixa: além da comissão, financiar bem significa receber à vista uma venda que o cliente vai pagar em anos.

O que move o percentual? Instituição (cada banco tem política própria e campanhas), prazo do contrato (mais longo tende a pagar mais), taxa negociada, entrada, perfil do cliente e volume da loja. Não existe tabela universal — desconfie de quem cravar uma.

E em carros de margem apertada a conta surpreende: um retorno de poucos pontos sobre um valor financiado alto pode se aproximar — ou superar — o que a loja ganha no veículo. Some seguros e acessórios e a venda financiada completa frequentemente deixa mais resultado que a mesma venda à vista.

Mas existe uma linha clara entre oferecer e empurrar:
→ O cliente tem direito de saber o CET, a taxa e o valor total, e de comparar com o banco dele
→ Não alongue prazo só para elevar o retorno — aumenta inadimplência e mata a recompra
→ Apresente 2 ou 3 cenários e deixe o cliente escolher
→ Venda casada é proibida: seguro, garantia estendida e acessórios são opcionais com preço claro

Como escolher parceiros: credencie 2 a 3 instituições de perfis diferentes, compare além do percentual (taxa final, velocidade, índice de aprovação, prazo de pagamento), teste com propostas reais por 60 a 90 dias, meça todo mês e renegocie com volume.

Post completo, com F&I e os 5 passos, no blog. Link na bio.

#estoqueautos #retornodefinanciamento #financiamento #fi #bancos #lojadecarros #revendadeveiculos #carrosusados #seminovos #cet #receita #lojadeveiculos`,
  },

  {
    dir: 'consorcio-de-veiculos-na-loja-de-carros',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 76, title: 'O cliente que<br>desiste dos juros<br>não desiste do <em>carro</em>', sub: 'Como a loja vende com consórcio — de dois jeitos.' },
      { kind: 'list', eyebrow: 'jeito 1', size: 58, title: 'Aceitar carta<br>contemplada', items: [
        'Funciona como dinheiro à vista — sem aprovação de crédito',
        'A administradora paga direto a você, vendedor',
        'Mas o dinheiro não cai na hora: sai após a documentação aprovada',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'o rito', size: 58, title: 'Cinco cuidados<br>antes de entregar<br>o carro', items: [
        '•<strong>Confirme a contemplação na administradora</strong>, não no papel do cliente',
        '•Pergunte o rito e o <strong>prazo de pagamento</strong>, por escrito',
        '•Documentação do veículo sem pendências — débito trava a liberação',
        '•<strong>Encaixe o prazo no seu caixa</strong> e só entregue com confirmação formal',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'jeito 2', size: 58, title: 'Loja parceira<br>de administradora', items: [
        'Comissão por cota vendida a partir das suas indicações',
        'Só administradora autorizada pelo Banco Central',
        'Venda com honestidade: contemplação não tem data garantida',
        'Registre as indicações — o contemplado de amanhã compra com você',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'quando sugerir', size: 60, title: 'Para quem pode<br>esperar. Nunca<br>para quem não pode', sub: 'Cliente que precisa do carro agora vai de financiamento, mesmo caro. Empurrar consórcio nessa hora gera frustração e reclamação.', foot: FOOT },
    ],
    legenda: `Com o financiamento de veículos rodando em torno de 25,8% ao ano em 2026, parte dos seus clientes faz a simulação e desiste. Boa parte deles não desiste do carro — desiste dos juros.

A loja vende com consórcio de dois jeitos.

O primeiro é aceitando carta de crédito contemplada. Na negociação ela funciona como dinheiro à vista: o cliente não depende de aprovação de financiamento, e a administradora paga direto a você. Com uma diferença importante: o dinheiro não cai na hora, e sim depois que a documentação exigida é entregue e aprovada.

Os cinco cuidados:
1. Confirme a contemplação direto na administradora, pelos canais oficiais — nunca só pelo documento que o cliente mostra
2. Pergunte o rito e o prazo de pagamento, e anote por escrito antes de fechar
3. Prepare a documentação do veículo sem pendências — débito ou restrição trava a liberação
4. Encaixe o prazo no seu fluxo de caixa: entre fechar e receber existem dias, às vezes semanas
5. Só entregue o carro com confirmação formal de documentação aprovada e pagamento agendado

O segundo jeito é ser indicadora ou representante de uma administradora, ganhando comissão por cota vendida. O encaixe é natural: todo dia entra na loja gente que quer carro e não fecha no financiamento. Hoje esse cliente vai embora de mãos vazias; com a parceria, sai com uma cota e volta contemplado para comprar com você.

Cuidados: só administradora autorizada pelo Banco Central, parceria formalizada por escrito, venda honesta (contemplação não tem data garantida) e indicações registradas no CRM.

Sugira consórcio para quem não tem urgência, foi reprovado no financiamento ou está planejando trocar em alguns anos. Não sugira para quem precisa do carro agora.

Post completo, com o comparativo consórcio × financiamento, no blog. Link na bio.

#estoqueautos #consorcio #cartadecredito #financiamento #lojadecarros #revendadeveiculos #carrosusados #seminovos #formasdepagamento #parcerias #vendadecarros #lojadeveiculos`,
  },

  {
    dir: 'ipva-e-debitos-na-compra-e-venda-de-carros',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 78, title: 'IPVA, multa e<br>licenciamento:<br>quem <em>paga</em> o quê', sub: 'A prática de mercado, a checagem e como precificar com débito.' },
      { kind: 'list', eyebrow: 'a prática', size: 58, title: 'Cada um responde<br>pelo seu período', items: [
        '<strong>IPVA de anos anteriores:</strong> vendedor quita ou desconta do preço',
        '<strong>IPVA do ano da venda:</strong> negociado, muitas vezes proporcional à data',
        '<strong>Multas até a venda:</strong> vendedor. Depois: comprador — se houve comunicação',
        '<strong>Licenciamento vencido:</strong> vendedor regulariza ou entra no desconto',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'atenção', size: 58, title: 'Costume não é lei —<br>e varia por estado', items: [
        '•Perante o estado, <strong>o débito acompanha o veículo</strong>',
        '•Comprar carro com débito sem saber é assumir a conta',
        '•O que foi combinado só vale <strong>por escrito</strong>, no contrato',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'com débito', size: 58, title: 'Como precificar<br>o carro pendente', items: [
        'O valor exato dos débitos, atualizado na data da negociação',
        'O custo de regularização: taxas, despachante, seu tempo de balcão',
        'Uma margem de risco para o que só aparece depois',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'a proteção', size: 60, title: 'Comunicação<br>de venda: a mais<br>barata que existe', sub: 'Sem ela, autuações e cobranças continuam apontando para o antigo dono — que pode ser você, no intervalo entre comprar e revender.', foot: FOOT },
    ],
    legenda: `Todo lojista experiente tem uma história de débito que apareceu na hora errada. Quase todas eram evitáveis.

A prática de mercado segue uma lógica simples: cada um responde pelo período em que o carro esteve com ele.
→ IPVA de anos anteriores: vendedor quita antes da transferência, ou o valor é descontado do preço
→ IPVA do ano da venda: negociado — divisão proporcional pela data é prática comum
→ Multas até a data da venda: vendedor. Após a venda: comprador, desde que a comunicação de venda esteja registrada
→ Licenciamento vencido: vendedor regulariza, ou o custo entra no desconto
→ Débitos de transferência: em geral comprador, mas é item de negociação

Dois cuidados. Primeiro: isso é costume de negociação, não regra fixa — perante o estado, os débitos acompanham o veículo, e comprar carro com débito sem saber é assumir a conta. Segundo: o combinado só vale por escrito, no contrato, com valores e responsabilidades nominadas. E as regras de IPVA e licenciamento variam por estado — confirme no Detran e na Sefaz locais.

Antes de comprar: consulte a situação nos canais oficiais (IPVA do ano e anteriores, licenciamento, multas), amplie a busca para órgãos municipais e rodoviários, cheque restrições, condicione a oferta à situação encontrada e guarde os comprovantes de consulta com data.

Débito conhecido não é motivo para descartar o negócio — é número na planilha. Some o valor atualizado dos débitos, o custo de regularização e uma margem de risco, e desconte da oferta.

E a proteção mais barata que existe é a comunicação de venda no Detran, tanto quando a loja compra quanto quando vende.

Post completo, com o que acontece se o débito aparece depois da venda, no blog. Link na bio.

#estoqueautos #ipva #debitos #documentacao #detran #lojadecarros #revendadeveiculos #carrosusados #seminovos #compradeestoque #negociacao #lojadeveiculos`,
  },
]
