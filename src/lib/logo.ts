// ============================================================
// Preparação de logo para upload (server).
//
// O corte/redimensionamento de rasters acontece NO CLIENT (canvas,
// preservando transparência — ver components/brand/crop.ts); aqui o
// server só valida: tipo declarado × magic bytes, tamanho e, para
// SVG, conteúdo perigoso. Nada passa pelo Cloudflare Images — logo
// funciona igual em `next dev` e no Worker.
// ============================================================

export class LogoError extends Error {}

const MAX_RASTER_BYTES = 4 * 1024 * 1024; // já vem cortado do client
const MAX_SVG_BYTES = 1 * 1024 * 1024;

export interface PreparedLogo {
  body: Buffer;
  ext: "svg" | "png" | "webp" | "avif" | "jpg";
  contentType: string;
}

/**
 * SVG é servido como está de um bucket público — rejeitamos qualquer
 * capacidade ativa (script, handlers, refs externas) em vez de tentar
 * reescrever. Logos exportados de Figma/Illustrator não usam nada disso.
 *
 * Em XML o prefixo de namespace é livre (<x:script> executa igual),
 * por isso as tags perigosas aceitam prefixo opcional; e o teste roda
 * também sobre uma cópia com entidades decodificadas, para pegar
 * `jav&#x61;script:` e afins.
 */
const DANGEROUS_TAG = "(?:[a-z0-9._-]+:)?";
const SVG_BLOCKLIST: RegExp[] = [
  new RegExp(`</?\\s*${DANGEROUS_TAG}script\\b`, "i"),
  new RegExp(`<\\s*${DANGEROUS_TAG}foreignobject\\b`, "i"),
  new RegExp(`<\\s*${DANGEROUS_TAG}iframe\\b`, "i"),
  new RegExp(`<\\s*${DANGEROUS_TAG}embed\\b`, "i"),
  new RegExp(`<\\s*${DANGEROUS_TAG}object\\b`, "i"),
  /\bon[a-z]+\s*=/i,
  /javascript\s*:/i,
  /<!entity/i,
  // href/src com protocolo ou // (refs externas); data:image/* é permitido
  /(?:xlink:href|href|src)\s*=\s*["']?\s*(?!data:image\/)(?:[a-z][a-z0-9+.-]*:|\/\/)/i,
  // CSS embutido não pode buscar nada de fora
  /@import/i,
  /url\s*\(\s*["']?\s*(?!#|data:image\/)(?:[a-z][a-z0-9+.-]*:|\/\/)/i,
];

/** Decodificação superficial de entidades — só para o teste de segurança. */
function decodeEntities(s: string): string {
  const safe = (code: number) =>
    Number.isFinite(code) && code > 0 && code < 0x110000
      ? String.fromCodePoint(code)
      : "";
  return s
    .replace(/&#x([0-9a-f]+);?/gi, (_, h: string) => safe(parseInt(h, 16)))
    .replace(/&#(\d+);?/g, (_, d: string) => safe(parseInt(d, 10)))
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, "&");
}

function prepareSvg(text: string): PreparedLogo {
  if (!/<svg[\s>]/i.test(text)) {
    throw new LogoError("Arquivo SVG inválido.");
  }
  for (const candidate of [text, decodeEntities(text)]) {
    for (const pattern of SVG_BLOCKLIST) {
      if (pattern.test(candidate)) {
        throw new LogoError(
          "Esse SVG contém scripts ou referências externas. Exporte um SVG simples ou envie em PNG.",
        );
      }
    }
  }
  return {
    body: Buffer.from(text, "utf-8"),
    ext: "svg",
    contentType: "image/svg+xml",
  };
}

function sniffRaster(
  bytes: Uint8Array,
): Exclude<PreparedLogo["ext"], "svg"> | null {
  const ascii = (start: number, len: number) =>
    String.fromCharCode(...bytes.subarray(start, start + len));
  if (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    ascii(1, 3) === "PNG"
  ) {
    return "png";
  }
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }
  if (bytes.length > 12 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    return "webp";
  }
  if (
    bytes.length > 12 &&
    ascii(4, 4) === "ftyp" &&
    ["avif", "avis"].includes(ascii(8, 4))
  ) {
    return "avif";
  }
  return null;
}

const RASTER_CONTENT_TYPES: Record<Exclude<PreparedLogo["ext"], "svg">, string> = {
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  jpg: "image/jpeg",
};

const MAX_HERO_BYTES = 2.5 * 1024 * 1024; // já vem redimensionada do client

/**
 * Imagem do carrossel da hero: raster (sem SVG — é foto de fundo),
 * redimensionada no client para ~1920px antes do upload.
 */
export async function prepareHeroImage(file: File): Promise<PreparedLogo> {
  if (file.size === 0) throw new LogoError("Arquivo vazio.");
  if (file.size > MAX_HERO_BYTES) {
    throw new LogoError("Imagem muito grande (máx. 2,5MB).");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = sniffRaster(bytes);
  if (!ext) {
    throw new LogoError("Formato não suportado. Envie JPG, PNG ou WebP.");
  }
  return {
    body: Buffer.from(bytes),
    ext,
    contentType: RASTER_CONTENT_TYPES[ext],
  };
}

/** Valida e normaliza o arquivo de logo enviado. Lança LogoError. */
export async function prepareLogo(file: File): Promise<PreparedLogo> {
  if (file.size === 0) throw new LogoError("Arquivo vazio.");

  const isSvg =
    file.type === "image/svg+xml" || /\.svg$/i.test(file.name ?? "");
  if (isSvg) {
    if (file.size > MAX_SVG_BYTES) {
      throw new LogoError("SVG muito grande (máx. 1MB).");
    }
    return prepareSvg(await file.text());
  }

  if (file.size > MAX_RASTER_BYTES) {
    throw new LogoError("Imagem muito grande (máx. 4MB).");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = sniffRaster(bytes);
  if (!ext) {
    throw new LogoError(
      "Formato não suportado. Envie SVG, PNG, WebP, AVIF ou JPEG.",
    );
  }
  return {
    body: Buffer.from(bytes),
    ext,
    contentType: RASTER_CONTENT_TYPES[ext],
  };
}
