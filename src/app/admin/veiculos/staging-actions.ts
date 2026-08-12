"use server";

import { randomUUID } from "node:crypto";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ImageError, processVehiclePhoto } from "@/lib/images";
import { uploadPublic, removePublic } from "@/lib/storage";
import type { VehiclePhoto } from "@/lib/types";
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
      const buf = await processVehiclePhoto(file);
      const id = randomUUID();
      const path = `${tenant.id}/novo/${id}.webp`;
      const url = await uploadPublic(supabase, "vehicle-photos", path, buf);
      staged.push({ id, path, url });
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
  // só apaga arquivo de staging da PRÓPRIA loja
  if (!path.startsWith(`${tenant.id}/novo/`)) return;
  const supabase = await createClient();
  await removePublic(supabase, "vehicle-photos", [path]);
}
