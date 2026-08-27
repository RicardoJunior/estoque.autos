/** Os 3 carrosséis de lançamento do perfil @estoque.autos. */
import { join } from 'node:path'
import { SHOTS } from '../lib/render.mjs'

export const POSTS = [
  {
    dir: '01-missao',
    slides: [
      {
        kind: 'capa', label: 'missão', size: 88, eyebrow: 'por que existimos',
        title: 'Site próprio<br>não devia ser<br>privilégio de<br><em>loja grande</em>',
        sub: 'Por que o estoque.autos existe.',
      },
      {
        kind: 'text', eyebrow: 'o problema', size: 70,
        title: 'Ter site virou<br>projeto caro',
        sub: 'Agência, desenvolvedor, meses de espera e um orçamento que só loja grande paga. O resto da revenda fica refém dos portais — pagando mensalidade <strong>e</strong> por lead que ainda chega dividido com o concorrente do lado.',
      },
      {
        kind: 'text', eyebrow: 'a missão', size: 68,
        title: 'Qualquer loja<br>no ar em minutos',
        sub: 'Sem programador. Sem agência. Sem taxa de setup. Por um preço que cabe no mês, não no orçamento do ano.',
      },
      {
        kind: 'list', eyebrow: 'como', size: 64, title: 'Simples de verdade',
        items: [
          'Escolha um dos <strong>6 templates</strong> e ponha sua cor e seu logo',
          'Cadastre os carros puxando a <strong>tabela FIPE</strong>',
          'Publique — e os leads caem no <strong>seu WhatsApp</strong>',
        ],
        foot: 'a partir de R$ 24,90/mês',
      },
      {
        kind: 'final', eyebrow: 'comece hoje', size: 70,
        title: 'O site da sua loja,<br>no ar ainda hoje',
        sub: 'Para revendas que querem marca própria, leads próprios e zero dependência de portal.',
      },
    ],
    legenda: `Site próprio não devia ser privilégio de loja grande.

Por muito tempo, ter um site de veículos foi um projeto: agência, desenvolvedor, meses de espera e um orçamento que só quem é grande paga. O resto da revenda ficou refém dos portais — pagando mensalidade e ainda por lead, que chega dividido com o concorrente do lado.

O estoque.autos existe para mudar isso.

A missão é simples: colocar qualquer loja de carros no ar em minutos, sem programador, sem agência e sem taxa de setup. Por um preço que cabe no mês, não no orçamento do ano.

Como funciona:
1. Você escolhe um dos 6 templates e põe a sua cor e o seu logo
2. Cadastra os carros puxando marca, modelo, versão e ano da tabela FIPE
3. Publica — e cada proposta e clique no WhatsApp vira um lead no seu painel

A partir de R$ 24,90/mês, sem taxa de setup e cancelando quando quiser. Link na bio.

#estoqueautos #lojadecarros #revendadeveiculos #revendedordecarros #carrosusados #sitedecarros #vendadecarros #lojadeveiculos #marketingautomotivo #seminovos #veiculos #empreendedorismo`,
  },

  {
    dir: '02-simples',
    slides: [
      {
        kind: 'capa', label: 'como funciona', size: 90, eyebrow: 'como funciona',
        title: 'Do cadastro<br>ao site no ar<br>em <em>3 passos</em>',
        sub: 'Sem código. Sem programador. Sem taxa de setup.',
      },
      {
        kind: 'browser', eyebrow: 'passo 1', size: 62, title: 'Escolha o template',
        sub: 'Seis modelos prontos. Você ajusta a cor, a fonte e sobe o logo — o site já nasce com a cara da sua loja.',
        url: 'estoque.autos/<i>sualoja</i>', image: join(SHOTS, 'shot-premium-desktop.png'), height: 400,
      },
      {
        kind: 'list', eyebrow: 'passo 2', size: 62, title: 'Cadastre o estoque',
        items: [
          'Marca, modelo, versão e ano direto da <strong>tabela FIPE</strong>',
          'Fotos, preço, km, opcionais e observações',
          'Tudo por formulário, sem planilha e sem técnico',
        ],
        foot: 'carro vendido ou arquivado não conta no limite',
      },
      {
        kind: 'text', eyebrow: 'passo 3', size: 76, title: 'Publique',
        sub: 'Seu site entra no ar em <strong>estoque.autos/sualoja</strong> — ou no seu próprio domínio, no plano Pro. Cada proposta e cada clique no WhatsApp vira um lead registrado no painel.',
      },
      {
        kind: 'final', eyebrow: 'comece hoje', size: 72,
        title: 'Minutos.<br>Nenhum técnico',
        sub: 'Mudou de ideia sobre o template depois de publicar? Troque quantas vezes quiser — carros, fotos e leads ficam no lugar.',
      },
    ],
    legenda: `Do cadastro ao site no ar em 3 passos. Sem código, sem programador, sem taxa de setup.

1. Escolha o template
Seis modelos prontos. Você ajusta a cor, a fonte e sobe o logo — o site já nasce com a cara da sua loja.

2. Cadastre o estoque
Marca, modelo, versão e ano vêm da tabela FIPE, com o valor de referência na tela. Fotos, preço, km, opcionais e observações por formulário, direto do painel. Carro vendido ou arquivado não ocupa vaga no seu limite.

3. Publique
Seu site entra no ar em estoque.autos/sualoja — ou no seu próprio domínio, no plano Pro. Cada proposta e cada clique no WhatsApp vira um lead registrado, com data e origem.

Mudou de ideia sobre o template depois de publicar? Troque quantas vezes quiser: carros, fotos e leads ficam no lugar.

A partir de R$ 24,90/mês. Comece pelo link na bio.

#estoqueautos #sitedecarros #lojadecarros #revendadeveiculos #tabelafipe #carrosusados #seminovos #vendadecarros #marketingautomotivo #revendedordecarros #lojadeveiculos #vitrinedigital`,
  },

  {
    dir: '03-produto',
    slides: [
      {
        kind: 'capa', label: 'o produto', size: 90, eyebrow: 'o produto',
        title: 'Um site que<br>parece de<br><em>loja grande</em>',
        sub: 'Moderno por fora, completo por dentro.',
      },
      {
        kind: 'phone', eyebrow: 'responsivo', size: 56,
        title: 'Feito para o<br>celular primeiro',
        sub: 'A maior parte das visitas vem do celular. Cada template é desenhado para a tela pequena antes da grande — busca, fotos e botão de WhatsApp sempre à mão.',
        image: join(SHOTS, 'shot-premium-mobile.png'),
      },
      {
        kind: 'list', eyebrow: 'completo', size: 58,
        title: 'Tudo que uma vitrine<br>de carro precisa',
        items: [
          '•Busca com filtros por marca, modelo, ano e preço',
          '•Página do carro com galeria, ficha e valor FIPE',
          '•Proposta e WhatsApp em todas as páginas',
          '•SEO, sitemap e link de compartilhamento automáticos',
        ],
      },
      {
        kind: 'grid', eyebrow: 'templates', size: 56,
        title: 'Seis estilos,<br>uma marca: a sua',
        items: [['classico', 'Clássico'], ['moderno', 'Moderno'], ['premium', 'Premium'], ['minimal', 'Minimal'], ['esportivo', 'Esportivo'], ['vitrine', 'Vitrine']],
      },
      {
        kind: 'text', eyebrow: 'seus dados', size: 76, title: 'O lead é seu',
        sub: 'Cada proposta e cada clique no WhatsApp fica registrado no painel da <strong>sua</strong> loja — não no de um portal, e sem ser repassado para outros três concorrentes. Domínio próprio no plano Pro.',
      },
      {
        kind: 'final', eyebrow: 'planos', size: 72,
        title: 'A partir de<br>R$ 24,90/mês',
        sub: '<strong>Básico</strong> — até 20 carros ativos. <strong>Pro</strong> R$ 49,90/mês — até 60 carros, domínio próprio e destaque na busca. Sem taxa de setup, cancele quando quiser.',
      },
    ],
    legenda: `Um site que parece de loja grande — moderno por fora, completo por dentro.

Feito para o celular primeiro: a maior parte das visitas vem do telefone, então cada template é desenhado para a tela pequena antes da grande. Busca, fotos e botão de WhatsApp sempre à mão.

Completo de verdade: busca com filtros por marca, modelo, ano e preço · página do carro com galeria, ficha técnica e valor de referência da FIPE · proposta e WhatsApp em todas as páginas · SEO, sitemap e link de compartilhamento automáticos.

Seis estilos — Clássico, Moderno, Premium, Minimal, Esportivo e Vitrine — e uma marca: a sua. Cor, fonte e logo da loja em qualquer um deles.

E o mais importante: o lead é seu. Cada proposta e cada clique no WhatsApp fica registrado no painel da sua loja, com data e origem — não no de um portal, e sem ser repassado para outros três concorrentes.

Básico R$ 24,90/mês, até 20 carros ativos. Pro R$ 49,90/mês, até 60 carros, domínio próprio e destaque na busca. Sem taxa de setup, cancele quando quiser.

Link na bio.

#estoqueautos #sitedecarros #lojadecarros #revendadeveiculos #carrosusados #seminovos #vitrinedigital #marketingautomotivo #vendadecarros #revendedordecarros #lojadeveiculos #tabelafipe`,
  },
]
