/**
 * Motor de renderização dos carrosséis de Instagram do estoque.autos.
 *
 * Mesma identidade das artes de anúncio (marketing/artes/fontes/base.css):
 * fundo quase-preto, âmbar #ff7a1a, Anton nos títulos e Archivo no corpo.
 * Saída 1080×1350 (4:5) via Chrome headless — as fontes vêm do Google Fonts,
 * então precisa de rede na primeira geração.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const HERE = dirname(fileURLToPath(import.meta.url))
export const ROOT = resolve(HERE, '../../..')
export const THUMBS = join(ROOT, 'public/demo/thumbs')
export const SHOTS = join(ROOT, 'marketing/artes/fontes')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const W = 1080
const H = 1350

const MARK = (size = 40, bg = '#ff7a1a', ink = '#160a02') =>
  `<svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="${bg}"/><path d="M9.5 10 15 16l-5.5 6M16 10l5.5 6L16 22" stroke="${ink}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`

const CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
:root {
  --bg: #07080a; --bg2: #0d0f13; --card: #15171c;
  --ink: #f4f1ea; --muted: #9a9d97;
  --amber: #ff7a1a; --amber-ink: #160a02;
  --line: rgba(255,255,255,.09);
}
html, body { width: ${W}px; height: ${H}px; background: var(--bg); }
body { font-family: "Archivo", system-ui, sans-serif; color: var(--ink); -webkit-font-smoothing: antialiased; }
.art { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; display: flex; flex-direction: column; padding: 84px; }
.glow { position: absolute; pointer-events: none; filter: blur(90px); opacity: .55; border-radius: 50%; background: radial-gradient(circle, rgba(255,122,26,.55), rgba(255,122,26,0) 70%); }

/* topo */
.head { display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 2; }
.logo { display: inline-flex; align-items: center; gap: 16px; font-size: 32px; font-weight: 700; letter-spacing: -.01em; }
.logo i { font-style: normal; color: var(--amber); }
.pos { font-size: 24px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--muted); }

/* miolo */
.mid { flex: 1; display: flex; flex-direction: column; justify-content: center; position: relative; z-index: 2; }
.eyebrow { align-self: flex-start; display: inline-flex; align-items: center; gap: 12px; border: 1.5px solid var(--line); border-radius: 999px; padding: 11px 22px; font-size: 22px; font-weight: 600; letter-spacing: .14em; color: var(--muted); text-transform: uppercase; background: rgba(255,255,255,.02); }
.eyebrow .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--amber); box-shadow: 0 0 14px var(--amber); }
.h { font-family: "Anton", sans-serif; font-weight: 400; text-transform: uppercase; line-height: 1.02; letter-spacing: .004em; margin-top: 34px; }
.h em { font-style: normal; color: var(--amber); text-shadow: 0 0 60px rgba(255,122,26,.45); }
.rule { width: 132px; height: 8px; background: var(--amber); border-radius: 4px; margin-top: 38px; }
.sub { color: var(--muted); font-size: 34px; line-height: 1.42; margin-top: 34px; max-width: 880px; }
.sub strong { color: var(--ink); font-weight: 600; }

/* listas */
.pts { margin-top: 46px; display: flex; flex-direction: column; gap: 26px; }
.pt { display: flex; gap: 26px; align-items: flex-start; }
.pt .n { font-size: 24px; font-weight: 700; letter-spacing: .1em; color: var(--amber); padding-top: 10px; min-width: 46px; }
.pt .tx { font-size: 34px; line-height: 1.38; color: var(--muted); }
.pt .tx strong { color: var(--ink); font-weight: 600; }
.pt .tick { color: var(--amber); font-size: 34px; font-weight: 700; padding-top: 2px; }

/* cards de dado */
.cards { margin-top: 44px; display: flex; flex-direction: column; gap: 20px; }
.cd { background: var(--card); border: 1.5px solid var(--line); border-radius: 24px; padding: 30px 38px; }
.cd .lbl { font-size: 23px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
.cd .big { font-family: "Anton", sans-serif; font-size: 66px; line-height: 1.05; margin-top: 6px; }
.cd .note { font-size: 26px; line-height: 1.35; color: var(--muted); margin-top: 8px; }
.cd.on { background: linear-gradient(135deg, rgba(255,122,26,.16), rgba(255,122,26,.05)); border: 2px solid rgba(255,122,26,.55); }
.cd.on .lbl { color: var(--amber); }
.cd.on .note strong { color: var(--ink); }

/* mockups */
.browser { border-radius: 22px; overflow: hidden; background: #1b1e25; box-shadow: 0 40px 120px rgba(0,0,0,.6), inset 0 0 0 2px rgba(255,255,255,.07); margin-top: 46px; }
.browser .bar { display: flex; align-items: center; gap: 10px; padding: 18px 22px; background: #101318; }
.browser .bar .r { width: 14px; height: 14px; border-radius: 50%; background: #2a2e36; }
.browser .bar .url { margin-left: 14px; background: #07080a; border-radius: 10px; padding: 8px 18px; font-size: 22px; color: var(--muted); }
.browser .bar .url i { font-style: normal; color: var(--amber); font-weight: 600; }
.browser .shot { overflow: hidden; }
.browser img { display: block; width: 100%; }
.phone { position: relative; width: 424px; flex: none; border-radius: 52px; background: #1b1e25; padding: 14px; box-shadow: 0 40px 120px rgba(0,0,0,.65), inset 0 0 0 2px rgba(255,255,255,.08); }
.phone .screen { border-radius: 40px; overflow: hidden; }
.phone .screen img { display: block; width: 100%; }
.phone .notch { position: absolute; top: 28px; left: 50%; transform: translateX(-50%); width: 120px; height: 30px; border-radius: 20px; background: #07080a; }
.grid { margin-top: 44px; display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.grid figure { border: 1.5px solid var(--line); border-radius: 18px; overflow: hidden; background: var(--card); }
.grid img { display: block; width: 100%; height: 176px; object-fit: cover; object-position: top; }
.grid figcaption { font-size: 22px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); padding: 14px 18px; }

/* rodapé */
.foot { display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 2; padding-top: 44px; }
.swipe { font-size: 29px; font-weight: 600; color: var(--muted); }
.swipe i { font-style: normal; color: var(--amber); }
.cta { display: inline-flex; align-items: center; gap: 14px; background: var(--amber); color: var(--amber-ink); font-weight: 700; font-size: 30px; border-radius: 999px; padding: 20px 34px; box-shadow: 0 12px 48px rgba(255,122,26,.38); }
.tag { font-size: 27px; font-weight: 600; color: var(--muted); }

/* slide final âmbar */
body.final { background: var(--amber); color: var(--amber-ink); }
body.final .art { background: var(--amber); }
body.final .logo i { color: var(--amber-ink); opacity: .55; }
body.final .logo svg rect { fill: var(--amber-ink); }
body.final .logo svg path { stroke: var(--amber); }
body.final .pos, body.final .swipe { color: rgba(22,10,2,.6); }
body.final .eyebrow { border-color: rgba(22,10,2,.28); color: rgba(22,10,2,.72); background: rgba(255,255,255,.14); }
body.final .eyebrow .dot { background: var(--amber-ink); box-shadow: none; }
body.final .h em { color: #fff; text-shadow: none; }
body.final .rule { background: var(--amber-ink); }
body.final .sub { color: rgba(22,10,2,.78); }
body.final .sub strong { color: var(--amber-ink); }
body.final .pt .tx { color: rgba(22,10,2,.78); }
body.final .pt .n, body.final .pt .tick { color: var(--amber-ink); }
body.final .pt .tx strong { color: var(--amber-ink); }
body.final .cta { background: var(--amber-ink); color: var(--amber); box-shadow: none; }
`

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;500;600;700&display=swap" rel="stylesheet">`

const logo = (label) =>
  `<span class="logo">${MARK(38)}<span>estoque<i>.autos</i></span></span>${label ? `<span class="pos">${label}</span>` : '<span></span>'}`

const page = (cls, inner) =>
  `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">${FONTS}<style>${CSS}</style></head><body class="${cls}"><div class="art">${inner}</div></body></html>`

const pts = (items) =>
  `<div class="pts">${items
    .map((t, i) =>
      typeof t === 'string' && t.startsWith('•')
        ? `<div class="pt"><span class="tick">→</span><span class="tx">${t.slice(1).trim()}</span></div>`
        : `<div class="pt"><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="tx">${t}</span></div>`,
    )
    .join('')}</div>`

const glow = (s) => s ?? '<div class="glow" style="width:640px;height:640px;right:-250px;top:-200px"></div>'

/** Um slide -> HTML. `s.kind` escolhe o layout. */
export function render(s, i, total) {
  const pos = s.kind === 'capa' ? (s.label ?? '') : `${i + 1}/${total}`
  const head = `<div class="head">${logo(pos)}</div>`
  const foot = (left, right) => `<div class="foot"><span class="swipe">${left ?? ''}</span>${right ?? '<span></span>'}</div>`
  const eyebrow = s.eyebrow ? `<span class="eyebrow"><span class="dot"></span>${s.eyebrow}</span>` : ''
  const title = (size) => `<div class="h" style="font-size:${size}px">${s.title}</div>`
  const sub = s.sub ? `<p class="sub">${s.sub}</p>` : ''

  switch (s.kind) {
    case 'capa':
      return page('', `${glow(s.glow)}${head}<div class="mid">${eyebrow}${title(s.size ?? 92)}<div class="rule"></div>${sub}</div>${foot('arraste <i>→</i>', `<span class="tag">${s.tag ?? 'estoque.autos'}</span>`)}`)
    case 'text':
      return page('', `${glow('<div class="glow" style="width:560px;height:560px;left:-260px;bottom:-220px"></div>')}${head}<div class="mid">${eyebrow}${title(s.size ?? 72)}${sub}</div>${foot(s.foot)}`)
    case 'list':
      return page('', `${glow('<div class="glow" style="width:520px;height:520px;right:-240px;bottom:-200px"></div>')}${head}<div class="mid">${eyebrow}${title(s.size ?? 66)}${sub}${pts(s.items)}</div>${foot(s.foot)}`)
    case 'cards':
      return page('', `${glow('<div class="glow" style="width:520px;height:520px;right:-240px;bottom:-200px"></div>')}${head}<div class="mid">${eyebrow}${title(s.size ?? 66)}<div class="cards">${s.cards.map((c) => `<div class="cd${c.on ? ' on' : ''}"><span class="lbl">${c.lbl}</span><div class="big">${c.big}</div>${c.note ? `<div class="note">${c.note}</div>` : ''}</div>`).join('')}</div></div>${foot(s.foot)}`)
    case 'browser':
      return page('', `${glow()}${head}<div class="mid">${eyebrow}${title(s.size ?? 66)}${sub}<div class="browser"><div class="bar"><span class="r"></span><span class="r"></span><span class="r"></span><span class="url">${s.url}</span></div><div class="shot" style="height:${s.height ?? 420}px"><img src="${s.image}"></div></div></div>${foot(s.foot)}`)
    case 'phone':
      return page('', `${glow()}${head}<div class="mid" style="flex-direction:row;align-items:center;gap:54px"><div style="flex:1">${eyebrow}${title(s.size ?? 62)}<p class="sub" style="font-size:30px">${s.sub}</p></div><div class="phone"><div class="screen"><img src="${s.image}"></div></div></div>${foot(s.foot)}`)
    case 'grid':
      return page('', `${glow()}${head}<div class="mid">${eyebrow}${title(s.size ?? 62)}<div class="grid">${s.items.map(([id, nome]) => `<figure><img src="${THUMBS}/${id}.webp"><figcaption>${nome}</figcaption></figure>`).join('')}</div></div>${foot(s.foot)}`)
    case 'final':
      return page('final', `${head}<div class="mid">${eyebrow}${title(s.size ?? 76)}<div class="rule"></div>${sub}${s.items ? pts(s.items) : ''}</div>${foot(s.foot ?? 'link na bio', `<span class="cta">estoque.autos →</span>`)}`)
    default:
      throw new Error(`slide desconhecido: ${s.kind}`)
  }
}

/** Gera `dir/<nome>.html` + `.png` para cada slide e escreve a legenda. */
export function buildPost(dir, post) {
  mkdirSync(dir, { recursive: true })
  post.slides.forEach((slide, i) => {
    const nome = post.names?.[i] ?? `slide-${i + 1}`
    const html = join(dir, `${nome}.html`)
    const png = join(dir, `${nome}.png`)
    writeFileSync(html, render(slide, i, post.slides.length))
    execFileSync(CHROME, [
      '--headless', '--disable-gpu', '--hide-scrollbars',
      `--window-size=${W},${H}`, '--force-device-scale-factor=1',
      '--virtual-time-budget=8000', `--screenshot=${png}`, `file://${html}`,
    ], { stdio: 'ignore' })
  })
  if (post.legenda) writeFileSync(join(dir, 'legenda.md'), post.legenda.trim() + '\n')
}
