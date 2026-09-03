"use server";

import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ImageError } from "@/lib/images";
import { removePublic } from "@/lib/storage";
import type { VehiclePhoto } from "@/lib/types";
import { storeVehiclePhoto } from "@/lib/vehicle-photos";
import type { SkippedPhoto } from "./actions";

// ============================================================
// Fotos no CADASTRO (antes de o veículo existir): sobem para
// {tenant}/novo/ e a lista vai no submit do form — o carro já
// nasce com fotos, sem o "salve primeiro, fotos depois".
// ============================================================

export interface StagePhotosResult {
  staged?: VehiclePhoto[];
  skipped?: SkippedPhoto[];
  error?: string;
}

export async function stagePhotosAction(
  formData: FormData,
): Promise<StagePhotosResult> {
  const { tenant } = await requireStaff();
  const supabase = await createClient();

  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { staged: [] };

  const staged: VehiclePhoto[] = [];
  const skipped: SkippedPhoto[] = [];

  for (const file of files) {
    try {
      // WebP (vitrine) + JPEG (portais) no mesmo prefixo de staging
      staged.push(await storeVehiclePhoto(supabase, file, `${tenant.id}/novo`));
    } catch (err) {
      skipped.push({
        name: file.name,
        reason:
          err instanceof ImageError ? err.message : "falha ao processar a imagem",
      });
    }
  }

  return {
    staged,
    skipped: skipped.length > 0 ? skipped : undefined,
    error:
      staged.length === 0 && skipped.length > 0
        ? "Nenhuma imagem válida foi enviada."
        : undefined,
  };
}

export async function unstagePhotoAction(path: string): Promise<void> {
  const { tenant } = await requireStaff();
  // só apaga arquivo de staging da PRÓPRIA loja (as duas variantes)
  if (!path.startsWith(`${tenant.id}/novo/`)) return;
  const supabase = await createClient();
  const jpeg = path.replace(/\.webp$/i, ".jpg");
  await removePublic(supabase, "vehicle-photos", jpeg !== path ? [path, jpeg] : [path]);
}
