"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { processVehiclePhoto } from "@/lib/images";
import { uploadPublic, removePublic, pathFromPublicUrl } from "@/lib/storage";
import {
  fieldErrorsFromZod,
  vehicleSchema,
  vehicleStatusSchema,
} from "@/lib/validation";
import type { VehiclePhoto, VehicleStatus } from "@/lib/types";

export interface VehicleFormState {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string>;
}

const MAX_PHOTOS = 30;

function parseVehicleForm(formData: FormData) {
  const optionals = formData.getAll("optionals").map(String).filter(Boolean);
  return vehicleSchema.safeParse({
    brand: formData.get("brand"),
    model: formData.get("model"),
    version: formData.get("version") || null,
    year_fab: formData.get("year_fab") || null,
    year_model: formData.get("year_model") || null,
    plate: formData.get("plate") || null,
    color: formData.get("color") || null,
    fuel: formData.get("fuel") || null,
    transmission: formData.get("transmission") || null,
    mileage: formData.get("mileage") || null,
    doors: formData.get("doors") || null,
    category: formData.get("category") || "carro",
    price: formData.get("price"),
    description: formData.get("description") || null,
    optionals,
    featured: formData.get("featured") === "on",
    fipe_code: formData.get("fipe_code") || null,
    fipe_year_id: formData.get("fipe_year_id") || null,
    fipe_price: formData.get("fipe_price") || null,
    fipe_reference: formData.get("fipe_reference") || null,
  });
}

export async function createVehicleAction(
  _prev: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  const { tenant } = await requireTenant();
  const parsed = parseVehicleForm(formData);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .insert({ ...parsed.data, tenant_id: tenant.id })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Não foi possível salvar o veículo." };
  }

  revalidatePath("/admin/veiculos");
  redirect(`/admin/veiculos/${data.id}?novo=1`);
}

export async function updateVehicleAction(
  vehicleId: string,
  _prev: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  await requireTenant();
  const parsed = parseVehicleForm(formData);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createClient();
  // RLS garante que só atualiza veículo do próprio tenant
  const { error } = await supabase
    .from("vehicles")
    .update(parsed.data)
    .eq("id", vehicleId);

  if (error) {
    return { error: "Não foi possível salvar as alterações." };
  }

  revalidatePath("/admin/veiculos");
  revalidatePath(`/admin/veiculos/${vehicleId}`);
  return { success: true };
}

export async function setVehicleStatusAction(
  vehicleId: string,
  status: VehicleStatus,
): Promise<void> {
  await requireTenant();
  const parsed = vehicleStatusSchema.safeParse({ status });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("vehicles")
    .update({ status: parsed.data.status })
    .eq("id", vehicleId);

  revalidatePath("/admin/veiculos");
  revalidatePath(`/admin/veiculos/${vehicleId}`);
}

export async function deleteVehicleAction(vehicleId: string): Promise<void> {
  const { tenant } = await requireTenant();
  const supabase = await createClient();

  // remove as fotos do storage antes de apagar a linha
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("photos")
    .eq("id", vehicleId)
    .single();

  if (vehicle?.photos?.length) {
    const paths = (vehicle.photos as VehiclePhoto[])
      .map((p) => p.path)
      .filter(Boolean);
    await removePublic(supabase, "vehicle-photos", paths);
  }

  await supabase.from("vehicles").delete().eq("id", vehicleId);
  // garante que sobras de storage do tenant não fiquem órfãs é tratado acima
  void tenant;

  revalidatePath("/admin/veiculos");
  redirect("/admin/veiculos");
}

// ------------------------------------------------------------
// Fotos
// ------------------------------------------------------------

async function loadPhotos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vehicleId: string,
): Promise<VehiclePhoto[]> {
  const { data } = await supabase
    .from("vehicles")
    .select("photos")
    .eq("id", vehicleId)
    .single();
  return (data?.photos as VehiclePhoto[]) ?? [];
}

export async function uploadPhotosAction(
  vehicleId: string,
  formData: FormData,
): Promise<{ error?: string; added?: number }> {
  const { tenant } = await requireTenant();
  const supabase = await createClient();

  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { added: 0 };

  const existing = await loadPhotos(supabase, vehicleId);
  const room = MAX_PHOTOS - existing.length;
  if (room <= 0) return { error: `Limite de ${MAX_PHOTOS} fotos atingido.` };

  const toProcess = files.slice(0, room);
  const added: VehiclePhoto[] = [];

  for (const file of toProcess) {
    try {
      const buf = await processVehiclePhoto(file);
      const id = randomUUID();
      const path = `${tenant.id}/${vehicleId}/${id}.webp`;
      const url = await uploadPublic(supabase, "vehicle-photos", path, buf);
      added.push({ id, path, url });
    } catch {
      // pula arquivo inválido, continua os demais
    }
  }

  if (added.length === 0) {
    return { error: "Nenhuma imagem válida foi enviada." };
  }

  const next = [...existing, ...added];
  await supabase.from("vehicles").update({ photos: next }).eq("id", vehicleId);

  revalidatePath(`/admin/veiculos/${vehicleId}`);
  return { added: added.length };
}

export async function removePhotoAction(
  vehicleId: string,
  photoId: string,
): Promise<void> {
  await requireTenant();
  const supabase = await createClient();

  const photos = await loadPhotos(supabase, vehicleId);
  const target = photos.find((p) => p.id === photoId);
  if (!target) return;

  await removePublic(supabase, "vehicle-photos", [
    target.path ?? pathFromPublicUrl(target.url, "vehicle-photos") ?? "",
  ]);

  const next = photos.filter((p) => p.id !== photoId);
  await supabase.from("vehicles").update({ photos: next }).eq("id", vehicleId);
  revalidatePath(`/admin/veiculos/${vehicleId}`);
}

/** Reordena as fotos. A primeira do array é sempre a capa. */
export async function reorderPhotosAction(
  vehicleId: string,
  orderedIds: string[],
): Promise<void> {
  await requireTenant();
  const supabase = await createClient();

  const photos = await loadPhotos(supabase, vehicleId);
  const byId = new Map(photos.map((p) => [p.id, p]));
  const next = orderedIds
    .map((id) => byId.get(id))
    .filter((p): p is VehiclePhoto => Boolean(p));
  // anexa qualquer foto que não estava na lista (defensivo)
  for (const p of photos) if (!orderedIds.includes(p.id)) next.push(p);

  if (next.length !== photos.length) return;

  await supabase.from("vehicles").update({ photos: next }).eq("id", vehicleId);
  revalidatePath(`/admin/veiculos/${vehicleId}`);
}
