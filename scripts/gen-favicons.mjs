// Gera o conjunto completo de ícones/favicons a partir do LogoMark
// (tile âmbar + chevrons). Sem dependência de fonte — só shapes.
//   node scripts/gen-favicons.mjs
import sharp from "sharp";
import { writeFile, mkdir } from "node:fs/promises";

const AMBER = "#ff7a1a";
const DARK = "#160a02";

/** Mark quadrado (tile arredondado + chevrons) — favicon/app icon. */
function markSquare({ bg = AMBER, radius = 8 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="${radius}" fill="${bg}"/>
  <path d="M9.5 10 15 16l-5.5 6M16 10l5.5 6L16 22" stroke="${DARK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;
}

/** Maskable (Android): âmbar full-bleed + chevrons na safe-zone central. */
function markMaskable() {
  // 32x32 base, chevrons reduzidos e centrados (~62% → margem de segurança)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="${AMBER}"/>
  <g transform="translate(16 16) scale(0.66) translate(-16 -16)">
    <path d="M9.5 10 15 16l-5.5 6M16 10l5.5 6L16 22" stroke="${DARK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
</svg>`;
}

/** Mark transparente (chevrons âmbar) — para uso sobre fundos escuros. */
function markGlyph(color = AMBER) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <path d="M9.5 10 15 16l-5.5 6M16 10l5.5 6L16 22" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;
}

const png = (svg, size) =>
  sharp(Buffer.from(svg)).resize(size, size, { fit: "contain" }).png().toBuffer();

/** Monta um .ico (PNG embutido) a partir de PNGs por tamanho. */
function buildIco(entries) {
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  const blobs = [];
  entries.forEach((e, i) => {
    const o = i * 16;
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o);
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o + 1);
    dir.writeUInt8(0, o + 2);
    dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(e.data.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += e.data.length;
    blobs.push(e.data);
  });
  return Buffer.concat([header, dir, ...blobs]);
}

async function main() {
  await mkdir("public/brand", { recursive: true });

  const square = markSquare();
  const maskable = markMaskable();

  // 1) favicon SVG (Next: src/app/icon.svg → <link rel=icon> escalável)
  await writeFile("src/app/icon.svg", square);
  // logo mark SVG (export do usuário)
  await writeFile("public/brand/logo-mark.svg", markSquare({ radius: 8 }));
  await writeFile("public/brand/logo-glyph.svg", markGlyph());

  // 2) apple-touch-icon 180 (Next: src/app/apple-icon.png)
  await writeFile("src/app/apple-icon.png", await png(square, 180));

  // 3) favicon.ico (16/32/48 PNG-in-ICO)
  const ico = buildIco([
    { size: 16, data: await png(square, 16) },
    { size: 32, data: await png(square, 32) },
    { size: 48, data: await png(square, 48) },
  ]);
  await writeFile("src/app/favicon.ico", ico);

  // 4) PWA / manifest icons
  await writeFile("public/icon-192.png", await png(square, 192));
  await writeFile("public/icon-512.png", await png(square, 512));
  await writeFile("public/icon-maskable-512.png", await png(maskable, 512));

  // 5) exports do logo (mark) em PNG, vários tamanhos e fundos
  for (const s of [64, 128, 256, 512, 1024]) {
    await writeFile(`public/brand/logo-mark-${s}.png`, await png(square, s));
    await writeFile(
      `public/brand/logo-glyph-${s}.png`,
      await png(markGlyph(), s),
    ); // chevrons âmbar transparentes
  }

  console.log("favicons + logo exports gerados.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
