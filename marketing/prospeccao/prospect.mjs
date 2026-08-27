#!/usr/bin/env node
/**
 * Pipeline de prospecção — estoque.autos
 *
 * Recebe o dump de CNPJs `loja-carros.csv` e produz uma lista RANQUEADA das
 * lojas com maior chance de assinar: revenda multimarcas pequena, aberta há
 * pouco tempo, que ainda usa e-mail grátis (sinal forte de que NÃO tem site).
 *
 * Subcomandos:
 *
 *   node prospect.mjs score <entrada.csv> [--out …] [--top N] [--exclude a.csv]
 *       Deduplica por CNPJ, filtra para loja de carros de verdade e pontua.
 *       Não faz rede.
 *
 *   node prospect.mjs enrich <ranqueado.csv> [--out …] [--limit N] [--only-missing]
 *       Consulta o parceiro (CPF do sócio + nome) e anexa os e-mails achados.
 *       Lê CHARGEFY_API_KEY do ambiente/.env. Cache em .cache/.
 *
 *   node prospect.mjs audience <enriquecido.csv> [--out …] [--mode …] [--limit N]
 *       Monta a lista final deduplicada, um e-mail por destinatário.
 *
 *   node prospect.mjs lotes <audiencia.csv> [--sizes 15,25,30,30]
 *       Fatia a audiência em lotes de aquecimento crescentes.
 *
 * O disparo NÃO mora aqui — ver README.md desta pasta.
 *
 * ─── Formato do dump ────────────────────────────────────────────────────────
 * `loja-carros.csv` vem SEM cabeçalho, com 13 colunas fixas e em latin1:
 *   cnpj, razao_social, nome_fantasia, email, cep, logradouro, bairro,
 *   municipio, uf, capital_social, porte_empresa, cpf_socio, nome_socio
 * Repare que NÃO existe data de abertura — a idade sai da raiz do CNPJ.
 */

import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')

const COLUNAS_DUMP = [
  'cnpj', 'razao_social', 'nome_fantasia', 'correio_eletronico', 'cep',
  'logradouro', 'bairro', 'municipio', 'uf', 'capital_social',
  'porte_empresa', 'cnpj_cpf_socio', 'nome_socio',
]

// ─── CSV ─────────────────────────────────────────────────────────────────────

/** Parser CSV mínimo mas correto: aspas, aspas escapadas ("") e \r\n. */
function parseCsv(text) {
  const rows = []
  let row = [], field = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else quoted = false }
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}

/** Lê um CSV COM cabeçalho (os intermediários que este script escreve). */
function readRecords(path) {
  const rows = parseCsv(readFileSync(path, 'utf8')).filter((r) => r.some((c) => c.trim() !== ''))
  const header = rows[0].map((h) => h.trim().toLowerCase())
  return rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])))
}

/** Lê o dump SEM cabeçalho, em streaming (35 MB, 160 mil linhas). */
async function streamDump(path, onRecord) {
  const stream = createReadStream(path, { encoding: 'latin1', highWaterMark: 1 << 20 })
  let row = [], field = '', quoted = false, escapePending = false
  const endRow = () => {
    row.push(field); field = ''
    if (row.some((c) => c !== '')) onRecord(Object.fromEntries(COLUNAS_DUMP.map((c, i) => [c, (row[i] ?? '').trim()])))
    row = []
  }
  for await (const chunk of stream) {
    for (let i = 0; i < chunk.length; i++) {
      const c = chunk[i]
      if (escapePending) { escapePending = false; if (c === '"') { field += '"'; continue } quoted = false }
      if (quoted) { if (c === '"') escapePending = true; else field += c }
      else if (c === '"') quoted = true
      else if (c === ',') { row.push(field); field = '' }
      else if (c === '\n') endRow()
      else if (c !== '\r') field += c
    }
  }
  if (field !== '' || row.length) endRow()
}

function toCsv(records, columns) {
  const esc = (v) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [columns.join(','), ...records.map((r) => columns.map((c) => esc(r[c])).join(','))].join('\n') + '\n'
}

/** CNPJs e e-mails de rodadas anteriores, que não podem se repetir. */
function readExclusions(spec) {
  const cnpjs = new Set(), emails = new Set()
  for (const path of String(spec).split(',').map((p) => p.trim()).filter(Boolean)) {
    if (!existsSync(path)) fail(`--exclude: arquivo não encontrado: ${path}`)
    for (const r of readRecords(path)) {
      for (const v of Object.values(r)) {
        const s = String(v ?? '').trim()
        if (/^\d{14}$/.test(s)) cnpjs.add(s)
        else if (s.includes('@')) for (const e of s.split(';')) if (e.includes('@')) emails.add(e.toLowerCase().trim())
      }
    }
  }
  return { cnpjs, emails }
}

// ─── Idade a partir da raiz do CNPJ ──────────────────────────────────────────

/**
 * O dump não traz data de abertura, mas desde 1998 as raízes de CNPJ saem em
 * ordem nacional — então a raiz funciona como relógio.
 *
 * Calibrado com duas fontes: as 200 linhas do imoveis.plus que traziam CNPJ e
 * data lado a lado (2017–2022) e 32 consultas à BrasilAPI cobrindo 44M–58M.
 * Pontos medidos: 44,17M=nov/2021 · 45,49M=mar/2022 · 48,41M=out/2022 ·
 * 49,10M=jan/2023 · 51,08M=jun/2023 · 53,07M=dez/2023 · 54,18M=mar/2024 ·
 * 55,10M=mai/2024 · 57,12M=set/2024 · 58,01M=nov/2024.
 *
 * Acima de ~58M a numeração é CGC legado de antes de 1998 e não tem ordem
 * (a amostra trouxe uma loja de 1988 com raiz 59,18M) — ali devolvemos null.
 */
const FAIXAS_ANO = [
  [26_500_000, 2017], [29_500_000, 2018], [32_300_000, 2019], [35_800_000, 2020],
  [41_000_000, 2021], [44_800_000, 2022], [48_700_000, 2023], [53_200_000, 2024],
]
/**
 * Acima disso a densidade do dump despenca (57M tem 2.260 CNPJs, 58M tem 155) —
 * é onde a foto foi tirada, ~out/2024, e o que vem depois é CGC legado.
 */
const RAIZ_LEGADA = 58_000_000

/** Ano aproximado de abertura pela raiz do CNPJ, ou null quando indeterminável. */
function anoPelaRaiz(cnpj) {
  const raiz = Number(String(cnpj).slice(0, 8))
  if (!raiz || raiz >= RAIZ_LEGADA) return null
  let ano = 2016 // tudo abaixo da primeira faixa é 2016 ou mais antigo
  for (const [limite, a] of FAIXAS_ANO) if (raiz >= limite) ano = a
  return ano
}

// ─── Sinais e pontuação ──────────────────────────────────────────────────────

/**
 * Loja de carros de verdade — quem expõe veículo ao consumidor final.
 * `\b` de propósito: "AUTO" casa em "AUTO CENTER" mas não em "AUTOPECAS".
 */
const LOJA_CARRO = [/\bVEICULOS?\b/, /\bAUTOMOVEIS\b/, /\bMULTIMARCAS?\b/, /\bSEMINOVOS?\b/, /\bAUTOMOTORES\b/, /\bMOTORS\b/, /\bAUTOS\b/, /\bAUTO\b/, /\bREVENDA\b/, /\bCAR\b/, /\bCARS\b/]

/**
 * Fora do ICP. Cada grupo tem um motivo diferente, mas todos terminam em
 * "não é uma vitrine de carro usado para o consumidor final".
 */
const FORA_DO_ICP = [
  // oficina / peças — não vende carro
  /\bPECAS\b/, /\bACESSORIOS\b/, /\bOFICINA\b/, /\bMECANICA\b/, /\bFUNILARIA\b/, /\bRETIFICA\b/, /\bPNEUS?\b/,
  // outro tipo de veículo — o produto é carro (FIPE de automóvel)
  /\bMOTOS?\b/, /\bMOTOCICL/, /\bCAMINHOES\b/, /\bCAMINHAO\b/, /\bONIBUS\b/, /\bIMPLEMENTOS\b/,
  /\bTRATORES?\b/, /\bMAQUINAS\b/, /\bAGRICOLA/, /\bAGRO/, /\bNAUTICA/, /\bBARCOS?\b/,
  // aluga, não vende
  /\bLOCACAO/, /\bLOCACOES\b/, /\bLOCADORA\b/, /\bRENT\b/, /\bALUGUEL\b/,
  // transporte / logística
  /\bTRANSPORTES?\b/, /\bLOGISTICA\b/, /\bMUDANCAS\b/, /\bGUINCHO\b/, /\bREBOQUE\b/, /\bTAXI\b/, /\bFRETAMENTO\b/,
  // imobiliário / construção / holding
  /\bIMOVEIS\b/, /\bIMOBILIARIA\b/, /\bCONSTRUTORA\b/, /\bCONSTRUCAO/, /\bINCORPORA/,
  /\bPARTICIPACOES\b/, /\bHOLDING\b/, /\bSPE\b/, /\bEMPREENDIMENTOS IMOB/,
  // atacado / indústria — não é varejo de vitrine
  /\bIMPORTACAO\b/, /\bEXPORTACAO\b/, /\bDISTRIBUIDORA\b/, /\bATACAD/, /\bINDUSTRIA\b/,
  // serviços financeiros e burocráticos
  /\bSEGUROS?\b/, /\bCORRETORA DE SEGUROS\b/, /\bCONSORCIO\b/, /\bDESPACHANTE\b/, /\bFINANCEIRA\b/,
  // fim de vida do veículo
  /\bSUCATA\b/, /\bFERRO VELHO\b/, /\bDESMANCHE\b/, /\bRECICLAGEM\b/, /\bFERRAGEM\b/,
  // combustível
  /\bPOSTO\b/, /\bCOMBUSTIVEIS\b/,
]

/**
 * Grupos grandes de concessionária: já têm site, time de marketing e contrato
 * com a montadora. Aparecem no dump pelo domínio de e-mail corporativo.
 */
const GRUPOS_GRANDES = ['parvi.com.br', 'grupobarigui.com.br', 'caoa.com.br', 'aguiabranca.com.br', 'automob.com.br', 'gruposaga.com.br', 'revemar.com.br', 'grupolider.com.br', 'localiza.com', 'movida.com.br', 'unidas.com.br']

/**
 * Teto de capital social do ICP. Acima de R$ 1 milhão (p95 da base) não é mais
 * a revenda de bairro que o produto atende: é grupo, concessionária ou frota.
 * Vira descarte, não penalidade — com penalidade de −2 o gigante sobrevivia a
 * um `--min-score 12` e entrava na audiência pela porta dos fundos.
 */
const CAPITAL_MAX_ICP = 1_000_000
const capitalForaDoIcp = (r) => Number(r.capital_social || 0) >= CAPITAL_MAX_ICP

/** E-mail que cai na mesa do contador, não na do dono. */
const DOMINIOS_PROXY = ['contabilizei.com.br', 'accountbank.com.br', 'dominiosistemas', 'sispro', 'nfe.']
const LOCALPART_PROXY = /contab|contad|cont\.|fiscal|escrit|assessor|advoc/i

/**
 * Webmail grátis: o dono lê pessoalmente e provavelmente não tem site.
 * As faixas de bounce vêm MEDIDAS nos 400 envios do imoveis.plus:
 * gmail 2,9% · hotmail 15,7% · yahoo.com.br 15,4% · uol 50% · terra 83%.
 * O bloco legado inteiro deu 23,3%. Continua sendo "e-mail de dono" para
 * escolher o destinatário, mas entra na nota com penalidade — bounce alto
 * queima a reputação do domínio remetente.
 */
const WEBMAIL_ATIVO = ['gmail.com']
const WEBMAIL_MODERNO = ['outlook.com', 'outlook.com.br', 'icloud.com', 'proton.me', 'hotmail.com.br']
const WEBMAIL_LEGADO = ['hotmail.com', 'yahoo.com', 'yahoo.com.br', 'uol.com.br', 'terra.com.br', 'bol.com.br', 'live.com', 'msn.com', 'ig.com.br', 'globo.com', 'brturbo.com.br', 'oi.com.br', 'zipmail.com.br']
const WEBMAIL = [...WEBMAIL_ATIVO, ...WEBMAIL_MODERNO, ...WEBMAIL_LEGADO]

const nomeCompleto = (r) => `${r.razao_social} ${r.nome_fantasia}`.toUpperCase()
const ehLojaCarro = (r) => LOJA_CARRO.some((k) => k.test(nomeCompleto(r)))
const foraDoIcp = (r) => FORA_DO_ICP.find((k) => k.test(nomeCompleto(r)))
const dominio = (e) => (e.includes('@') ? e.split('@').pop().toLowerCase() : '')
const localpart = (e) => (e.includes('@') ? e.split('@')[0] : '')
const ehProxy = (e) => DOMINIOS_PROXY.some((d) => dominio(e).includes(d)) || LOCALPART_PROXY.test(localpart(e))
const ehWebmail = (e) => WEBMAIL.includes(dominio(e))
const ehGrupoGrande = (e) => GRUPOS_GRANDES.some((d) => dominio(e).endsWith(d))

/**
 * Pontua a chance de conversão. ICP do estoque.autos: revenda multimarcas
 * pequena, aberta nos últimos anos, com e-mail de dono e sem site próprio.
 */
function pontuar(r, hoje) {
  const razoes = []
  let score = 0

  if (ehLojaCarro(r)) { score += 4; razoes.push('loja de carros') }
  const fora = foraDoIcp(r)
  if (fora) { score -= 8; razoes.push(`fora do ICP (${String(fora).replace(/\\b|\//g, '')})`) }

  const porte = r.porte_empresa.toUpperCase()
  if (porte.includes('MICRO') || porte.includes('PEQUENO')) { score += 2; razoes.push('micro/pequena (ICP)') }
  else if (porte.includes('DEMAIS')) { score -= 1; razoes.push('porte DEMAIS') }

  const email = r.correio_eletronico.toLowerCase()
  if (email.includes('@')) {
    score += 1
    const d = dominio(email)
    if (WEBMAIL_ATIVO.includes(d)) { score += 3; razoes.push('gmail do dono (2,9% de bounce medido)') }
    else if (WEBMAIL_MODERNO.includes(d)) { score += 1; razoes.push('webmail moderno do dono') }
    else if (WEBMAIL_LEGADO.includes(d)) { score -= 3; razoes.push('webmail legado (23% de bounce medido)') }
    else { score -= 1; razoes.push('domínio próprio (provavelmente já tem site)') }
    if (ehProxy(email)) { score -= 6; razoes.push('e-mail de contador (não é o dono)') }
    if (ehGrupoGrande(email)) { score -= 10; razoes.push('grupo grande de concessionária') }
  } else { score -= 2; razoes.push('sem e-mail no cadastro') }

  // Idade: o pedido é "lojas recentes". Abertas de 2022 em diante já passaram
  // do primeiro ano (têm estoque e rotina) e ainda não resolveram o site.
  const ano = anoPelaRaiz(r.cnpj)
  const idade = ano == null ? null : hoje - ano
  if (ano == null) { razoes.push('idade indeterminada (raiz legada)') }
  else if (idade <= 1) { score -= 1; razoes.push(`abriu em ${ano} (muito recente)`) }
  else if (idade <= 4) { score += 3; razoes.push(`abriu em ${ano} (recente)`) }
  else if (idade <= 8) { score += 1; razoes.push(`abriu em ${ano}`) }
  else { score -= 1; razoes.push(`abriu em ${ano} (antiga)`) }

  // Capital social é número DECLARADO, não capital de giro real — micro LTDA
  // costuma declarar R$ 100 mil redondos independente do tamanho. Serve bem
  // como teto (corta o grupo grande) e mal como instrumento de precisão, por
  // isso a faixa central é larga e o porte continua pesando mais.
  const capital = Number(r.capital_social || 0)
  if (capital === 0) { /* não declarado em 3,7% da base: sem sinal */ }
  else if (capital < 5_000) { score -= 1; razoes.push('capital < R$ 5 mil (intermediação sem pátio?)') }
  else if (capital < 10_000) { score += 1; razoes.push('capital baixo') }
  else if (capital <= 300_000) { score += 2; razoes.push('capital de loja pequena (núcleo do ICP)') }
  else if (capital <= 600_000) { score += 1; razoes.push('capital de loja média') }
  else { score -= 2; razoes.push('capital alto') }

  const fantasia = r.nome_fantasia.trim().toUpperCase()
  if (fantasia && fantasia !== r.razao_social.trim().toUpperCase()) {
    score += 1
    razoes.push('tem nome fantasia (marca)')
  }

  return { score, reasons: razoes.join('; '), ano_abertura: ano ?? '' }
}

// ─── Subcomando: score ───────────────────────────────────────────────────────

async function cmdScore(args) {
  const input = args._[0]
  if (!input) fail('uso: prospect.mjs score <entrada.csv> [--out …] [--top N] [--exclude a.csv]')
  const top = Number(args.top) || 0
  const hoje = new Date().getFullYear()
  const excluded = args.exclude ? readExclusions(args.exclude) : { cnpjs: new Set(), emails: new Set() }

  const KEEP = Math.max(top * 25, 60_000) // cabe o ICP inteiro: contagem real, não truncada
  // Milhares empatam na nota máxima; desempatar por CNPJ puxaria sempre a mesma
  // ponta da fila (a raiz é cronológica). Hash estável = amostra sem viés e
  // reprodutível entre execuções.
  const chave = (cnpj) => {
    let h = 0x811c9dc5
    for (let i = 0; i < cnpj.length; i++) h = Math.imul(h ^ cnpj.charCodeAt(i), 0x01000193) >>> 0
    return h
  }
  const cmp = (a, b) => b.score - a.score || chave(a.cnpj) - chave(b.cnpj)
  let pool = []
  const prune = () => { pool.sort(cmp); if (pool.length > KEEP) pool.length = KEEP }

  const vistos = new Set()
  let linhas = 0, pulados = 0, ultimoCnpj = '', ultimoMantido = null
  const stats = { foraIcp: 0, naoLoja: 0, capitalAlto: 0, scoreBaixo: 0, porAno: {}, porCapital: {} }

  await streamDump(input, (r) => {
    linhas++
    if (!/^\d{14}$/.test(r.cnpj)) return
    // O dump traz uma linha por sócio. Fica com a primeira e completa o sócio
    // a partir das linhas irmãs quando a primeira veio sem ele.
    if (r.cnpj === ultimoCnpj) {
      if (ultimoMantido && !ultimoMantido.nome_socio && r.nome_socio) {
        ultimoMantido.nome_socio = r.nome_socio
        ultimoMantido.cnpj_cpf_socio = r.cnpj_cpf_socio
      }
      return
    }
    ultimoCnpj = r.cnpj
    ultimoMantido = null
    if (vistos.has(r.cnpj)) return
    vistos.add(r.cnpj)

    if (excluded.cnpjs.has(r.cnpj) || excluded.emails.has(r.correio_eletronico.toLowerCase())) { pulados++; return }
    if (!ehLojaCarro(r)) { stats.naoLoja++; return }
    if (foraDoIcp(r)) { stats.foraIcp++; return }
    if (capitalForaDoIcp(r)) { stats.capitalAlto++; return }

    const scored = { ...r, ...pontuar(r, hoje) }
    if (scored.score <= 0) { stats.scoreBaixo++; return }
    stats.porAno[scored.ano_abertura || 'indeterminado'] = (stats.porAno[scored.ano_abertura || 'indeterminado'] ?? 0) + 1
    const cap = Number(scored.capital_social || 0)
    const faixa = cap === 0 ? 'não declarado' : cap < 5_000 ? '< 5 mil' : cap < 10_000 ? '5–10 mil' : cap <= 300_000 ? '10–300 mil' : cap <= 600_000 ? '300–600 mil' : '600 mil–1 mi'
    stats.porCapital[faixa] = (stats.porCapital[faixa] ?? 0) + 1
    pool.push(scored)
    ultimoMantido = scored
    if (pool.length > KEEP * 4) prune()
  })
  prune()

  const out = args.out || join(HERE, 'prospects-ranked.csv')
  const escolhidos = top ? pool.slice(0, top) : pool
  const cols = ['score', 'reasons', 'ano_abertura', 'cnpj', 'razao_social', 'nome_fantasia', 'correio_eletronico', 'municipio', 'uf', 'porte_empresa', 'capital_social', 'cnpj_cpf_socio', 'nome_socio']
  writeFileSync(out, toCsv(escolhidos, cols))

  const comEmail = escolhidos.filter((r) => r.correio_eletronico.includes('@')).length
  console.log(`entrada:              ${linhas} linhas`)
  console.log(`CNPJs únicos:         ${vistos.size}`)
  console.log(`  não é loja de carro: ${stats.naoLoja}`)
  console.log(`  fora do ICP:         ${stats.foraIcp}`)
  console.log(`  capital >= R$ 1 mi:  ${stats.capitalAlto}`)
  console.log(`  score <= 0:          ${stats.scoreBaixo}`)
  console.log(`  já contatados:       ${pulados}`)
  console.log(`dentro do ICP:        ${pool.length}${pool.length >= KEEP ? '+ (pool truncado)' : ''}`)
  console.log(`escrito:              ${escolhidos.length} → ${out}`)
  console.log(`  com e-mail:         ${comEmail}`)
  console.log(`\nfaixa de score: ${escolhidos[escolhidos.length - 1]?.score}–${escolhidos[0]?.score}`)
  console.log('\npor ano de abertura (estimado pela raiz do CNPJ):')
  for (const [a, n] of Object.entries(stats.porAno).sort()) console.log(`  ${a}: ${n}`)
  console.log('\npor faixa de capital social:')
  for (const f of ['não declarado', '< 5 mil', '5–10 mil', '10–300 mil', '300–600 mil', '600 mil–1 mi']) {
    if (stats.porCapital[f]) console.log(`  ${f}: ${stats.porCapital[f]}`)
  }
}

// ─── Subcomando: enrich (parceiro chargefy: CPF + nome → e-mails) ────────────

async function cmdEnrich(args) {
  const input = args._[0]
  if (!input) fail('uso: prospect.mjs enrich <ranqueado.csv> [--out …] [--limit N] [--only-missing]')
  const key = env('CHARGEFY_API_KEY')
  if (!key) fail('CHARGEFY_API_KEY ausente no ambiente/.env')

  const records = readRecords(input)
  const cacheDir = join(HERE, '.cache')
  mkdirSync(cacheDir, { recursive: true })
  const cachePath = join(cacheDir, 'enrich.json')
  const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : {}

  let feitas = 0
  const limit = args.limit ? Number(args.limit) : Infinity
  for (const r of records) {
    if (feitas >= limit) break
    if (args['only-missing'] && r.correio_eletronico.includes('@')) continue
    const cpf = (r.cnpj_cpf_socio || '').trim()
    const nome = (r.nome_socio || '').trim()
    if (!cpf || !nome) continue
    const cacheKey = `${cpf}|${nome}`
    if (cache[cacheKey]) {
      const c = cache[cacheKey]
      r.email_best = c.best || ''
      r.email_best_score = c.bestScore || ''
      r.emails_all = (c.all || []).join(';')
      r.email_scores = Object.entries(c.scores || {}).map(([e, v]) => `${e}:${v}`).join(';')
      continue
    }
    try {
      const url = `https://identify.chargefy.io/person/search?cpf=${encodeURIComponent(cpf)}&nome=${encodeURIComponent(nome)}`
      const res = await fetch(url, { headers: { 'X-API-Key': key } })
      const body = await res.json().catch(() => ({}))
      const picked = melhoresEmails(body)
      cache[cacheKey] = { ...picked, at: new Date().toISOString(), status: res.status }
      r.email_best = picked.best || ''
      r.email_best_score = picked.bestScore || ''
      r.emails_all = picked.all.join(';')
      r.email_scores = Object.entries(picked.scores).map(([e, v]) => `${e}:${v}`).join(';')
      feitas++
      writeFileSync(cachePath, JSON.stringify(cache, null, 2))
      await sleep(400) // gentil com o parceiro
    } catch (e) {
      console.error(`falha ${cpf} ${nome}: ${e.message}`)
    }
  }

  const out = args.out || input.replace(/\.csv$/, '') + '-enriched.csv'
  const cols = ['score', 'reasons', 'ano_abertura', 'cnpj', 'razao_social', 'nome_fantasia', 'correio_eletronico', 'email_best', 'email_best_score', 'emails_all', 'email_scores', 'municipio', 'uf', 'porte_empresa', 'nome_socio']
  writeFileSync(out, toCsv(records, cols))
  console.log(`enriquecidas: ${feitas} novas consultas · ${out}`)
  console.log(`com e-mail pessoal: ${records.filter((r) => r.email_best).length}/${records.length}`)
}

/**
 * A resposta do parceiro traz pessoas[].emails[] com PRIORIDADE (1=melhor) e
 * EMAIL_SCORE ("BOM", "POTENCIALMENTE BOM", "RUIM"). Num disparo, "RUIM" é
 * bounce provável: escolhe o melhor score e, dentro dele, a menor prioridade.
 */
function melhoresEmails(body) {
  const rank = { BOM: 0, 'POTENCIALMENTE BOM': 1, RUIM: 2 }
  const list = []
  for (const p of body?.pessoas ?? []) {
    for (const e of p?.emails ?? []) {
      const email = String(e.EMAIL || '').toLowerCase().trim()
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) continue
      list.push({ email, score: String(e.EMAIL_SCORE || '').toUpperCase(), prio: Number(e.PRIORIDADE) || 99 })
    }
  }
  if (!list.length) {
    const found = new Set()
    const walk = (v) => {
      if (typeof v === 'string') (v.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || []).forEach((e) => found.add(e.toLowerCase()))
      else if (v && typeof v === 'object') Object.values(v).forEach(walk)
    }
    walk(body)
    return { best: [...found][0] || '', bestScore: '', all: [...found], scores: {} }
  }
  list.sort((a, b) => (rank[a.score] ?? 3) - (rank[b.score] ?? 3) || a.prio - b.prio)
  const usable = list.filter((e) => e.score !== 'RUIM')
  return {
    best: usable[0]?.email || '',
    bestScore: usable[0]?.score || '',
    all: [...new Set(list.map((e) => e.email))],
    scores: Object.fromEntries(list.map((e) => [e.email, e.score])),
  }
}

// ─── Subcomando: audience ────────────────────────────────────────────────────

/** TLDs institucionais: nunca mandar oferta comercial p/ órgão público/escola. */
const INSTITUCIONAL = ['.gov.br', '.jus.br', '.leg.br', '.mil.br', '.edu.br']
const ehInstitucional = (e) => INSTITUCIONAL.some((s) => e.split('@').pop().endsWith(s))

function cmdAudience(args) {
  const input = args._[0]
  if (!input) fail('uso: prospect.mjs audience <csv> [--out …] [--mode negocio|blend|empresa] [--limit N]\n       [--anos 2022,2023,2024] [--uf SP] [--min-score N] [--dominios gmail.com] [--exclude a.csv]')
  const mode = args.mode || 'negocio'
  const limit = Number(args.limit) || Infinity
  const excluded = args.exclude ? readExclusions(args.exclude) : { cnpjs: new Set(), emails: new Set() }

  // Recortes do ICP. Sem eles a audiência sai representativa do dump inteiro —
  // inclusive das lojas de 2016 com e-mail do terra, que é o oposto do alvo.
  const anos = args.anos ? new Set(String(args.anos).split(',').map((a) => a.trim())) : null
  const minScore = args['min-score'] ? Number(args['min-score']) : -Infinity
  const dominiosOk = args.dominios ? new Set(String(args.dominios).split(',').map((d) => d.trim().toLowerCase())) : null
  const ufsOk = args.uf ? new Set(String(args.uf).split(',').map((u) => u.trim().toUpperCase())) : null

  const records = readRecords(input)
  const seen = new Set()
  const porDominio = new Map()
  const out = []
  let descartados = 0, repetidos = 0, forcaFiltro = 0

  for (const r of records) {
    if (out.length >= limit) break
    if (anos && !anos.has(r.ano_abertura)) { forcaFiltro++; continue }
    if (ufsOk && !ufsOk.has((r.uf || '').toUpperCase())) { forcaFiltro++; continue }
    if (Number(r.score) < minScore) { forcaFiltro++; continue }
    const pessoal = (r.email_best || '').toLowerCase().trim()
    const empresa = (r.correio_eletronico || '').toLowerCase().trim()
    const valido = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)

    let email = '', source = ''
    if (mode === 'empresa') { email = empresa; source = 'empresa' }
    else if (mode === 'blend') {
      if (pessoal && ehWebmail(pessoal)) { email = pessoal; source = 'pessoal' }
      else if (valido(empresa)) { email = empresa; source = 'empresa' }
    } else {
      // negocio (padrão): o e-mail que o dono declarou para a EMPRESA vem
      // primeiro quando já é webmail — é a caixa dele e está ligada ao negócio.
      // No imoveis.plus o e-mail pessoal do parceiro bounçou 21% contra 2% do
      // e-mail do cadastro; por isso o pessoal só entra como último recurso e
      // apenas quando é uma caixa que sabidamente entrega.
      const scores = Object.fromEntries(
        (r.email_scores || '').split(';').filter(Boolean).map((par) => {
          const i = par.lastIndexOf(':')
          return [par.slice(0, i).toLowerCase(), par.slice(i + 1)]
        }),
      )
      const empresaRuim = scores[empresa] === 'RUIM'
      const pessoalEntregavel = pessoal && WEBMAIL_ATIVO.includes(dominio(pessoal))
      if (valido(empresa) && ehWebmail(empresa) && !empresaRuim) { email = empresa; source = 'empresa' }
      else if (pessoalEntregavel) { email = pessoal; source = 'pessoal' }
      else if (valido(empresa) && !empresaRuim) { email = empresa; source = 'empresa' }
    }

    if (!valido(email) || ehInstitucional(email)) { descartados++; continue }
    if (dominiosOk && !dominiosOk.has(dominio(email))) { forcaFiltro++; continue }
    if (excluded.emails.has(email) || excluded.cnpjs.has(r.cnpj)) { repetidos++; continue }
    if (seen.has(email)) continue
    // Um domínio corporativo costuma ser uma casa só: três e-mails para lá
    // geram reclamação e nenhuma resposta a mais.
    const d = dominio(email)
    if (!ehWebmail(email)) {
      const n = (porDominio.get(d) ?? 0) + 1
      porDominio.set(d, n)
      if (n > 1) { repetidos++; continue }
    }
    seen.add(email)
    const primeiro = (r.nome_socio || '').trim().split(/\s+/)[0] || ''
    out.push({
      email, source,
      first_name: primeiro ? primeiro[0] + primeiro.slice(1).toLowerCase() : '',
      razao_social: r.razao_social,
      nome_fantasia: r.nome_fantasia,
      municipio: r.municipio,
      uf: r.uf,
      ano_abertura: r.ano_abertura,
      score: r.score,
    })
  }
  const dest = args.out || join(HERE, 'audience-final.csv')
  writeFileSync(dest, toCsv(out, ['email', 'source', 'first_name', 'razao_social', 'nome_fantasia', 'municipio', 'uf', 'ano_abertura', 'score']))
  console.log(`modo: ${mode}`)
  console.log(`destinatários únicos: ${out.length} → ${dest}`)
  console.log(`  inbox pessoal:      ${out.filter((r) => r.source === 'pessoal').length}`)
  console.log(`  e-mail comercial:   ${out.length - out.filter((r) => r.source === 'pessoal').length}`)
  console.log(`  descartados (inválido/institucional): ${descartados}`)
  console.log(`  descartados (repetido/domínio):       ${repetidos}`)
  console.log(`  fora dos filtros (ano/score/domínio): ${forcaFiltro}`)
}

// ─── Subcomando: lotes ───────────────────────────────────────────────────────

/**
 * Fatia a audiência em lotes crescentes de aquecimento. O primeiro lote é
 * pequeno de propósito: se o bounce vier alto, você descobre com 15 e-mails
 * queimados, não com 100.
 */
function cmdLotes(args) {
  const input = args._[0]
  if (!input) fail('uso: prospect.mjs lotes <audiencia.csv> [--sizes 15,25,30,30] [--prefix lote]')
  const sizes = String(args.sizes || '15,25,30,30').split(',').map(Number)
  const prefix = args.prefix || join(HERE, 'lote')
  const records = readRecords(input)
  const cols = ['email', 'source', 'first_name', 'razao_social', 'nome_fantasia', 'municipio', 'uf', 'ano_abertura', 'score']
  let i = 0
  sizes.forEach((n, k) => {
    const fatia = records.slice(i, i + n)
    i += n
    const dest = `${prefix}-${k + 1}.csv`
    writeFileSync(dest, toCsv(fatia, cols))
    const gmail = fatia.filter((r) => dominio(r.email) === 'gmail.com').length
    console.log(`lote ${k + 1}: ${fatia.length} destinatários → ${dest}  (gmail: ${gmail}/${fatia.length})`)
  })
  if (i < records.length) console.log(`sobra não usada: ${records.length - i}`)
}

// ─── util ────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function env(name) {
  if (process.env[name]) return process.env[name]
  for (const file of [join(ROOT, '.env'), join(ROOT, '.env.local')]) {
    if (!existsSync(file)) continue
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = new RegExp(`^${name}=(.*)$`).exec(line.trim())
      if (m) return m[1].replace(/^["']|["']$/g, '')
    }
  }
  return null
}

function fail(msg) {
  console.error(`\x1b[31m✗ ${msg}\x1b[0m`)
  process.exit(1)
}

function parseArgs(argv) {
  const out = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) { out[key] = next; i++ } else out[key] = true
    } else out._.push(a)
  }
  return out
}

const [cmd, ...rest] = process.argv.slice(2)
const args = parseArgs(rest)
if (cmd === 'score') await cmdScore(args)
else if (cmd === 'enrich') await cmdEnrich(args)
else if (cmd === 'audience') cmdAudience(args)
else if (cmd === 'lotes') cmdLotes(args)
else fail('subcomandos: score | enrich | audience | lotes')
