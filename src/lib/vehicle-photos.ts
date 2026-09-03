import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { processVehiclePhoto, processVehiclePhotoJpeg } from "./images";
import { uploadPublic } from "./storage";
import type { VehiclePhoto } from "./types";

/**
 * Processa um arquivo nas duas variantes (WebP da vitrine + JPEG dos
 * portais) e sobe as duas em `{basePath}/{id}.{webp,jpg}`. A JPEG é
 * best-effort: se falhar, a foto entra só com o WebP e o worker gera
 * a variante depois (job photos_jpeg).
 */
export async function storeVehiclePhoto(
  supabase: SupabaseClient,
  file: File,
  basePath: string,
): Promise<VehiclePhoto> {
  const id = randomUUID();
  const buf = await processVehiclePhoto(file);
  const path = `${basePath}/${id}.webp`;
  const url = await uploadPublic(supabase, "vehicle-photos", path, buf);
  const photo: VehiclePhoto = { id, path, url };
  try {
    const jpeg = await processVehiclePhotoJpeg(file);
    const jpeg_path = `${basePath}/${id}.jpg`;
    photo.jpeg_url = await uploadPublic(supabase, "vehicle-photos", jpeg_path, jpeg, "image/jpeg");
    photo.jpeg_path = jpeg_path;
  } catch (err) {
    console.error("variante JPEG falhou (worker gera depois):", err);
  }
  return photo;
}
