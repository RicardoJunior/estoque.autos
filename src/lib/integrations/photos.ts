import type { SupabaseClient } from "@supabase/supabase-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { uploadPublic } from "../storage";
import type { Vehicle, VehiclePhoto } from "../types";

// ============================================================
// Variante JPEG 1920×1440 das fotos (portais: ML não aceita WebP,
// Webmotors recomenda 1920×1440). Gerada no upload (images.ts) e,
// para fotos antigas, aqui no worker a partir do WebP público —
// o binding IMAGES só existe dentro do Worker, então o "backfill"
// é um job (photos_jpeg) e não um script.
// ============================================================

export const JPEG_WIDTH = 1920;
export const JPEG_HEIGHT = 1440;
export const JPEG_QUALITY = 85;

function imagesBinding() {
  try {
    const { env } = getCloudflareContext();
    return env.IMAGES ?? null;
  } catch {
    return null;
  }
}

export function jpegPathFor(path: string): string {
  return path.replace(/\.webp$/i, "") + ".jpg";
}

/** Converte uma imagem já hospedada (URL pública) para JPEG 1920×1440. */
async function fetchAsJpeg(url: string): Promise<Buffer | null> {
  const images = imagesBinding();
  if (!images) return null;
  const res = await fetch(url);
  if (!res.ok || !res.body) return null;
  const out = await images
    .input(res.body)
    .transform({ width: JPEG_WIDTH, height: JPEG_HEIGHT, fit: "scale-down" })
    .output({ format: "image/jpeg", quality: JPEG_QUALITY });
  return Buffer.from(await (await out.response()).arrayBuffer());
}

/**
 * Garante `jpeg_url` em todas as fotos do veículo. Devolve o array
 * atualizado (e grava no banco). Sem binding (next dev) devolve como
 * está — o adapter usa `jpeg_url ?? url`.
 */
export async function ensureJpegVariants(
  admin: SupabaseClient,
  vehicle: Pick<Vehicle, "id" | "tenant_id" | "photos">,
  max = 30,
): Promise<VehiclePhoto[]> {
  const photos = vehicle.photos ?? [];
  const pending = photos.filter((p) => !p.jpeg_url && p.path).slice(0, max);
  if (pending.length === 0 || !imagesBinding()) return photos;

  const done = new Map<string, { jpeg_path: string; jpeg_url: string }>();
  for (const p of pending) {
    try {
      const buf = await fetchAsJpeg(p.url);
      if (!buf) continue;
      const jpeg_path = jpegPathFor(p.path);
      const jpeg_url = await uploadPublic(admin, "vehicle-photos", jpeg_path, buf, "image/jpeg");
      done.set(p.id, { jpeg_path, jpeg_url });
    } catch (err) {
      console.error("photos_jpeg falhou", vehicle.id, p.id, err);
    }
  }
  if (done.size === 0) return photos;

  // relê antes de gravar: outra action pode ter reordenado/removido
  const { data } = await admin
    .from("vehicles")
    .select("photos")
    .eq("id", vehicle.id)
    .maybeSingle();
  const current = ((data?.photos as VehiclePhoto[] | null) ?? photos).map((p) =>
    done.has(p.id) ? { ...p, ...done.get(p.id)! } : p,
  );
  await admin.from("vehicles").update({ photos: current }).eq("id", vehicle.id);
  return current;
}
