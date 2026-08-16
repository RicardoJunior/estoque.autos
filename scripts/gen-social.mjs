// Gera as mídias sociais on-brand (Instagram/TikTok) a partir dos posts
// do blog. Saída: media/social/** (PNGs prontos para subir).
//   node scripts/gen-social.mjs
import sharp from "sharp";
import { writeFile, mkdir } from "node:fs/promises";

// ── paleta da marca ──
const BG = "#0a0b0d";
const AMBER = "#ff7a1a";
const DARK = "#160a02";
const INK = "#f4efe6";
const MUTE = "#9c9488";
const CARD = "#16140f";
const FONT = "Arial, Helvetica, sans-serif";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Marca (tile âmbar + chevrons) como grupo SVG posicionável. */
function mark(x, y, size) {
  const k = size / 32;
  return `<g transform="translate(${x} ${y}) scale(${k})">
    <rect width="32" height="32" rx="8" fill="${AMBER}"/>
    <path d="M9.5 10 15 16l-5.5 6M16 10l5.5 6L16 22" stroke="${DARK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>`;
}

/** wordmark "estoque.autos" em texto. */
function wordmark(x, y, size, tone = "light") {
  const c = tone === "light" ? INK : DARK;
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="800" letter-spacing="-1" fill="${c}">estoque<tspan fill="${AMBER}">.autos</tspan></text>`;
}

/**
 * Quebra `text` respeitando ~`max` caracteres, mas de forma BALANCEADA:
 * - cabe numa linha? uma linha só.
 * - senão, prefere 2 linhas equilibradas (menor diferença de tamanho),
 *   o que evita órfãos feios como "(e / certo)".
 * - só cai no greedy (3+ linhas) quando não couber em duas.
 */
function wrap(text, max) {
  const clean = String(text).replace(/\s+/g, " ").trim();
  if (clean.length <= max) return [clean];

  const words = clean.split(" ");
  // tenta a melhor quebra em DUAS linhas (ambas <= max, mais equilibrada)
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const l1 = words.slice(0, i).join(" ");
    const l2 = words.slice(i).join(" ");
    if (l1.length <= max && l2.length <= max) {
      const score = Math.abs(l1.length - l2.length);
      if (best === null || score < best.score) best = { score, l1, l2 };
    }
  }
  if (best) return [best.l1, best.l2];

  // texto longo: greedy (3+ linhas)
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) {
      if (cur) lines.push(cur);
      cur = w;
    } else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

function tspans(lines, x, size, lh) {
  return lines
    .map(
      (l, i) =>
        `<tspan x="${x}" dy="${i === 0 ? 0 : lh}">${esc(l)}</tspan>`,
    )
    .join("");
}

const render = (svg, w, h, path) =>
  sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${svg}</svg>`))
    .png()
    .toFile(path);

// ── Instagram feed (1080×1350) ──
const FW = 1080,
  FH = 1350;

function slideCover(post) {
  const titleLines = wrap(post.hook ?? post.title, 20);
  const fs = titleLines.length > 3 ? 86 : 100;
  return `
    <rect width="${FW}" height="${FH}" fill="${BG}"/>
    <rect x="0" y="0" width="${FW}" height="10" fill="${AMBER}"/>
    ${mark(80, 96, 64)}
    <text x="160" y="140" font-family="${FONT}" font-size="30" font-weight="800" letter-spacing="4" fill="${MUTE}">ESTOQUE.AUTOS · BLOG</text>
    <text x="80" y="560" font-family="${FONT}" font-size="${fs}" font-weight="800" fill="${INK}" letter-spacing="-2">${tspans(titleLines, 80, fs, fs * 1.06)}</text>
    <rect x="80" y="${600 + fs * (titleLines.length - 1) * 1.06}" width="120" height="8" rx="4" fill="${AMBER}"/>
    <text x="80" y="1250" font-family="${FONT}" font-size="34" font-weight="700" fill="${MUTE}">arraste para o lado  →</text>`;
}

function slideContent(n, heading, bullets) {
  const hLines = wrap(heading, 26);
  let y = 470;
  const bulletSvg = bullets
    .map((b) => {
      const lines = wrap(b, 34);
      const block = `<circle cx="98" cy="${y - 12}" r="9" fill="${AMBER}"/>` +
        `<text x="140" y="${y}" font-family="${FONT}" font-size="40" font-weight="600" fill="${INK}">${tspans(lines, 140, 40, 50)}</text>`;
      y += 60 + (lines.length - 1) * 50;
      return block;
    })
    .join("");
  return `
    <rect width="${FW}" height="${FH}" fill="${BG}"/>
    <text x="80" y="150" font-family="${FONT}" font-size="120" font-weight="800" fill="${AMBER}" opacity="0.25">${String(n).padStart(2, "0")}</text>
    <text x="80" y="300" font-family="${FONT}" font-size="60" font-weight="800" fill="${INK}" letter-spacing="-1">${tspans(hLines, 80, 60, 66)}</text>
    ${bulletSvg}
    ${mark(80, 1230, 44)}
    <text x="140" y="1262" font-family="${FONT}" font-size="30" font-weight="800" fill="${MUTE}">estoque<tspan fill="${AMBER}">.autos</tspan></text>`;
}

function slideCta() {
  return `
    <rect width="${FW}" height="${FH}" fill="${AMBER}"/>
    ${mark(80, 96, 72)}
    <text x="80" y="540" font-family="${FONT}" font-size="92" font-weight="800" fill="${DARK}" letter-spacing="-2">${tspans(["Salve este post", "e compartilhe", "com quem tem", "loja de carros."], 80, 92, 104)}</text>
    <text x="80" y="1080" font-family="${FONT}" font-size="40" font-weight="700" fill="${DARK}">O site da sua loja, pronto em minutos.</text>
    <text x="80" y="1150" font-family="${FONT}" font-size="44" font-weight="800" fill="${DARK}">estoque.autos</text>
    <text x="80" y="1250" font-family="${FONT}" font-size="34" font-weight="700" fill="#5a3410">@estoque.autos</text>`;
}

// ── Reel / TikTok cover (1080×1920) ──
const VW = 1080,
  VH = 1920;

function verticalCover(post) {
  const hookLines = wrap(post.hook ?? post.title, 18);
  const fs = hookLines.length > 3 ? 96 : 112;
  return `
    <rect width="${VW}" height="${VH}" fill="${BG}"/>
    <rect x="0" y="0" width="${VW}" height="12" fill="${AMBER}"/>
    ${mark(72, 140, 64)}
    <text x="156" y="184" font-family="${FONT}" font-size="30" font-weight="800" letter-spacing="4" fill="${MUTE}">ESTOQUE.AUTOS</text>
    <rect x="72" y="640" width="140" height="10" rx="5" fill="${AMBER}"/>
    <text x="72" y="820" font-family="${FONT}" font-size="${fs}" font-weight="800" fill="${INK}" letter-spacing="-2">${tspans(hookLines, 72, fs, fs * 1.05)}</text>
    <text x="72" y="1740" font-family="${FONT}" font-size="40" font-weight="700" fill="${MUTE}">${esc(post.reelCta ?? "salva pra não esquecer")}</text>`;
}

// ── capa/intro e destaques ──
function coverIntro() {
  return `
    <rect width="${FW}" height="${FH}" fill="${BG}"/>
    <rect x="0" y="0" width="${FW}" height="10" fill="${AMBER}"/>
    ${mark(430, 250, 220)}
    <text x="540" y="720" text-anchor="middle" font-family="${FONT}" font-size="84" font-weight="800" fill="${INK}" letter-spacing="-2">estoque<tspan fill="${AMBER}">.autos</tspan></text>
    <text x="540" y="820" text-anchor="middle" font-family="${FONT}" font-size="40" font-weight="700" fill="${MUTE}">${tspans(["O site da sua loja de carros,", "pronto em minutos."], 540, 40, 54)}</text>
    <text x="540" y="1230" text-anchor="middle" font-family="${FONT}" font-size="32" font-weight="700" fill="${MUTE}">FIPE · leads no WhatsApp · domínio próprio</text>`;
}

// ícones de linha (viewBox 24) desenhados — sem emoji (Pango não renderiza).
const ICONS = {
  bulb: `<path d="M9 18h6M10 21.5h4M12 2.5a6.5 6.5 0 0 0-4 11.6c.8.7 1 1.2 1 2.4h6c0-1.2.2-1.7 1-2.4A6.5 6.5 0 0 0 12 2.5z"/>`,
  ring: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.4"/><path d="M14.5 9.5 18 6M9.5 9.5 6 6M14.5 14.5 18 18M9.5 14.5 6 18"/>`,
  tag: `<path d="M20.4 13.3 13 20.7a2 2 0 0 1-2.8 0l-6-6A2 2 0 0 1 3.6 13V6a2 2 0 0 1 2-2h7a2 2 0 0 1 1.4.6l6.4 6.4a2 2 0 0 1 0 2.3z"/><circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none"/>`,
  car: `<path d="M3 13.5 5 8.5A2.5 2.5 0 0 1 7.3 7h9.4A2.5 2.5 0 0 1 19 8.5l2 5v4.5h-2.5M3 18v-4.5M3 18h2.5M21 18h-9M6.5 18a1.7 1.7 0 1 0 0-.1M16.5 18a1.7 1.7 0 1 0 0-.1M3 13.5h18"/>`,
};

function highlightCover(label, icon) {
  const S = 400;
  const k = 5.4; // 24→~130px
  const off = (S - 24 * k) / 2;
  return `
    <rect width="${S}" height="${S}" fill="${BG}"/>
    <circle cx="${S / 2}" cy="${S / 2 - 24}" r="130" fill="none" stroke="${AMBER}" stroke-width="6"/>
    <g transform="translate(${off} ${off - 24}) scale(${k})" fill="none" stroke="${AMBER}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" color="${AMBER}">${ICONS[icon]}</g>
    <text x="${S / 2}" y="${S - 44}" text-anchor="middle" font-family="${FONT}" font-size="36" font-weight="800" fill="${INK}" letter-spacing="1">${esc(label)}</text>`;
}

// ── conteúdo do primeiro lote (fatos dos posts do blog) ──
const POSTS = [
  {
    slug: "como-precificar-carros-usados",
    title: "Como precificar carros usados",
    hook: "Precificar carro usado sem chutar",
    reelCta: "salva antes de precificar o próximo",
    slides: [
      ["FIPE é referência, não preço final", [
        "A FIPE é a média — o mercado local manda no valor real.",
        "Pesquise 5–10 anúncios do mesmo carro na sua região.",
      ]],
      ["Precifique de fora para dentro", [
        "Comece pelo teto que o mercado paga.",
        "Desça até caber sua margem e o giro que você quer.",
      ]],
      ["Reprecifique toda semana", [
        "Carro parado perde valor: revise preços a cada 7 dias.",
        "Encalhou 60 dias? Corte antes que vire prejuízo.",
      ]],
    ],
  },
  {
    slug: "giro-de-estoque-carros-quantos-dias",
    title: "Giro de estoque",
    hook: "Quantos dias um carro pode ficar parado?",
    reelCta: "salva e confere seu pátio hoje",
    slides: [
      ["A régua dos 30 / 60 / 90 dias", [
        "Até 30 dias: saudável.",
        "60 dias: acenda o alerta e reveja o preço.",
        "90 dias: encalhado — decida agir.",
      ]],
      ["Carro parado custa caro", [
        "Capital preso, pátio ocupado e depreciação correndo.",
        "O prejuízo é invisível no papel, mas real no caixa.",
      ]],
      ["Tenha uma régua de ação", [
        "Defina gatilhos de preço por faixa de dias.",
        "Meça o giro mensal e ataque os campeões de pátio.",
      ]],
    ],
  },
  {
    slug: "como-vender-carros-pelo-whatsapp",
    title: "Vender pelo WhatsApp",
    hook: "O WhatsApp é seu maior vendedor",
    reelCta: "salva o roteiro de atendimento",
    slides: [
      ["Responda rápido (e certo)", [
        "Lead que espera esfria: responda em minutos.",
        "Tenha respostas rápidas prontas para as dúvidas comuns.",
      ]],
      ["Conduza a conversa", [
        "Faça perguntas, ofereça o próximo passo (foto, visita).",
        "Use etiquetas para saber em que ponto cada lead está.",
      ]],
      ["Follow-up é onde vende", [
        "A maioria das vendas vem do 2º ao 5º contato.",
        "Registre e volte — não deixe o lead morrer no vácuo.",
      ]],
    ],
  },
  {
    slug: "carros-consignados-como-funciona",
    title: "Carros consignados",
    hook: "Consignação: como funciona de verdade",
    reelCta: "salva antes de aceitar o próximo",
    slides: [
      ["O carro não é seu", [
        "Você vende em nome do dono — o veículo segue dele.",
        "Isso muda risco, garantia e responsabilidade.",
      ]],
      ["Contrato protege os dois lados", [
        "Preço mínimo, comissão, prazo e devolução por escrito.",
        "Sem contrato claro, a dor de cabeça é sua.",
      ]],
      ["Quando recusar", [
        "Documentação pendente, débito ou preço fora do mercado.",
        "Consignado bom gira; consignado ruim ocupa vaga.",
      ]],
    ],
  },
  {
    slug: "como-fotografar-carros-para-vender",
    title: "Fotografar carros",
    hook: "Fotos ruins afundam o anúncio",
    reelCta: "salva o passo a passo das fotos",
    slides: [
      ["Prepare antes de clicar", [
        "Carro limpo, fundo neutro e sem bagunça atrás.",
        "Luz da manhã ou fim de tarde — evite sol a pino.",
      ]],
      ["Siga uma sequência", [
        "3/4 da frente, laterais, traseira, rodas, interior, painel.",
        "A mesma ordem em todo carro padroniza a sua vitrine.",
      ]],
      ["Um vídeo de volta ao carro", [
        "Walkaround de 20–30s no celular aumenta a confiança.",
        "Mais cliques, menos 'ainda tá disponível?'.",
      ]],
    ],
  },
];

async function main() {
  const OUT = "media/social";
  await mkdir(`${OUT}/instagram`, { recursive: true });
  await mkdir(`${OUT}/reels-tiktok`, { recursive: true });
  await mkdir(`${OUT}/highlights`, { recursive: true });

  // capa/intro + destaques
  await render(coverIntro(), FW, FH, `${OUT}/instagram/00-capa-intro.png`);
  const highlights = [
    ["Dicas", "bulb"],
    ["Ajuda", "ring"],
    ["Planos", "tag"],
    ["Loja", "car"],
  ];
  for (const [label, icon] of highlights) {
    await render(highlightCover(label, icon), 400, 400, `${OUT}/highlights/${label.toLowerCase()}.png`);
  }

  // carrosséis + capas verticais por post
  for (const post of POSTS) {
    const dir = `${OUT}/instagram/${post.slug}`;
    await mkdir(dir, { recursive: true });
    await render(slideCover(post), FW, FH, `${dir}/1-capa.png`);
    let n = 1;
    for (const [heading, bullets] of post.slides) {
      n++;
      await render(slideContent(n - 1, heading, bullets), FW, FH, `${dir}/${n}-slide.png`);
    }
    await render(slideCta(), FW, FH, `${dir}/${post.slides.length + 2}-cta.png`);
    // capa vertical (reel/tiktok)
    await render(verticalCover(post), VW, VH, `${OUT}/reels-tiktok/${post.slug}-capa.png`);
  }

  console.log("mídias sociais geradas em media/social/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
