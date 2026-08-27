/**
 * Os 35 carrosséis do blog, um por post, na ordem sugerida de publicação.
 *
 * O conteúdo mora em um arquivo por categoria do blog; aqui a lista é apenas
 * reordenada para alternar os assuntos no feed (nunca dois posts da mesma
 * categoria em sequência, exceto no fim da fila).
 */
import { GESTAO } from './gestao.mjs'
import { FINANCEIRO } from './financeiro.mjs'
import { VENDAS } from './vendas.mjs'
import { CONSIGNADOS } from './consignados.mjs'
import { MARKETING } from './marketing.mjs'

const TODOS = [...GESTAO, ...FINANCEIRO, ...VENDAS, ...CONSIGNADOS, ...MARKETING]

/** Ordem de publicação: alterna categorias e abre pelos assuntos mais buscados. */
const ORDEM = [
  'como-precificar-carros-usados',
  'giro-de-estoque-carros-quantos-dias',
  'como-vender-carros-pelo-whatsapp',
  'margem-de-lucro-venda-de-carros-usados',
  'como-avaliar-carro-na-compra',
  'como-fotografar-carros-para-vender',
  'carros-consignados-como-funciona',
  'fluxo-de-caixa-loja-de-veiculos',
  'gestao-de-estoque-loja-de-carros',
  'por-que-seu-carro-nao-vende',
  'comissao-e-bonificacao-vendedores-de-carros',
  'tabela-fipe-precificacao-estoque',
  'mix-de-estoque-carros-mais-procurados',
  'site-proprio-ou-marketplace-loja-de-carros',
  'quanto-cobrar-consignacao-de-veiculos',
  'capital-de-giro-revenda-de-carros',
  'garantia-de-carro-usado-cdc',
  'seo-local-para-loja-de-carros',
  'como-montar-equipe-de-vendas-loja-de-carros',
  'retorno-de-financiamento-loja-de-carros',
  'indicadores-kpis-loja-de-carros',
  'como-vender-mais-carros-com-site-proprio',
  'contrato-de-consignacao-de-veiculos',
  'queda-preco-carro-zero-impacto-usados',
  'golpes-na-compra-e-venda-de-carros',
  'carro-por-assinatura-e-a-revenda',
  'metas-de-vendas-para-vendedores-de-carros',
  'consorcio-de-veiculos-na-loja-de-carros',
  'como-abrir-uma-loja-de-carros',
  'troca-com-troco-loja-de-carros',
  'ipva-e-debitos-na-compra-e-venda-de-carros',
  'transferencia-e-documentacao-de-veiculos-lojista',
  'como-vender-carros-com-juros-altos',
  'carro-de-leilao-para-revenda-vale-a-pena',
  'carro-eletrico-e-hibrido-usado-para-revenda',
]

const porSlug = new Map(TODOS.map((p) => [p.dir, p]))
const faltando = ORDEM.filter((s) => !porSlug.has(s))
if (faltando.length) throw new Error(`slug sem conteúdo: ${faltando.join(', ')}`)
const sobrando = TODOS.filter((p) => !ORDEM.includes(p.dir)).map((p) => p.dir)
if (sobrando.length) throw new Error(`post fora da ordem de publicação: ${sobrando.join(', ')}`)

export const POSTS = ORDEM.map((slug) => porSlug.get(slug))
