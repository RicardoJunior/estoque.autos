// Corte de logo no client via canvas — preserva transparência (PNG)
// e devolve um arquivo pequeno o bastante para a Server Action.

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Acima disso o resultado é reexportado menor (limite de body da action). */
const MAX_BLOB_BYTES = 1.4 * 1024 * 1024;
const EXPORT_SIZES = [1024, 640, 400];

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image_load_failed"));
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("export_failed"))),
      "image/png",
    );
  });
}

/**
 * Redimensiona uma foto para caber em `maxWidth` e exporta JPEG
 * (fotos de fundo da hero não precisam de transparência). Mantém a
 * proporção; nunca amplia.
 */
export async function downscaleImageToBlob(
  file: File,
  maxWidth = 1920,
): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const scale = Math.min(1, maxWidth / image.naturalWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas_unavailable");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("export_failed"))),
        "image/jpeg",
        0.85,
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Recorta `area` (em pixels da imagem original, como o react-easy-crop
 * reporta em onCropComplete) aplicando a rotação, e exporta PNG.
 */
export async function cropImageToBlob(
  file: File,
  area: CropArea,
  rotation = 0,
): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);

    // 1) desenha a imagem rotacionada num canvas do tamanho do bounding box
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const bboxW = Math.round(image.naturalWidth * cos + image.naturalHeight * sin);
    const bboxH = Math.round(image.naturalWidth * sin + image.naturalHeight * cos);

    const rotated = document.createElement("canvas");
    rotated.width = bboxW;
    rotated.height = bboxH;
    const rctx = rotated.getContext("2d");
    if (!rctx) throw new Error("canvas_unavailable");
    rctx.translate(bboxW / 2, bboxH / 2);
    rctx.rotate(rad);
    rctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

    // 2) extrai o recorte, reduzindo até caber no limite de bytes
    for (const maxSize of EXPORT_SIZES) {
      const scale = Math.min(1, maxSize / Math.max(area.width, area.height));
      const out = document.createElement("canvas");
      out.width = Math.max(1, Math.round(area.width * scale));
      out.height = Math.max(1, Math.round(area.height * scale));
      const ctx = out.getContext("2d");
      if (!ctx) throw new Error("canvas_unavailable");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        rotated,
        area.x,
        area.y,
        area.width,
        area.height,
        0,
        0,
        out.width,
        out.height,
      );
      const blob = await toBlob(out);
      if (blob.size <= MAX_BLOB_BYTES || maxSize === EXPORT_SIZES.at(-1)) {
        return blob;
      }
    }
    throw new Error("export_failed"); // inalcançável (o último tamanho sempre retorna)
  } finally {
    URL.revokeObjectURL(url);
  }
}
