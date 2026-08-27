#!/usr/bin/env node
/**
 * Sobe um lote como Broadcast do Resend e, opcionalmente, dispara.
 *
 *   node send-lote.mjs --lote lote-1.csv                 # cria RASCUNHO
 *   node send-lote.mjs --lote lote-1.csv --enviar        # cria e DISPARA
 *
 * Por que Broadcast e não /emails um a um: o Broadcast injeta o link de
 * descadastro por destinatário ({{{RESEND_UNSUBSCRIBE_URL}}}) e manda o header
 * List-Unsubscribe, que é o que o Gmail lê para oferecer "cancelar inscrição"
 * — sem isso, um e-mail frio para 125 caixas vira denúncia de spam.
 *
 * Cada lote tem a SUA audiência: reaproveitar a anterior faria o disparo sair
 * também para quem já recebeu.
 */

import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')

/**
 * ⚠️ Este é o domínio TRANSACIONAL do produto (login, recuperação de senha,
 * aviso de lead). O ideal é um subdomínio dedicado — `contato.estoque.autos` —
 * para que uma onda de reclamação numa campanha fria não derrube a entrega dos
 * e-mails que os lojistas pagantes dependem. Enquanto ele não existir e for
 * verificado no Resend, o disparo sai por aqui e o risco é real.
 */
const FROM = 'estoque.autos <noreply@estoque.autos>'
const REPLY_TO = 'contato@estoque.autos'
const ASSUNTO = 'Sua loja tem site? O comprador procura antes de chamar'
const APP = 'https://estoque.autos'
const UTM = 'utm_source=email&utm_medium=prospeccao&utm_campaign=sp_rodada1'

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

const fail = (m) => { console.error(`\x1b[31m✗ ${m}\x1b[0m`); process.exit(1) }

function parseArgs(argv) {
  const out = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const k = a.slice(2), n = argv[i + 1]
      if (n && !n.startsWith('--')) { out[k] = n; i++ } else out[k] = true
    } else out._.push(a)
  }
  return out
}

/** CSV simples — os arquivos de lote não têm vírgula dentro de campo. */
function readCsv(path) {
  const [head, ...rows] = readFileSync(path, 'utf8').trim().split('\n')
  const cols = head.split(',')
  return rows.map((line) => {
    const cells = line.split(',')
    return Object.fromEntries(cols.map((c, i) => [c, (cells[i] ?? '').trim()]))
  })
}

const KEY = env('RESEND_FULL_API_KEY') || env('RESEND_API_KEY')
if (!KEY) fail('sem chave Resend no .env')

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`https://api.resend.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (res.status === 401 && /restricted/.test(json.message || '')) {
    fail('A chave é restrita a envio e não gerencia audiência/broadcast.\n  Crie uma chave Full em resend.com/api-keys como RESEND_FULL_API_KEY.')
  }
  return { status: res.status, json }
}

const args = parseArgs(process.argv.slice(2))

// Atalho: dispara um rascunho que já existe, sem recriar audiência nem
// broadcast (recriar geraria um segundo broadcast e deixaria o primeiro órfão).
if (args.broadcast) {
  const id = String(args.broadcast)
  if (!args.enviar) fail('--broadcast só faz sentido junto com --enviar')
  const r = await api(`/broadcasts/${id}/send`, { method: 'POST' })
  if (r.status >= 400) fail(`falha no disparo: ${JSON.stringify(r.json)}`)
  console.log(`✓ DISPARADO — broadcast ${id}`)
  console.log(`  Acompanhe em https://resend.com/broadcasts/${id}`)
  process.exit(0)
}

const lotePath = join(HERE, String(args.lote || 'lote-1.csv'))
if (!existsSync(lotePath)) fail(`lote não encontrado: ${lotePath}`)
const nomeLote = basename(lotePath, '.csv')
const NOME_AUDIENCIA = args['audience-name'] || `Prospecção SP rodada 1 — ${nomeLote}`

// 1) Domínio precisa estar verificado antes de disparar.
console.log('▶ Domínio')
const dom = await api('/domains')
const d = (dom.json.data || []).find((x) => FROM.includes(x.name))
if (!d) fail(`nenhum domínio do remetente ${FROM} aparece nesta conta Resend`)
console.log(`  ${d.name}: ${d.status}${d.status === 'verified' ? ' ✓' : ' — verifique antes de disparar'}`)
if (args.enviar && d.status !== 'verified') fail('domínio não verificado; não vou disparar')

// 2) Audiência própria do lote.
console.log('▶ Audiência')
const list = await api('/audiences')
let audience = (list.json.data || []).find((a) => a.name === NOME_AUDIENCIA)
if (audience) console.log(`  reaproveitando "${NOME_AUDIENCIA}" (${audience.id})`)
else {
  const c = await api('/audiences', { method: 'POST', body: { name: NOME_AUDIENCIA } })
  if (!c.json.id) fail(`falha ao criar audiência: ${JSON.stringify(c.json)}`)
  audience = c.json
  console.log(`  criada "${NOME_AUDIENCIA}" (${audience.id})`)
}

// 3) Contatos.
console.log('▶ Contatos')
const contatos = readCsv(lotePath)
let add = 0, jaTinha = 0, erro = 0
for (const c of contatos) {
  if (!c.email) continue
  const r = await api(`/audiences/${audience.id}/contacts`, {
    method: 'POST',
    body: { email: c.email, first_name: c.first_name || undefined, unsubscribed: false },
  })
  if (r.status >= 200 && r.status < 300) add++
  else if (/already/i.test(r.json.message || '')) jaTinha++
  else { erro++; console.log(`  ⚠ ${c.email}: ${r.json.message || r.status}`) }
}
console.log(`  importados: ${add} · já existiam: ${jaTinha} · erros: ${erro} · no arquivo: ${contatos.length}`)

// 4) Broadcast.
const vars = {
  CTA_URL: `${APP}/cadastro?${UTM}&utm_content=cta`,
  DEMO_URL: `${APP}/demo/premium?${UTM}&utm_content=demo`,
}
// FIRST_NAME e RESEND_UNSUBSCRIBE_URL ficam intactos: quem substitui é o Resend,
// por destinatário, no momento do envio.
const render = (t) => t.replace(/\{\{\{(\w+)\}\}\}/g, (m, k) => vars[k] ?? m)
const html = render(readFileSync(join(HERE, 'email', 'oferta.html'), 'utf8'))
const text = render(readFileSync(join(HERE, 'email', 'oferta.txt'), 'utf8'))

console.log('▶ Broadcast')
const bc = await api('/broadcasts', {
  method: 'POST',
  body: {
    audience_id: audience.id,
    from: FROM,
    reply_to: REPLY_TO,
    subject: args.assunto || ASSUNTO,
    name: `${nomeLote} — ${ASSUNTO}`,
    html,
    text,
  },
})
if (!bc.json.id) fail(`falha ao criar broadcast: ${JSON.stringify(bc.json)}`)
console.log(`  criado: ${bc.json.id}`)

// 5) Disparo (só com --enviar).
if (!args.enviar) {
  console.log('\n✓ Rascunho pronto. NADA foi enviado.')
  console.log(`  Revise em https://resend.com/broadcasts/${bc.json.id}`)
  console.log(`  Para disparar: node send-lote.mjs --lote ${basename(lotePath)} --enviar`)
  process.exit(0)
}

const envio = await api(`/broadcasts/${bc.json.id}/send`, { method: 'POST' })
if (envio.status >= 400) fail(`falha no disparo: ${JSON.stringify(envio.json)}`)
console.log(`\n✓ DISPARADO para ${contatos.length} destinatários — broadcast ${bc.json.id}`)
console.log(`  Acompanhe entrega, bounce e reclamação em https://resend.com/broadcasts/${bc.json.id}`)
