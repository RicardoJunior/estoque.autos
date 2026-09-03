import { getCloudflareContext } from "@opennextjs/cloudflare";

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // 12MB de entrada

export class ImageError extends Error {}

function validate(file: File): void {
  if (file.size === 0) throw new ImageError("Arquivo vazio");
  if (file.size > MAX_UPLOAD_BYTES)
    throw new ImageError("Imagem muito grande (máx. 12MB)");
  if (!file.type.startsWith("image/"))
    throw new ImageError("Envie um arquivo de imagem");
}

type OutputFormat = "image/webp" | "image/jpeg";

/**
 * Redimensiona + converte usando o binding Cloudflare Images
 * (env.IMAGES). Substitui o `sharp`, que é binário nativo (libvips) e NÃO
 * roda no Cloudflare Worker.
 *
 * - `fit: "scale-down"` nunca amplia (equivale ao withoutEnlargement do sharp);
 * - a orientação EXIF é respeitada pelo próprio binding;
 * - CADA chamada conta como 1 transformação na cota do Cloudflare Images
 *   (5.000/mês no grátis) — por isso só processamos no UPLOAD, nunca por
 *   request de página.
 */
async function transform(
  file: File,
  width: number,
  height: number,
  quality: number,
  format: OutputFormat,
): Promise<Buffer> {
  validate(file);
  const { env } = getCloudflareContext();
  // O binding IMAGES é opcional no tipo do OpenNext; em produção sempre existe
  // (declarado no wrangler.jsonc). No `next dev` ele pode faltar — aí use
  // `npm run preview` para testar upload de imagem no Worker de verdade.
  if (!env.IMAGES) {
    throw new ImageError(
      "Processamento de imagem indisponível (binding IMAGES ausente). " +
        "Rode `npm run preview` em vez de `next dev` para testar uploads.",
    );
  }
  const transformed = await env.IMAGES.input(file.stream())
    .transform({ width, height, fit: "scale-down" })
    .output({ format, quality });
  const arrayBuffer = await transformed.response().arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/** Foto de veículo: WebP otimizado, máx 1600x1200, mantém proporção. */
export const processVehiclePhoto = (file: File): Promise<Buffer> =>
  transform(file, 1600, 1200, 80, "image/webp");

/**
 * Variante para os portais: JPEG 1920×1440 q85 (Webmotors recomenda
 * 1920×1440; o Mercado Livre aceita só JPG/PNG até 1920). Falha aqui
 * não bloqueia o upload — o adapter usa `jpeg_url ?? url`.
 */
export const processVehiclePhotoJpeg = (file: File): Promise<Buffer> =>
  transform(file, 1920, 1440, 85, "image/jpeg");

/** Logo: WebP com transparência preservada, máx 512x512. */
export const processLogo = (file: File): Promise<Buffer> =>
  transform(file, 512, 512, 90, "image/webp");
