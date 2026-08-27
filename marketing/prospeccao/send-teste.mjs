#!/usr/bin/env node
/**
 * Manda UM e-mail de teste com a peça de prospecção, para você mesmo ver como
 * chega na caixa. Não toca na audiência, não manda para lista nenhuma.
 *
 *   RESEND_API_KEY=re_xxx node send-teste.mjs --to voce@dominio.com
 *   node send-teste.mjs --to voce@dominio.com --nome Ricardo --from "estoque.autos <ola@contato.estoque.autos>"
 *
 * O disparo real NÃO sai daqui: vai por Resend Broadcasts, que é quem injeta
 * o link de descadastro por destinatário. Ver README.md.
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')

const ASSUNTO = 'Sua loja tem site? O comprador procura antes de chamar'

/**
 * O remetente ideal é o subdomínio dedicado (`contato.estoque.autos`), para
 * isolar a reputação do domínio transacional. Enquanto ele não existir, o
 * teste sai pelo remetente do produto — que já está verificado no Resend.
 */
const FROM_PADRAO = 'estoque.autos <noreply@estoque.autos>'

const APP = 'https://estoque.autos'
const UTM = 'utm_source=email&utm_medium=prospeccao&utm_campaign=sp_rodada1'

/**
 * Dados do remetente exigidos pela LGPD no rodapé de e-mail frio. Ainda não
 * estão no repositório — preencha antes do disparo real.
 */
const REMETENTE = {
  RAZAO_SOCIAL_REMETENTE: process.env.REMETENTE_RAZAO || '⚠️ PREENCHER razão social',
  CNPJ_REMETENTE: process.env.REMETENTE_CNPJ || '⚠️ PREENCHER',
  ENDERECO_REMETENTE: process.env.REMETENTE_ENDERECO || '⚠️ PREENCHER endereço',
}

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

const args = parseArgs(process.argv.slice(2))
const to = args.to
if (!to) {
  console.error('✗ uso: node send-teste.mjs --to voce@dominio.com [--nome Ricardo]')
  process.exit(1)
}

const key = env('RESEND_API_KEY')
if (!key) {
  console.error('✗ RESEND_API_KEY ausente.')
  console.error('  Não está no .env nem no .env.local deste projeto. Existe um secret com esse')
  console.error('  nome no Worker do Cloudflare, mas secret de Worker é write-only.')
  console.error('  Rode assim:  RESEND_API_KEY=re_xxx node send-teste.mjs --to ' + to)
  process.exit(1)
}

/** Substitui os {{{PLACEHOLDERS}}} do template pelos valores do teste. */
function render(tpl, vars) {
  return tpl.replace(/\{\{\{(\w+)\}\}\}/g, (_, k) => vars[k] ?? `{{{${k}}}}`)
}

const vars = {
  FIRST_NAME: args.nome || 'Ricardo',
  CTA_URL: `${APP}/cadastro?${UTM}&utm_content=cta`,
  DEMO_URL: `${APP}/demo/premium?${UTM}&utm_content=demo`,
  // No disparo real quem injeta é o Resend Broadcasts, por destinatário.
  RESEND_UNSUBSCRIBE_URL: '#exemplo-de-descadastro',
  ...REMETENTE,
}

const html = render(readFileSync(join(HERE, 'email', 'oferta.html'), 'utf8'), vars)
const text = render(readFileSync(join(HERE, 'email', 'oferta.txt'), 'utf8'), vars)

const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: args.from || FROM_PADRAO,
    to: [to],
    subject: args.assunto || `[TESTE] ${ASSUNTO}`,
    html,
    text,
    ...(args['reply-to'] ? { reply_to: args['reply-to'] } : {}),
  }),
})

const body = await res.json().catch(() => ({}))
if (!res.ok) {
  console.error(`✗ Resend devolveu ${res.status}:`, JSON.stringify(body))
  process.exit(1)
}
console.log(`✓ enviado para ${to} — id ${body.id}`)
console.log(`  remetente: ${args.from || FROM_PADRAO}`)
console.log(`  assunto:   ${args.assunto || `[TESTE] ${ASSUNTO}`}`)
if (REMETENTE.CNPJ_REMETENTE.startsWith('⚠️')) {
  console.log('\n⚠️  O rodapé foi com os dados do remetente por preencher (razão social,')
  console.log('   CNPJ e endereço). Isso é exigência de LGPD no disparo real.')
}
