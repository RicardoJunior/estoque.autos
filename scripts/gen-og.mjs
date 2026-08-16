// Gera a imagem Open Graph / Twitter da plataforma (1200×630) em PNG
// estático — servida por convenção do Next (src/app/opengraph-image.png e
// twitter-image.png). PNG estático = zero runtime next/og no Worker.
//   node scripts/gen-og.mjs
import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const BG = "#0a0b0d";
const AMBER = "#ff7a1a";
const DARK = "#160a02";
const INK = "#f4efe6";
const MUTE = "#9c9488";
const FONT = "Arial, Helvetica, sans-serif";

const W = 1200,
  H = 630;

function mark(x, y, size) {
  const k = size / 32;
  return `<g transform="translate(${x} ${y}) scale(${k})">
    <rect width="32" height="32" rx="8" fill="${AMBER}"/>
    <path d="M9.5 10 15 16l-5.5 6M16 10l5.5 6L16 22" stroke="${DARK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${AMBER}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${AMBER}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect x="0" y="0" width="${W}" height="10" fill="${AMBER}"/>
  <!-- brilho de faróis -->
  <ellipse cx="900" cy="300" rx="520" ry="360" fill="url(#glow)"/>
  ${mark(80, 70, 60)}
  <text x="158" y="116" font-family="${FONT}" font-size="34" font-weight="800" letter-spacing="-1" fill="${INK}">estoque<tspan fill="${AMBER}">.autos</tspan></text>

  <text x="80" y="250" font-family="${FONT}" font-size="26" font-weight="800" letter-spacing="4" fill="${MUTE}">PLATAFORMA PARA LOJAS DE VEÍCULOS</text>
  <text x="78" y="360" font-family="${FONT}" font-size="82" font-weight="800" letter-spacing="-3" fill="${INK}">O site da sua loja de</text>
  <text x="78" y="452" font-family="${FONT}" font-size="82" font-weight="800" letter-spacing="-3" fill="${INK}">carros, <tspan fill="${AMBER}">pronto em minutos.</tspan></text>

  <text x="80" y="558" font-family="${FONT}" font-size="30" font-weight="600" fill="${MUTE}">Tabela FIPE no cadastro · leads no WhatsApp · domínio próprio</text>
</svg>`;

const buf = await sharp(Buffer.from(svg)).png().toBuffer();
await writeFile("src/app/opengraph-image.png", buf);
await writeFile("src/app/twitter-image.png", buf);
// cópia pública com URL estável (${SITE_URL}/og.png) para image de JSON-LD
await writeFile("public/og.png", buf);
await writeFile(
  "src/app/opengraph-image.alt.txt",
  "estoque.autos — o site da sua loja de carros, pronto em minutos.",
);
await writeFile(
  "src/app/twitter-image.alt.txt",
  "estoque.autos — o site da sua loja de carros, pronto em minutos.",
);
console.log("OG/Twitter image gerada (1200×630).");
