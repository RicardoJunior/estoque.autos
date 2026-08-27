/** Carrosséis dos posts da categoria Vendas & Equipe. */
const NAMES = ['01-capa', '02-resumo', '03-resumo', '04-resumo', '05-conclusao']
const FOOT = 'post completo no blog · link na bio'
const EYE = 'vendas & equipe'

export const VENDAS = [
  {
    dir: 'comissao-e-bonificacao-vendedores-de-carros',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 76, title: 'Comissão sobre<br>o preço é uma<br><em>armadilha</em>', sub: 'Como estruturar remuneração que motiva sem sangrar a margem.' },
      { kind: 'list', eyebrow: 'o problema', size: 58, title: 'O incentivo aponta<br>para o lado errado', items: [
        'O vendedor ganha o mesmo no carro de lucro alto e no que saiu quase no custo',
        'O caminho mais curto para ele fechar vira <strong>pedir desconto para você</strong>',
        'Ele abre mão de pouco da comissão e derruba muito do seu lucro',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'os modelos', size: 58, title: 'Três formatos<br>usados em usados', items: [
        '•<strong>Valor fixo por carro:</strong> simples, mas ignora a margem',
        '•<strong>% sobre o lucro:</strong> alinha vendedor e loja — faixas de 5% a 15%',
        '•<strong>Híbrido:</strong> fixo menor por carro + % sobre o lucro',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'bonificação', size: 58, title: 'O que premiar<br>além da venda', items: [
        'Meta de volume — individual, do time, ou as duas',
        'Giro do estoque — bônus maior para carro parado há mais tempo',
        'Captação e cadastro — lead respondido rápido, CRM e anúncios em dia',
        'Avaliação do cliente no Google — reputação traz o próximo comprador',
      ], foot: 'simples, mensurável e paga rápido' },
      { kind: 'final', eyebrow: 'por onde começar', size: 62, title: 'Rode um mês<br>em paralelo', sub: 'Calcule quanto cada vendedor teria recebido no modelo por lucro, compare com o pago e ajuste o percentual até a conta fechar para os dois lados.', foot: FOOT },
    ],
    legenda: `Pagar bem o vendedor mantém gente boa na loja. Pagar do jeito errado destrói a margem sem você perceber.

Muita loja começa pagando um percentual sobre o preço do carro. Parece justo e é fácil de calcular. O problema: o vendedor ganha o mesmo num carro que deixou lucro alto e num que saiu quase no custo. Pior — nesse modelo, o caminho mais curto para ele fechar negócio é pedir desconto para você. Ele abre mão de uma fração pequena da comissão dele e derruba uma fatia grande do seu lucro.

Quando a comissão é calculada sobre o lucro da venda, o jogo vira: defender o preço passa a ser interesse do vendedor também.

Os três modelos mais usados em lojas de usados:
→ Valor fixo por carro — simples de entender, mas ignora a margem e prioriza volume
→ % sobre o lucro — alinha vendedor e loja e protege a margem; exige controle de custo por veículo. Faixas comuns: 5% a 15% do lucro
→ Híbrido — fixo menor por carro somado a um % sobre o lucro

Bonificação direciona o comportamento do time para o que a loja precisa no mês: meta de volume, giro do estoque (bônus maior para carro parado há mais tempo), captação e cadastro, e avaliações no Google. Regra de ouro: bonificação boa é simples, mensurável e paga rápido.

Erros que custam caro: pagar comissão antes de o dinheiro entrar; mudar a regra no meio do mês; esconder o cálculo; ignorar que a comissão é custo por carro na sua precificação.

Não precisa virar a mesa de uma vez. Rode um mês em paralelo: calcule quanto cada vendedor teria recebido no modelo por lucro, compare com o pago e ajuste até a conta fechar para os dois lados.

Post completo, com a política em 5 passos, no blog. Link na bio.

#estoqueautos #comissao #vendedores #equipedevendas #gestaodepessoas #lojadecarros #revendadeveiculos #carrosusados #seminovos #margem #remuneracao #lojadeveiculos`,
  },

  {
    dir: 'como-montar-equipe-de-vendas-loja-de-carros',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 76, title: 'Quando o dono<br>vira o gargalo<br>das <em>vendas</em>', sub: 'A hora de contratar, o perfil que funciona e o que precisa existir antes.' },
      { kind: 'list', eyebrow: 'os sintomas', size: 58, title: 'Não é o tamanho<br>do estoque', items: [
        '<strong>Leads esfriando sem resposta</strong> — quem responde primeiro leva a visita',
        '<strong>Follow-up inexistente</strong> — só vende para quem decide sozinho',
        '<strong>Dono preso no balcão</strong> — captação, preço e gestão paradas',
      ], foot: 'dois dos três? a contratação já está atrasada' },
      { kind: 'list', eyebrow: 'o perfil', size: 58, title: 'Menos lábia,<br>mais disciplina', items: [
        '•<strong>Resiliência</strong> — a maioria dos atendimentos não fecha',
        '•<strong>Organização</strong> — follow-up é disciplina, não talento',
        '•<strong>Escuta ativa</strong> — vende o carro certo, não o que quer empurrar',
        '•<strong>Honestidade percebida</strong> — admitir defeito pequeno ganha negócio grande',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'antes de contratar', size: 58, title: 'Sem processo, você<br>terceiriza a bagunça', items: [
        'Atendimento de lead: canal único, tempo máximo de resposta, roteiro',
        'Follow-up: cadência definida e cada conversa registrada',
        'Test drive: roteiro fixo, checagem de CNH, acompanhamento',
        'Fechamento: quem aprova desconto e como funciona a troca',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'dimensionamento', size: 62, title: 'De 15 a 30 carros<br>por vendedor', sub: 'Abaixo disso o custo fixo pesa; acima, o atendimento degrada. Ajuste pelo volume de leads e pelo giro.', foot: FOOT },
    ],
    legenda: `Toda loja de usados começa igual: o dono compra, prepara, anuncia, atende, negocia e entrega. Funciona — até deixar de funcionar.

O sinal de que é hora de contratar não é o tamanho do estoque, é o atendimento deixando dinheiro na mesa. Três sintomas:
→ Leads esfriando sem resposta. Em usados, o comprador fala com várias lojas ao mesmo tempo — quem responde primeiro leva a visita.
→ Follow-up inexistente. O interessado que veio, gostou e "ia pensar" nunca mais foi procurado.
→ O dono preso na operação. Captação, precificação e gestão paradas porque ele está no balcão.

Se dois desses três são rotina, a contratação já está atrasada. Se nenhum aparece, contratar "para vender mais" costuma só adicionar custo.

O perfil que performa tem menos a ver com lábia e mais com disciplina: resiliência (a maioria dos atendimentos não fecha), organização (follow-up é disciplina, não talento), escuta ativa, honestidade percebida — e interesse por carro ajuda, mas não substitui o resto.

Dimensionamento: de 15 a 30 carros por vendedor é um ponto de partida razoável. Abaixo disso o custo fixo pesa; acima, o atendimento degrada.

E contratar sem processo é terceirizar a bagunça. Antes do primeiro vendedor, documente as quatro etapas do funil: atendimento de lead (canal único, tempo máximo de resposta, roteiro), follow-up (cadência e registro), test drive (roteiro fixo, CNH, acompanhamento) e fechamento (alçadas de desconto, troca, documentação). Com o processo escrito, o vendedor novo tem régua para seguir — e você tem régua para cobrar.

Post completo, com treinamento sem departamento de treinamento e os erros de contratação, no blog. Link na bio.

#estoqueautos #equipedevendas #contratacao #gestaodepessoas #vendedores #lojadecarros #revendadeveiculos #carrosusados #seminovos #treinamento #followup #lojadeveiculos`,
  },

  {
    dir: 'metas-de-vendas-para-vendedores-de-carros',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 78, title: 'Meta chutada<br>é pior que<br>meta <em>nenhuma</em>', sub: 'De onde tirar o número, como desdobrar e como acompanhar.' },
      { kind: 'list', eyebrow: 'a origem', size: 58, title: 'Histórico primeiro,<br>ponto de equilíbrio<br>depois', items: [
        'Levante as vendas dos últimos 12 meses, por vendedor quando der',
        'Some os custos fixos e divida pelo lucro médio por carro',
        'A meta mínima da loja precisa ficar acima do ponto de equilíbrio',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'os dois tipos', size: 58, title: 'Resultado dá direção.<br>Atividade dá<br>diagnóstico', items: [
        '•<strong>Resultado:</strong> carros vendidos, lucro gerado, tíquete médio',
        '•<strong>Atividade:</strong> leads respondidos no prazo, follow-ups, test drives',
        '•Cumpriu atividade e não vendeu? é conversão. Não cumpriu? é execução',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'a escada', size: 58, title: 'Três degraus para<br>o time jogar<br>o mês inteiro', items: [
        '<strong>Mínima:</strong> um pouco acima do ponto de equilíbrio individual',
        '<strong>Alvo:</strong> histórico recente + crescimento factível — comissão cheia',
        '<strong>Esticada:</strong> alvo + desafio real, com bônus maior',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'o ritual', size: 62, title: 'Quatro checagens<br>por mês, não uma', sub: 'Com acompanhamento semanal dá tempo de corrigir a rota. Com uma só, no fechamento, resta lamentar.', foot: FOOT },
    ],
    legenda: `Quando o número cai do céu — "esse mês são dez carros porque sim" —, o time aprende rápido que a meta não significa nada.

Meta bem definida nasce de dados que o vendedor reconhece. Comece pelo histórico: quantos carros a loja vendeu por mês nos últimos 12, separado por vendedor quando possível. A média recente é o chão da realidade.

Depois cruze com o ponto de equilíbrio: some os custos fixos do mês e divida pelo lucro médio por carro. O resultado é o número de vendas que paga as contas. A meta mínima precisa ficar acima dele — se o histórico está abaixo, o problema não é meta, é custo, margem ou geração de demanda.

Meta boa cobra dois tipos:
→ Resultado (carros vendidos, lucro, tíquete médio): dá direção do mês e base da comissão
→ Atividade (leads respondidos no prazo, follow-ups, test drives): dá gestão semanal e diagnóstico

A mágica está na atividade: se o vendedor cumpre e não vende, o problema é conversão — treinamento, estoque ou preço. Se não cumpre, o problema é execução.

E use uma escada de três degraus, não uma meta binária:
Mínima — um pouco acima do ponto de equilíbrio individual. Abaixo dela, alerta de gestão.
Alvo — histórico recente mais crescimento factível. É onde a comissão cheia acontece.
Esticada — alvo mais desafio real. Existe para quem bateu em dia 22 não "guardar" venda para o mês seguinte.

Acompanhe com ritual semanal curto (20 a 30 minutos, três perguntas por vendedor), placar visível e conversa individual quinzenal.

E se ninguém bate a meta, é sintoma de sistema: a meta estava errada, faltou matéria-prima (leads, estoque, preço) ou faltou execução. O que não fazer: esticar a meta seguinte para compensar o buraco.

Post completo, com os 6 passos, no blog. Link na bio.

#estoqueautos #metas #vendas #equipedevendas #gestaocomercial #lojadecarros #revendadeveiculos #carrosusados #seminovos #indicadores #pontodeequilibrio #lojadeveiculos`,
  },

  {
    dir: 'como-vender-carros-com-juros-altos',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 80, title: 'Venda parcela,<br><em>não</em> preço', sub: 'Selic a 15% e financiamento perto de 25,8% ao ano: como a venda muda de eixo.' },
      { kind: 'list', eyebrow: 'inverta a ordem', size: 58, title: 'Pergunte cedo o<br>que cabe no mês', items: [
        'O cliente não compra um carro de X reais — compra uma parcela',
        'Começar pelo preço e terminar na simulação é de trás para frente',
        'Com parcela possível e entrada na mão, a conversa vira <strong>qual</strong> carro levar',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'as alavancas', size: 58, title: 'O que faz a<br>parcela caber', items: [
        '•<strong>Entrada maior</strong> — a alavanca nº 1, e o carro na troca é a mais comum',
        '•<strong>Simular em 2 ou 3 bancos</strong> — taxas e políticas variam muito',
        '•<strong>Carro mais barato no mix</strong> — a parcela cabe sem o cliente sair da loja',
        '•<strong>Consórcio</strong> para quem pode esperar',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'transparência', size: 58, title: 'Mostre o CET<br>antes de pedirem', items: [
        'CET é juros, tarifas, seguros e encargos num único percentual',
        'Compare as propostas dos bancos na frente do cliente',
        'Num mercado em que todo mundo desconfia, transparência fecha venda',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'por onde começar', size: 62, title: 'Duas mudanças<br>nesta semana', sub: 'Padronize a pergunta de qualificação — parcela, entrada e troca antes de falar de carro — e garanta dois bancos ativos para simulação.', foot: FOOT },
    ],
    legenda: `Selic a 15% e financiamento de veículos perto de 25,8% ao ano — com o 0km chegando a 27,7% em janeiro de 2026. É nesse cenário que sua equipe atende todo dia.

A boa notícia: o mercado de usados segue aquecido, com cerca de 940 mil transações em abril de 2026, alta de 3% sobre o ano anterior. Gente comprando existe. A diferença entre a loja que vende e a que reclama dos juros está na forma de estruturar a venda.

Com juros altos, o cliente não compra um carro de determinado valor — compra uma parcela que cabe (ou não) no orçamento. A negociação que começa pelo preço de tabela e termina na simulação está de trás para frente: ele se apaixona pelo carro, vê a parcela e vai embora.

Inverta: pergunte cedo quanto cabe por mês e quanto ele tem de entrada. Com esses dois números você apresenta os carros que fecham a conta — e a conversa passa a ser sobre qual carro levar.

As alavancas que fazem a parcela caber:
→ Entrada maior é a alavanca nº 1. Cada real reduz o valor financiado, e com juros altos o efeito na parcela é desproporcional. O carro usado do cliente é a entrada mais comum.
→ Simular em 2 ou 3 bancos é dinheiro na mesa: taxas e políticas de crédito variam, e a melhor proposta ganha o cliente.
→ Carro mais barato no mix, para a parcela caber sem o cliente sair da loja.
→ Prazo ajustado, sempre com o CET na mesa.
→ Consórcio, para quem pode esperar.

E sobre transparência: apresente o CET espontaneamente e compare as propostas na frente do cliente. Num mercado em que todo mundo desconfia, transparência é argumento de fechamento.

Post completo, com o passo a passo do atendimento, no blog. Link na bio.

#estoqueautos #jurosaltos #financiamento #cet #tecnicasdevenda #lojadecarros #revendadeveiculos #carrosusados #seminovos #parcela #consorcio #lojadeveiculos`,
  },

  {
    dir: 'troca-com-troco-loja-de-carros',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 78, title: 'Troca com troco:<br>a operação de<br>duas <em>lâminas</em>', sub: 'Fecha negócio que não aconteceria — ou vira máquina de comprar caro.' },
      { kind: 'cards', eyebrow: 'a conta', size: 58, title: 'Teto de avaliação,<br>de trás para frente', cards: [
        { lbl: 'preço de revenda realista', big: 'ponto de partida', note: 'por quanto esse carro vende de verdade na sua praça' },
        { lbl: '(−) preparação, débitos e documentação', big: 'custo real', note: 'higienização, reparos, pneus, IPVA, multas, transferência' },
        { lbl: '(−) custo de estoque e margem mínima', big: 'teto', on: true, note: '<strong>O máximo a oferecer</strong> pelo carro do cliente' },
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'o risco escondido', size: 58, title: 'A loja vende<br>e mesmo assim<br>sai dinheiro', items: [
        'Entrega o carro, entrega o troco e recebe um ativo que só vira dinheiro depois',
        '<strong>Troco no financiamento:</strong> o banco paga, o troco não sai do caixa',
        '<strong>Troco parcelado:</strong> duas ou três parcelas documentadas',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'diga não', size: 58, title: 'Quando recusar<br>a troca', items: [
        '•Carro fora do perfil da loja — segmento, faixa ou estado',
        '•Histórico com alerta: leilão, sinistro, documentação pendente',
        '•Cliente não aceita a avaliação realista',
        '•O caixa não comporta o troco e ele recusa financiamento',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'a conversa', size: 60, title: '"Mas na tabela<br>vale mais"', sub: 'A loja compra para revender: assume preparação, garantia legal e o risco do carro parado. Mostrar a conta aberta converte mais que discutir tabela.', foot: FOOT },
    ],
    legenda: `"Aceito seu carro na troca e ainda devolvo a diferença." Poucas frases vendem tanto no mercado de usados.

Na troca com troco, o carro do cliente vale mais que o da loja e a loja devolve a diferença — em dinheiro ou embutida no financiamento. Para o comprador, resolve três dores: não precisa vender o carro sozinho, sai com um veículo que cabe no orçamento e ainda leva dinheiro.

Mas a operação tem duas lâminas. Bem estruturada, fecha negócios que não aconteceriam e abastece o estoque abaixo do varejo. Mal estruturada, vira máquina de comprar caro e drenar caixa.

A avaliação é o coração. Faça a conta de trás para a frente:
Preço de revenda realista (por quanto esse carro vende de verdade na sua praça, não o anúncio mais caro do portal)
(−) preparação: higienização, reparos, pneus, revisão
(−) débitos e documentação: IPVA, multas, transferência
(−) custo de estoque: o carro vai ocupar pátio e capital por semanas
(−) margem mínima da loja
(=) teto de avaliação — o máximo a oferecer

O risco menos óbvio está no caixa: na troca com troco, a loja vende um carro e mesmo assim sai dinheiro. Duas válvulas aliviam — troco no financiamento (o banco paga a loja, o troco sai do valor liberado) e troco parcelado em duas ou três vezes documentadas.

Recuse quando o carro estiver fora do perfil, o histórico acender alerta, o cliente não aceitar a avaliação realista, o caixa não comportar o troco ou o pátio já estiver cheio nesse segmento.

E na conversa do "mas na tabela vale mais": explique sem constrangimento que a loja compra para revender — assume preparação, garantia legal e o risco do carro parado. Mostrar a conta aberta converte mais que discutir tabela.

Post completo, com os 7 passos para estruturar, no blog. Link na bio.

#estoqueautos #trocacomtroco #avaliacao #negociacao #lojadecarros #revendadeveiculos #carrosusados #seminovos #compradeestoque #caixa #vendadecarros #lojadeveiculos`,
  },
]
