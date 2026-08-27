/** Carrosséis dos posts da categoria Consignados. */
const NAMES = ['01-capa', '02-resumo', '03-resumo', '04-resumo', '05-conclusao']
const FOOT = 'post completo no blog · link na bio'
const EYE = 'consignados'

export const CONSIGNADOS = [
  {
    dir: 'carros-consignados-como-funciona',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 78, title: 'Pátio cheio<br>sem imobilizar<br><em>capital</em>', sub: 'Como funciona a venda de carros em consignação, de ponta a ponta.' },
      { kind: 'list', eyebrow: 'de quem é o carro', size: 58, title: 'Do proprietário,<br>do início ao fim', items: [
        'A venda ao comprador final é a <strong>única</strong> transferência',
        'A loja é responsável pela <strong>guarda</strong> enquanto o carro está no pátio',
        'Preço, prazo e repasse combinados <strong>por escrito</strong> — mudança se negocia',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'o fluxo', size: 58, title: 'Sete passos,<br>na ordem', items: [
        'Captação e checagem: débitos, restrições, histórico e inspeção',
        'Acordo comercial: preço, comissão, líquido do dono, prazo e alçada',
        'Contrato assinado, com guarda, test drive e desistência definidos',
        'Preparação, anúncio, negociação — e repasse com prestação de contas',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'os riscos', size: 58, title: 'Todos administráveis<br>com processo', items: [
        '•<strong>Débitos do dono:</strong> consulta na entrada e regularização antes de anunciar',
        '•<strong>Gravame ou bloqueio:</strong> verificar antes de expor',
        '•<strong>Dano no pátio:</strong> vistoria fotografada, seguro e controle de test drive',
        '•<strong>Desistência:</strong> prazo e regras de retirada antecipada em contrato',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'saber dizer não', size: 62, title: 'Metade do sucesso<br>é recusar carro', sub: 'Preço fora da realidade, débito que o dono não quer resolver, documentação enrolada ou carro fora do seu público: recuse.', foot: FOOT },
    ],
    legenda: `Estoque é o maior consumidor de dinheiro de uma revenda. A consignação inverte essa lógica: a loja expõe e vende veículos que não precisou comprar.

Na consignação, o proprietário entrega o veículo para que a loja o venda em nome dele. A loja entra com estrutura — pátio, anúncios, atendimento, negociação, documentação — e recebe uma comissão quando a venda acontece.

De quem é o carro durante todo o processo? Do proprietário. O documento continua no nome dele e a loja atua como intermediária. Na prática:
→ A venda ao comprador final é a única transferência — a loja não entra na cadeia de propriedade
→ A loja é responsável pela guarda: dano, furto ou sinistro no período de exposição é problema dela, salvo previsão contratual diferente
→ Preço, prazo e condições de repasse precisam estar combinados por escrito

O fluxo, em 7 passos: captação; checagem e avaliação (débitos, restrições, histórico, inspeção mecânica e preço de mercado — trate como se fosse comprar o carro); acordo comercial; contrato assinado; preparação e anúncio; negociação e venda dentro da alçada combinada; transferência, repasse e prestação de contas com comprovantes.

Os riscos existem, e todos são administráveis: débitos travando a venda (consulta na entrada e regularização antes de anunciar), carro financiado ou com restrição (verificar gravame antes de expor), dano no pátio (vistoria fotografada e assinada, seguro, controle de test drive), desistência do dono (prazo e regras em contrato) e reclamação do comprador (avaliação técnica de entrada e transparência no anúncio).

E saber dizer não é metade do sucesso. Recuse quando o dono quer preço fora da realidade, há débito que ele não quer resolver, a documentação está enrolada, o carro não tem a ver com o seu público ou o proprietário quer prazo indefinido e alçada zero.

Post completo no blog. Link na bio.

#estoqueautos #consignacao #consignados #lojadecarros #revendadeveiculos #carrosusados #seminovos #estoque #comissao #gestaodeloja #vendadecarros #lojadeveiculos`,
  },

  {
    dir: 'quanto-cobrar-consignacao-de-veiculos',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 76, title: 'Quanto cobrar<br>na consignação:<br>% ou <em>fixo</em>?', sub: 'Os três modelos do mercado — e a conta de custos que serve de piso.' },
      { kind: 'list', eyebrow: 'os modelos', size: 58, title: 'Três formatos<br>consagrados', items: [
        '<strong>% sobre a venda:</strong> o mais comum — faixas de mercado entre 5% e 10%',
        '<strong>Valor fixo por carro:</strong> previsível, bom para carro de menor valor',
        '<strong>"Tabela do dono":</strong> ele define o líquido, a loja fica com o que passar',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'atenção', size: 58, title: 'A armadilha da<br>tabela do dono', items: [
        'O dono tende a pedir um líquido alto',
        'A loja precisa anunciar acima do mercado para sobrar comissão',
        'O carro fica parado — e ninguém ganha nada',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'o piso', size: 58, title: 'O que a comissão<br>precisa cobrir antes<br>de virar lucro', items: [
        '•<strong>Preparação:</strong> higienização, polimento e pequenos reparos',
        '•<strong>Anúncio:</strong> fotos, portais pagos, impulsionamento e o tempo de quem cadastra',
        '•<strong>Pátio:</strong> aluguel, seguro, energia e limpeza — por meses, se o giro for lento',
        '•<strong>Vendedor e pós-venda:</strong> comissão dele e a garantia legal do CDC',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'por onde começar', size: 62, title: 'Feche a sua conta<br>antes da próxima<br>captação', sub: 'Some preparação, anúncio e pátio pelo seu prazo típico de venda, acrescente a comissão do vendedor e a margem mínima. Esse número é o seu piso.', foot: FOOT },
    ],
    legenda: `Aperte demais e o proprietário leva o carro para o concorrente. Afrouxe demais e a loja trabalha meses para ganhar menos do que gastou.

Os três modelos consagrados no mercado:

1. Percentual sobre o valor de venda — o mais comum. As faixas praticadas costumam ficar entre 5% e 10% do valor do carro, variando com a região, o tíquete médio e o nível de serviço da loja. Ponto fraco: em carro barato, a comissão pode não cobrir os custos.

2. Valor fixo por carro — previsível para os dois lados e bom para veículos de menor valor. Muitas lojas combinam os dois mundos: percentual com um valor mínimo garantido.

3. "Tabela do dono" — o proprietário diz quanto quer receber líquido e a loja fica com o que passar. Dá liberdade de negociação, mas tem armadilha conhecida: o dono pede um líquido alto, a loja precisa anunciar acima do mercado para sobrar comissão, e o carro fica parado.

E a comissão não é lucro: é receita que precisa pagar uma fila de custos antes. Preparação (higienização, polimento, pequenos reparos), anúncio (fotos, portais pagos, impulsionamento e o tempo de quem cadastra), pátio e estrutura (aluguel, seguro, energia, limpeza — por meses, se o giro for lento), vendedor (a comissão dele normalmente sai da sua) e pós-venda (perante o consumidor, quem vendeu responde: a garantia legal do CDC se aplica à loja).

Para apresentar a proposta sem perder a captação: mostre o serviço antes do número, traduza a alternativa (vender sozinho é receber desconhecidos em casa por semanas), leve referências reais de preço, explique a conta com transparência e feche por escrito na hora.

Post completo, com os erros de cobrança que corroem a operação, no blog. Link na bio.

#estoqueautos #consignacao #comissao #consignados #precificacao #lojadecarros #revendadeveiculos #carrosusados #seminovos #negociacao #captacao #lojadeveiculos`,
  },

  {
    dir: 'contrato-de-consignacao-de-veiculos',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 76, title: 'Consignado sem<br>contrato é<br>pedir <em>problema</em>', sub: 'As cláusulas que não podem faltar — e o checklist antes de assinar.' },
      { kind: 'list', eyebrow: 'as cláusulas', size: 58, title: 'O que o contrato<br>precisa definir', items: [
        '<strong>Identificação:</strong> partes e veículo — placa, chassi, Renavam, km',
        '<strong>Preço e alçada:</strong> anúncio, mínimo autorizado e margem de negociação',
        '<strong>Remuneração:</strong> comissão e o momento em que ela é devida',
        '<strong>Prazo:</strong> vigência, renovação e retirada antecipada',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'as cláusulas', size: 58, title: 'E as três que<br>quase todo mundo<br>esquece', items: [
        '•<strong>Responsabilidades:</strong> débitos, multas, sinistro e test drive',
        '•<strong>Autorização</strong> para fotografar, anunciar e fazer test drive',
        '•<strong>Devolução:</strong> estado de entrega, vistoria de saída e prazo de retirada',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'erros clássicos', size: 58, title: 'O que vira<br>prejuízo', items: [
        'Receber o carro sem checar débitos e restrições',
        'Aceitar carro de quem não é o dono do documento, sem procuração',
        'Não registrar a quilometragem na entrada',
        'Repassar o dinheiro ao dono antes de a venda liquidar',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'por onde começar', size: 60, title: 'Um modelo único,<br>revisado uma vez<br>por advogado', sub: 'Não redija contrato novo a cada carro. Uma revisão serve para todos os seguintes — e o dono que reclama da burocracia na entrada agradece a clareza na saída.', foot: FOOT },
    ],
    legenda: `Enquanto o carro está no seu pátio, ele continua gerando obrigações: IPVA, licenciamento, multa de radar em test drive, avaria na movimentação, desvalorização. Sem contrato, cada um desses eventos abre uma negociação nova — e quem costuma ceder é a loja.

As cláusulas que não podem faltar:
→ Identificação — dados completos das partes e do veículo (placa, chassi, Renavam, km), com termo de vistoria e fotos datadas em anexo
→ Preço e alçada — preço de anúncio e, principalmente, o preço mínimo pelo qual a loja pode fechar sem consultar o dono
→ Remuneração — formato da comissão, quando é devida e como é paga
→ Prazo — vigência (30, 60 ou 90 dias são comuns), regra de renovação e retirada antecipada
→ Responsabilidades — débitos, multas, sinistros, test drive e guarda
→ Autorização — permissão expressa para fotografar, anunciar e realizar test drives
→ Devolução — estado de entrega, vistoria de saída e prazo para o dono retirar

Consignação sem prazo vira estoque morto de terceiro ocupando o seu pátio.

Os erros clássicos que acabam em prejuízo: receber o carro sem checar débitos e restrições; aceitar carro de quem não é o dono do documento sem procuração; não registrar a quilometragem na entrada (test drives somam quilômetros, e sem registro qualquer diferença vira acusação); repassar o dinheiro ao dono antes de a venda liquidar; e usar modelo genérico baixado da internet.

O checklist antes de assinar: consulte débitos, multas e restrições; confirme a propriedade; faça a vistoria de entrada com fotos datadas; defina preço de anúncio e mínimo; formalize a comissão; estabeleça prazo, renovação e devolução; combine responsabilidades; e leve o modelo a um advogado antes de padronizar.

Post completo no blog. Link na bio.

#estoqueautos #consignacao #contrato #consignados #juridico #lojadecarros #revendadeveiculos #carrosusados #seminovos #documentacao #gestaodeloja #lojadeveiculos`,
  },
]
