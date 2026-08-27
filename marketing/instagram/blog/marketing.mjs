/** Carrosséis dos posts da categoria Marketing. */
const NAMES = ['01-capa', '02-resumo', '03-resumo', '04-resumo', '05-conclusao']
const FOOT = 'post completo no blog · link na bio'
const EYE = 'marketing'

export const MARKETING = [
  {
    dir: 'como-vender-carros-pelo-whatsapp',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 82, title: 'O WhatsApp é<br>o balcão da<br>sua <em>loja</em>', sub: 'Roteiro de conversa, respostas rápidas e follow-up que não sufoca.' },
      { kind: 'list', eyebrow: 'o fator nº 1', size: 58, title: 'Lead de carro<br>é perecível', items: [
        'Quem pergunta aciona duas, três, quatro lojas ao mesmo tempo',
        'E conversa de verdade com <strong>quem responde primeiro</strong>',
        'Em horário comercial: responda em <strong>minutos</strong>, não em horas',
      ], foot: 'teste: mande mensagem como cliente oculto e cronometre' },
      { kind: 'list', eyebrow: 'o roteiro', size: 58, title: 'Cinco etapas sem<br>virar interrogatório', items: [
        'Saudação — se apresente e pergunte o nome',
        'Carro — confirme disponibilidade e o anúncio que ele viu',
        'Uso — para trabalho ou família? tem carro na troca?',
        'Pagamento — financia ou à vista? posso simular sem compromisso',
        'Visita — <strong>duas opções de horário</strong>, nunca "quando você pode?"',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'follow-up', size: 58, title: 'A cadência<br>de 3 toques', items: [
        '•<strong>Dia seguinte:</strong> retome com informação nova, não com cobrança',
        '•<strong>2 a 3 dias:</strong> pergunta direta ou um carro alternativo do estoque',
        '•<strong>1 semana:</strong> porta aberta — e encerre o ciclo',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'por onde começar', size: 62, title: 'Cinco respostas<br>rápidas ainda<br>esta semana', sub: 'Perfil completo, saudação e ausência configuradas, etiquetas do funil criadas e o roteiro impresso à vista de quem atende.', foot: FOOT },
    ],
    legenda: `O WhatsApp virou o balcão da loja de carros no Brasil. E muita revenda ainda o trata como um telefone que atende quando dá.

Velocidade de resposta é o fator nº 1. Lead de carro é perecível: quem manda mensagem aciona duas, três, quatro lojas ao mesmo tempo e conversa de verdade com quem responde primeiro. Em horário comercial, responda em minutos, não em horas. Um teste que quase ninguém faz: mande mensagem para a própria loja como cliente oculto num sábado à tarde e cronometre.

Qualifique sem virar interrogatório: responda primeiro o que ele perguntou e faça uma pergunta por vez, sempre terminando a mensagem com algo que puxa a conversa adiante.

O roteiro em 5 etapas:
1. Saudação — "Oi, tudo bem? Aqui é o Carlos, da Auto Silva. Com quem eu falo?"
2. Carro — "O Onix 2021 está disponível sim! Você viu pelo anúncio, certo?"
3. Uso — "Vai usar mais para trabalho ou família? Tem carro na troca?"
4. Pagamento — "Pensa em financiar ou à vista? Posso simular sem compromisso."
5. Visita — "Amanhã às 10h ou às 16h fica melhor?" Duas opções de horário, nunca "quando você pode?"

Material que vende: fotos no padrão da loja, vídeo curto e personalizado começando com o nome do cliente, e áudio de até 30 segundos — mas só depois que a conversa engatou.

Do WhatsApp Business, use: perfil completo, etiquetas por estágio do funil, 8 a 10 respostas rápidas, catálogo do estoque e mensagens automáticas de saudação e ausência.

E o follow-up em três toques: dia seguinte com informação nova; 2 a 3 dias depois com pergunta direta ou carro alternativo; cerca de uma semana depois, mensagem de porta aberta — e encerre o ciclo.

Post completo, com os erros que espantam o lead, no blog. Link na bio.

#estoqueautos #whatsapp #atendimento #leads #conversao #lojadecarros #revendadeveiculos #carrosusados #seminovos #vendas #followup #lojadeveiculos`,
  },

  {
    dir: 'como-fotografar-carros-para-vender',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 80, title: 'Foto ruim faz<br>carro bom<br>ficar <em>invisível</em>', sub: 'Preparação, luz e uma sequência padrão — tudo com o celular do bolso.' },
      { kind: 'list', eyebrow: 'antes da câmera', size: 58, title: 'Nenhum ângulo<br>salva carro sujo', items: [
        'Lavado e <strong>completamente seco</strong> — pingo vira mancha branca',
        'Pneus limpos e com acabamento',
        'Sem adesivo de preço, faixa de oferta ou enfeite no para-brisa',
        'Interior despido: nada de objeto pessoal, papel ou tapete torto',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'luz e local', size: 58, title: 'Sombra aberta é o<br>melhor amigo<br>do lojista', items: [
        '•Sombra de prédio, galpão de porta aberta ou muro alto',
        '•Fim de tarde, início de manhã ou dia nublado',
        '•<strong>Evite sol a pino</strong> — reflexo estourado e sombra dura',
        '•Fundo limpo, e olhe o que "sai" do carro: poste, árvore, lixeira',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'a sequência', size: 58, title: 'Dez fotos,<br>sempre na<br>mesma ordem', items: [
        '3/4 dianteira (capa) · lateral inteira · 3/4 traseira e traseira',
        'Painel ligado · bancos da frente · bancos de trás · porta-malas',
        'Motor · rodas e pneus · detalhes — <strong>e os defeitos</strong>',
      ], foot: 'fotografar o defeito acelera a venda e filtra o comprador' },
      { kind: 'final', eyebrow: 'o teste', size: 62, title: 'Refotografe o carro<br>mais parado do<br>seu pátio', sub: 'Republique com o vídeo de walkaround e compare contatos e visitas na semana seguinte. É o teste mais barato que existe.', foot: FOOT },
    ],
    legenda: `No pátio, o comprador anda em volta do carro. Na tela, ele dá uma rolada de dedo e decide em segundos se o seu anúncio merece um clique.

Preparação primeiro — nenhum ângulo salva um carro sujo: lavado e completamente seco (pingo vira mancha branca na lataria escura), pneus limpos e com acabamento, sem adesivo de preço ou faixa de oferta, interior despido e uma volta de inspeção final.

Luz e local resolvem 90% dos casos:
→ Sombra aberta é o melhor amigo do lojista — prédio, galpão de porta aberta ou muro alto dão luz uniforme
→ Fim de tarde ou início de manhã produzem a luz mais bonita; dia nublado funciona como difusor gigante
→ Evite sol a pino: reflexo estourado no capô e sombra preta nas laterais
→ Fundo limpo, e olhe o que "sai" do carro — poste ou árvore alinhados atrás do teto parecem brotar da carroceria
→ Em carro escuro, cuidado com o seu próprio reflexo

A sequência padrão, sempre na mesma ordem: 3/4 dianteira (capa, na altura do peito, rodas levemente viradas), lateral inteira, 3/4 traseira e traseira, painel com o carro ligado, bancos dianteiros, bancos traseiros, porta-malas, motor, rodas e pneus, detalhes — e os defeitos.

Sim, fotografe os defeitos. Parece contraintuitivo, mas acelera a venda: filtra o comprador que desistiria na visita e constrói confiança com quem vai até a loja sabendo o que vai encontrar.

No celular: limpe a lente, ative a grade, deixe o HDR ligado, fuja da grande-angular 0.5x (ela deforma o carro), fotografe na horizontal, toque para focar e nada de zoom digital.

E feche com um walkaround de 40 a 60 segundos: uma volta lenta ao redor do carro, entrada no interior, motor ligando. Serve para o anúncio e para o WhatsApp.

Post completo, com o padrão da loja em 6 passos, no blog. Link na bio.

#estoqueautos #fotografiaautomotiva #fotosdecarros #anuncios #vitrinedigital #lojadecarros #revendadeveiculos #carrosusados #seminovos #marketingautomotivo #celular #lojadeveiculos`,
  },

  {
    dir: 'por-que-seu-carro-nao-vende',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 80, title: 'Carro parado<br>não é azar.<br>É <em>sintoma</em>', sub: 'As 8 causas do encalhe — e em que ordem atacar cada uma.' },
      { kind: 'list', eyebrow: 'as 4 primeiras', size: 58, title: 'Onde mora a<br>maior parte<br>dos encalhes', items: [
        '<strong>Preço fora do mercado:</strong> tem visualização, não tem contato',
        '<strong>Fotos ruins:</strong> nem visualização tem — ninguém clica',
        '<strong>Anúncio incompleto:</strong> as perguntas que chegam são sempre as mesmas',
        '<strong>Canal errado:</strong> leads raros mesmo com anúncio bom',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'as outras 4', size: 58, title: 'E as que ninguém<br>olha primeiro', items: [
        '•<strong>Demora na resposta:</strong> leads chegam, mas esfriam',
        '•<strong>Carro escondido no pátio:</strong> nem o vendedor lembra dele',
        '•<strong>Defeito aparente:</strong> visitas que não viram proposta',
        '•<strong>Mix errado:</strong> a categoria inteira gira devagar, não um carro',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'a dúvida clássica', size: 58, title: 'Baixar o preço ou<br>investir em<br>preparação?', items: [
        '<strong>Preparação</strong> quando o problema é percepção: o carro vale, mas não parece',
        '<strong>Preço</strong> quando o problema é posição: anúncio bom e equivalentes mais baratos ao lado',
        'Na dúvida, teste na ordem barata — fotos e anúncio primeiro',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'a régua', size: 60, title: 'Nenhum carro cruza<br>os 45 dias sem<br>ação registrada', sub: 'E quando for baixar, baixe de verdade: reposicionamento único e visível recoloca o carro no jogo. Conta-gotas só ensina o comprador a esperar.', foot: FOOT },
    ],
    legenda: `Todo pátio tem um: o carro que viu a estação mudar. Carro parado não é azar — é sintoma. E o diagnóstico quase sempre cai em uma de oito causas.

Percorra na ordem, da mais provável e mais barata de testar para a mais estrutural:

1. Preço fora do mercado. O anúncio tem visualizações, mas não gera contato. Correção: pesquisa de equivalentes na sua praça e reposicionamento.
2. Fotos ruins. O anúncio nem gera visualização. Correção: uma tarde — lavar, escolher luz e fundo, refazer o conjunto completo.
3. Anúncio incompleto. As perguntas que chegam são sempre as mesmas: "quantos km?", "é automático?". Boa parte dos compradores nem pergunta: descarta.
4. Canal errado. Leads raros mesmo com anúncio bom. Descubra de onde vêm os leads dos carros que vendem rápido e leve o encalhado para lá.
5. Demora na resposta. Leads chegam, mas esfriam.
6. Carro escondido no pátio. Nem os clientes nem os vendedores lembram dele. Rodízio de posição semanal e frente de loja para quem está parado há mais tempo.
7. Defeito aparente não resolvido. Visitas que não viram proposta — o comprador enxerga descuido e desconta no dobro.
8. Mix errado para a região. A categoria inteira gira devagar. A correção é na compra, não no anúncio.

A régua por dias parado: 0–30 é ciclo normal; 30–45 acende o amarelo (refazer fotos e anúncio, testar canal); 45–60 é vermelho (reposicionar preço, oferta ativa para a base); 60+ é capital preso e pede decisão firme.

E a dúvida clássica tem regra de bolso: invista em preparação quando o problema é percepção; baixe o preço quando o problema é posição. Na dúvida, teste na ordem barata. Quando for baixar, baixe de verdade — conta-gotas só ensina o comprador a esperar o próximo desconto.

Post completo no blog. Link na bio.

#estoqueautos #carroencalhado #girodeestoque #anuncios #precificacao #lojadecarros #revendadeveiculos #carrosusados #seminovos #marketingautomotivo #diagnostico #lojadeveiculos`,
  },

  {
    dir: 'site-proprio-ou-marketplace-loja-de-carros',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 76, title: 'Site próprio ou<br>marketplace:<br>onde <em>anunciar</em>?', sub: 'Spoiler: os dois. A questão é quanto colocar em cada um.' },
      { kind: 'list', eyebrow: 'o marketplace', size: 58, title: 'Alcance imediato —<br>e o que ele cobra', items: [
        '<strong>A favor:</strong> milhões de compradores com intenção de compra agora',
        '<strong>Contra:</strong> seu carro aparece ao lado de dezenas iguais',
        '<strong>Contra:</strong> o lead não é só seu e os dados ficam com o portal',
        '<strong>Contra:</strong> o cliente lembra do portal, raramente da sua loja',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'o site próprio', size: 58, title: 'Onde tudo<br>é seu', items: [
        '•<strong>Lead exclusivo</strong> — sem cinco concorrentes na mesma tela',
        '•<strong>Marca própria</strong> para a fachada, o cartão e o Google',
        '•<strong>SEO local:</strong> uma página por carro disputando "modelo + cidade"',
        '•<strong>Custo que não escala:</strong> o 20º carro custa o mesmo que o 1º',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'a conta', size: 58, title: 'Meça antes<br>de realocar', items: [
        'Marque a origem de cada lead — "onde você viu o carro?"',
        'Some o gasto mensal por canal',
        'Gasto ÷ leads = CPL. Gasto ÷ vendas = custo por venda',
        'Canal barato que não vende é caro',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'o que amarra os dois', size: 58, title: 'Ele vê no portal.<br>Depois pesquisa<br>o nome da loja', sub: 'Se essa busca não encontra um site decente, a confiança cai. O site trabalha até para os leads que nasceram no marketplace.', foot: FOOT },
    ],
    legenda: `Renovar o plano do portal ou investir num site próprio? A escolha é um falso dilema — os dois canais fazem trabalhos diferentes.

O marketplace entrega o que nenhuma loja constrói sozinha: milhões de compradores navegando com intenção de compra agora. Anunciou hoje, aparece hoje. Mas cobra: custo recorrente que cresce com o estoque, concorrência colada (seu carro ao lado de dezenas iguais, muitas vezes ordenados por preço), o lead que não é só seu, os dados que ficam com a plataforma, a marca invisível e regras que mudam sem você ser consultado.

O site próprio é o único canal onde tudo é seu: lead exclusivo (quem chamou a partir dele escolheu a sua loja), marca própria, SEO local com uma página indexável por carro, remarketing e base de contatos da loja, e custo que não escala por anúncio — o 20º carro custa o mesmo que o 1º. O que ele exige é paciência: o resultado orgânico leva meses.

Por que a resposta é "os dois"? Porque cada um ocupa um momento da jornada. O marketplace captura demanda; o site converte e fideliza.

E tem um comportamento que amarra os dois: o comprador vê seu carro no portal, gosta — e pesquisa o nome da loja no Google antes de chamar. Se essa busca não encontra um site decente, a confiança cai. O site trabalha até para os leads que nasceram no marketplace.

Como decidir com número, não com opinião: marque a origem de cada lead ("onde você viu o carro?"), some o gasto mensal por canal, divida gasto por leads (CPL) e gasto por vendas (custo por venda — o número que realmente importa). Compare também a qualidade: taxa de resposta, visitas agendadas e vendas por canal.

Migração gradual: site no ar com o estoque completo, tudo apontando para ele, medir por 2 a 3 meses sem mexer em nada, realocar a verba aos poucos e manter o portal para o que ele faz melhor.

Post completo no blog. Link na bio.

#estoqueautos #siteproprio #marketplace #custoporlead #anuncios #lojadecarros #revendadeveiculos #carrosusados #seminovos #marketingautomotivo #leads #lojadeveiculos`,
  },

  {
    dir: 'seo-local-para-loja-de-carros',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 78, title: '"Carros usados<br>perto de mim":<br>sua loja <em>aparece</em>?', sub: 'SEO local é uma disputa pequena — você compete só com a sua cidade.' },
      { kind: 'list', eyebrow: 'o alicerce', size: 58, title: 'Perfil da Empresa<br>no Google', items: [
        '<strong>Categoria correta</strong> — "Loja de carros usados" como principal',
        '<strong>Endereço, telefone e horário</strong> sempre atualizados, feriados incluídos',
        '<strong>Fotos reais e recentes</strong> — fachada, pátio, interior, estoque',
        '<strong>Posts semanais</strong> e perguntas respondidas rápido',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'o que mais pesa', size: 58, title: 'Avaliações:<br>peça na entrega<br>das chaves', items: [
        '•É o pico de satisfação — ali o pedido soa natural',
        '•Envie o link direto por WhatsApp logo depois',
        '•Um pedido e, no máximo, um lembrete',
        '•<strong>Nunca ofereça brinde em troca</strong> — é contra as regras do Google',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'a base técnica', size: 58, title: 'NAP igual em todo<br>lugar + uma página<br>por carro', items: [
        'Mesmo nome, endereço e telefone no Google, site, redes e portais',
        'Título com marca, modelo, versão, ano e cidade',
        'URL própria e estável para cada veículo',
        'Destino definido para carro vendido — nunca página quebrada',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'expectativa', size: 60, title: 'De 3 a 6 meses —<br>e é por isso<br>que funciona', sub: 'Concorrente nenhum copia da noite para o dia. O que acelera é constância; o que atrasa é perfil abandonado e NAP bagunçado.', foot: FOOT },
    ],
    legenda: `Quando alguém digita "carros usados" ou "loja de carros perto de mim", o Google mostra três lojas no mapa. Quem aparece ali recebe ligações e visitas todos os dias, sem pagar por clique.

E a boa notícia é que SEO local é uma disputa pequena: você não compete com o Brasil inteiro, e sim com as revendas da sua cidade — a maioria delas tratando o Google com descaso.

O alicerce é o Perfil da Empresa: categoria correta ("Loja de carros usados" como principal), endereço, telefone e horário sempre atualizados (inclusive feriados — cliente que encontra portão fechado avalia com uma estrela), fotos reais e recentes da fachada, pátio e estoque, descrição com cidade e região, posts semanais e perguntas respondidas rápido.

Avaliações são o fator que mais mexe o ponteiro. Como pedir sem constranger:
→ Peça na entrega das chaves — é o pico de satisfação
→ Envie o link direto por WhatsApp logo depois, com mensagem curta e pessoal
→ Um pedido e, no máximo, um lembrete
→ Nunca ofereça brinde ou desconto em troca: é contra as regras do Google
→ Responda todas, positivas e negativas

NAP é o trio nome, endereço e telefone. Divergência entre canais dilui a confiança do algoritmo. Padronize a grafia exata em Perfil da Empresa, site, redes, marketplaces e diretórios — uma tarde de trabalho, efeito permanente.

E o site próprio com uma página indexável por carro é o que permite disputar "corolla usado + sua cidade". O anúncio no portal ranqueia para o portal. Cada página precisa de título com marca, modelo, versão, ano e cidade, descrição real, fotos completas, URL estável e destino definido quando o carro é vendido.

Prazo: de 3 a 6 meses para ranquear bem. É lento — e é justamente por isso que funciona.

Post completo, com os 7 passos, no blog. Link na bio.

#estoqueautos #seolocal #google #perfildaempresa #avaliacoes #lojadecarros #revendadeveiculos #carrosusados #seminovos #marketingautomotivo #buscaslocais #lojadeveiculos`,
  },

  {
    dir: 'como-vender-mais-carros-com-site-proprio',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 80, title: 'O cliente pesquisa<br>sua loja. O que<br>ele <em>acha</em>?', sub: 'Por que toda revenda precisa de um site próprio — e como montar o seu.' },
      { kind: 'list', eyebrow: 'o que ele resolve', size: 58, title: 'Três coisas que<br>portal e Instagram<br>não resolvem', items: [
        '<strong>Credibilidade:</strong> vitrine no seu domínio, com seu logo e suas cores',
        '<strong>Controle:</strong> você define estoque, preço e destaque, sem concorrente na página',
        '<strong>Captura de lead:</strong> proposta e WhatsApp registrados no seu painel',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'os 4 pilares', size: 58, title: 'O que faz um<br>site vender', items: [
        '•Vitrine rápida e bonita <strong>no celular</strong>',
        '•<strong>Lead em cada carro</strong> — não só o telefone no rodapé',
        '•<strong>Preço de referência claro</strong>, alinhado à FIPE',
        '•<strong>Ser achado no Google</strong>: título, descrição e sitemap automáticos',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'o que afasta', size: 58, title: 'Erros que fazem<br>o comprador<br>pular fora', items: [
        'Fotos escuras, tortas ou com marca d\'água de outro site',
        '"Consulte valores" — o cliente pula para o próximo anúncio',
        'Demora para responder o WhatsApp',
        'Estoque desatualizado: carro vendido ainda anunciado',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'por onde começar', size: 60, title: 'Não precisa<br>abandonar nada', sub: 'Monte a vitrine própria, passe a divulgar o link dela nas redes e no WhatsApp e compare o custo por lead dos dois canais depois de um mês.', foot: FOOT },
    ],
    legenda: `O cliente que pesquisa o nome da sua loja no Google, o que recebe o link de um carro no WhatsApp, o que volta para rever aquele SUV — todos eles precisam de um lugar que é seu.

Um site próprio resolve três problemas que marketplace e Instagram não resolvem:
→ Credibilidade. Uma vitrine no seu domínio, com seu logo e suas cores, passa mais confiança que um perfil no meio de milhares de anunciantes.
→ Controle. Você define o estoque, o preço e o destaque — sem disputar atenção com a concorrência na mesma página.
→ Captura de lead. Cada carro vira ponto de contato: proposta e WhatsApp registrados no seu painel, não perdidos numa DM.

Os quatro pilares de um site que vende:
1. Vitrine rápida e bonita no celular. A grande maioria abre o anúncio pelo telefone: fotos grandes, preço visível e botão de contato sempre à mão.
2. Lead em cada carro. O erro mais comum é ter o telefone só no rodapé. O certo é proposta e botão de WhatsApp em cada veículo, no momento em que o interesse é maior.
3. Preço de referência claro. Mostrar que o preço está alinhado à FIPE reduz a desconfiança e acelera a negociação.
4. Ser achado no Google. Cada anúncio com título, descrição e link de compartilhamento prontos, além de sitemap automático.

Do zero ao site no ar: escolha o plano e crie a conta, monte a vitrine (template, cor, fonte, logo), cadastre o estoque pela FIPE, divulgue o link da loja e de cada carro, e acompanhe os leads — respondido em minutos converte muito mais que respondido em horas.

E os erros que afastam o comprador: fotos escuras ou com marca d'água de outro site, "consulte valores", demora no WhatsApp e estoque desatualizado.

Post completo no blog. Link na bio.

#estoqueautos #siteproprio #sitedecarros #vitrinedigital #leads #lojadecarros #revendadeveiculos #carrosusados #seminovos #marketingautomotivo #whatsapp #lojadeveiculos`,
  },

  {
    dir: 'carro-por-assinatura-e-a-revenda',
    names: NAMES,
    slides: [
      { kind: 'capa', label: 'blog', eyebrow: EYE, size: 76, title: 'Carro por assinatura<br>ameaça sua loja<br>de <em>usados</em>?', sub: 'Muito menos do que o barulho sugere — e ela pode virar seu fornecedor.' },
      { kind: 'list', eyebrow: 'os números', size: 58, title: 'O usado cresce<br>na prática', items: [
        '<strong>~940 mil transações</strong> de usados só em abril de 2026, alta de 3%',
        'HB20, Gol e Onix lideram as buscas do país',
        'Público que a assinatura, concentrada em carro novo, não atende',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'o efeito colateral', size: 58, title: 'Todo carro de<br>assinatura vira<br>seminovo', items: [
        '•<strong>Padronizados:</strong> mesmos modelos e faixas de ano, em lotes',
        '•<strong>Manutenção em dia:</strong> revisões em rede autorizada por contrato',
        '•<strong>Histórico documentado</strong> e idade baixa — de 1 a 3 anos',
        '•A assinatura, por esse ângulo, é <strong>fornecedor</strong>, não concorrente',
      ], foot: FOOT },
      { kind: 'list', eyebrow: 'a conta honesta', size: 58, title: 'Aluguel para<br>sempre × mensalidade<br>com data para acabar', items: [
        '<strong>Assinatura:</strong> nunca é do cliente, mensalidade eterna, km limitada',
        '<strong>Usado:</strong> dele desde o primeiro dia, o carro quita e vira entrada do próximo',
        'Em 3+ anos, o custo da assinatura cresce sem parar; o do usado cai',
      ], foot: FOOT },
      { kind: 'final', eyebrow: 'por onde começar', size: 60, title: 'Some 36<br>mensalidades', sub: 'Coloque ao lado do custo de comprar um seminovo equivalente na sua loja. Vire isso em página no site e roteiro de WhatsApp para o time.', foot: FOOT },
    ],
    legenda: `Toda semana surge uma manchete sobre carro por assinatura. Para o dono de loja de usados, a pergunta é direta: isso ameaça o meu negócio?

Muito menos do que o barulho sugere. Enquanto a assinatura cresce no discurso, o usado cresce na prática: levantamentos de 2026 registram cerca de 940 mil transações só em abril, alta de 3% sobre o ano anterior. E a demanda por populares é enorme — HB20, Gol e Onix lideram as buscas do país, um público que a assinatura, concentrada em carros novos com mensalidades de carro novo, não atende.

Aqui está a parte que pouca gente comenta: todo carro de assinatura vira seminovo. Ao fim dos contratos, montadoras e locadoras desmobilizam esses veículos em volume — padronizados (mesmos modelos e faixas de ano, em lotes), com manutenção em dia (revisões em rede autorizada, porque o contrato exigia), histórico documentado e idade baixa, de 1 a 3 anos. Para a loja, isso é fonte de estoque de qualidade. A assinatura, por esse ângulo, é fornecedor, não concorrente.

E na mesa de negociação, o erro é deixar o cliente comparar a mensalidade com a parcela do financiamento e parar aí. A comparação honesta é o custo total:
→ Propriedade: nunca é dele × dele desde o primeiro dia
→ Mensalidade: eterna × tem fim, o carro quita
→ Patrimônio ao final: zero × carro quitado, que vira entrada do próximo
→ Quilometragem: limitada por contrato × livre
→ Custo em 3+ anos: cresce sem parar × cai após a quitação

O argumento-síntese: a assinatura é aluguel para sempre; o usado é mensalidade com data para acabar e um bem no fim.

Esta semana, faça uma conta: some 36 mensalidades do plano mais anunciado na sua cidade e coloque ao lado do custo de comprar um seminovo equivalente na sua loja. Vire isso numa página do site e num roteiro de WhatsApp.

Post completo no blog. Link na bio.

#estoqueautos #carroporassinatura #mercadodeusados #concorrencia #posicionamento #lojadecarros #revendadeveiculos #carrosusados #seminovos #fontedeestoque #marketingautomotivo #lojadeveiculos`,
  },
]
