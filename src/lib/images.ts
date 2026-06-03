import sharp from "sharp";

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // 12MB de entrada

export class ImageError extends Error {}

async function toBuffer(file: File): Promise<Buffer> {
  if (file.size === 0) throw new ImageError("Arquivo vazio");
  if (file.size > MAX_UPLOAD_BYTES)
    throw new ImageError("Imagem muito grande (máx. 12MB)");
  if (!file.type.startsWith("image/"))
    throw new ImageError("Envie um arquivo de imagem");
  return Buffer.from(await file.arrayBuffer());
}

/**
 * Foto de veículo: WebP otimizado, máx 1600x1200, mantém proporção.
 * WebP corta ~30% do tamanho vs JPEG na mesma qualidade.
 */
export async function processVehiclePhoto(file: File): Promise<Buffer> {
  const buf = await toBuffer(file);
  return sharp(buf)
    .rotate() // respeita EXIF
    .resize(1600, 1200, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

/**
 * Logo: WebP com fundo transparente preservado, máx 512x512.
 */
export async function processLogo(file: File): Promise<Buffer> {
  const buf = await toBuffer(file);
  return sharp(buf)
    .resize(512, 512, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90 })
    .toBuffer();
}
