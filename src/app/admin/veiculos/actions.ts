"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { activeVehicleLimit, activeVehicleLimitMessage } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";
import { ImageError, processVehiclePhoto } from "@/lib/images";
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
const ACTIVE_STATUSES: VehicleStatus[] = ["available", "reserved"];

/** Veículos ativos (available/reserved) do tenant — base do limite de plano. */
async function countActiveVehicles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
): Promise<number> {
  const { count } = await supabase
    .from("vehicles")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .in("status", ACTIVE_STATUSES);
  return count ?? 0;
}

function parseVehicleForm(formData: FormData) {
  // sempre alfabético: o anúncio público exibe na ordem gravada
  const optionals = formData
    .getAll("optionals")
    .map(String)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
  const conditionFlags = formData
    .getAll("condition_flags")
    .map(String)
    .filter(Boolean);
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
    condition_flags: conditionFlags,
    featured: formData.get("featured") === "on",
    consigned: formData.get("consigned") === "on",
    fipe_code: formData.get("fipe_code") || null,
    fipe_year_id: formData.get("fipe_year_id") || null,
    fipe_price: formData.get("fipe_price") || null,
    fipe_reference: formData.get("fipe_reference") || null,
  });
}

/** Fotos enviadas durante o cadastro (PhotoStage) — valida que os
 *  arquivos são do staging DA loja ativa antes de anexar. */
function parseStagedPhotos(formData: FormData, tenantId: string): VehiclePhoto[] {
  try {
    const raw = JSON.parse(String(formData.get("staged_photos") || "[]"));
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        (p): p is VehiclePhoto =>
          !!p &&
          typeof p.id === "string" &&
          typeof p.url === "string" &&
          typeof p.path === "string" &&
          p.path.startsWith(`${tenantId}/novo/`),
      )
      .slice(0, MAX_PHOTOS);
  } catch {
    return [];
  }
}

export async function createVehicleAction(
  _prev: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  const { tenant } = await requireStaff();
  const parsed = parseVehicleForm(formData);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createClient();

  // veículo novo nasce 'available' — conta contra o limite do plano
  const active = await countActiveVehicles(supabase, tenant.id);
  if (active >= activeVehicleLimit(tenant.plan)) {
    return { error: activeVehicleLimitMessage(tenant.plan) };
  }

  const photos = parseStagedPhotos(formData, tenant.id);

  const { data, error } = await supabase
    .from("vehicles")
    .insert({ ...parsed.data, tenant_id: tenant.id, photos })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Não foi possível salvar o veículo." };
  }

  revalidatePath("/admin/veiculos");
  redirect(`/admin/veiculos/${data.id}${photos.length ? "" : "?novo=1"}`);
}

export async function updateVehicleAction(
  vehicleId: string,
  _prev: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  const { tenant } = await requireStaff();
  const parsed = parseVehicleForm(formData);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createClient();
  // .eq(tenant_id) SEMPRE: a RLS permite todas as lojas do usuário
  // (multi-loja) — o escopo da loja ativa é responsabilidade daqui
  const { error } = await supabase
    .from("vehicles")
    .update(parsed.data)
    .eq("id", vehicleId)
    .eq("tenant_id", tenant.id);

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
): Promise<{ error?: string }> {
  const { tenant } = await requireStaff();
  const parsed = vehicleStatusSchema.safeParse({ status });
  if (!parsed.success) return {};

  const supabase = await createClient();

  // reativar (sold/archived → available/reserved) conta contra o limite do plano
  if (ACTIVE_STATUSES.includes(parsed.data.status)) {
    const { data: current } = await supabase
      .from("vehicles")
      .select("status")
      .eq("id", vehicleId)
      .eq("tenant_id", tenant.id)
      .single();
    if (!current) return { error: "Veículo não encontrado nesta loja." };
    if (!ACTIVE_STATUSES.includes(current.status as VehicleStatus)) {
      const active = await countActiveVehicles(supabase, tenant.id);
      if (active >= activeVehicleLimit(tenant.plan)) {
        return { error: activeVehicleLimitMessage(tenant.plan) };
      }
    }
  }

  const { error } = await supabase
    .from("vehicles")
    .update({ status: parsed.data.status })
    .eq("id", vehicleId)
    .eq("tenant_id", tenant.id);
  if (error) {
    return { error: "Não foi possível alterar o status. Tente novamente." };
  }

  revalidatePath("/admin/veiculos");
  revalidatePath(`/admin/veiculos/${vehicleId}`);
  return {};
}

/** Marca/desmarca o veículo como consignado (controle interno). */
export async function setVehicleConsignedAction(
  vehicleId: string,
  consigned: boolean,
): Promise<{ error?: string }> {
  const { tenant } = await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicles")
    .update({ consigned })
    .eq("id", vehicleId)
    .eq("tenant_id", tenant.id);
  if (error) return { error: "Não foi possível atualizar. Tente novamente." };
  revalidatePath("/admin/veiculos");
  revalidatePath(`/admin/veiculos/${vehicleId}`);
  return {};
}

export async function deleteVehicleAction(vehicleId: string): Promise<void> {
  const { tenant } = await requireStaff();
  const supabase = await createClient();

  // remove as fotos do storage antes de apagar a linha
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("photos")
    .eq("id", vehicleId)
    .eq("tenant_id", tenant.id)
    .single();
  if (!vehicle) redirect("/admin/veiculos");

  if (vehicle?.photos?.length) {
    const paths = (vehicle.photos as VehiclePhoto[])
      .map((p) => p.path)
      .filter(Boolean);
    await removePublic(supabase, "vehicle-photos", paths);
  }

  await supabase
    .from("vehicles")
    .delete()
    .eq("id", vehicleId)
    .eq("tenant_id", tenant.id);
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
  tenantId: string,
): Promise<VehiclePhoto[]> {
  const { data } = await supabase
    .from("vehicles")
    .select("photos")
    .eq("id", vehicleId)
    .eq("tenant_id", tenantId)
    .single();
  return (data?.photos as VehiclePhoto[]) ?? [];
}

export interface SkippedPhoto {
  name: string;
  reason: string;
}

export interface UploadPhotosResult {
  error?: string;
  added?: number;
  /** lista final de fotos do veículo — o client sincroniza o estado com ela */
  photos?: VehiclePhoto[];
  /** arquivos que NÃO entraram, com o motivo (nada de falha silenciosa) */
  skipped?: SkippedPhoto[];
}

export async function uploadPhotosAction(
  vehicleId: string,
  formData: FormData,
): Promise<UploadPhotosResult> {
  const { tenant } = await requireStaff();
  const supabase = await createClient();

  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { added: 0 };

  const existing = await loadPhotos(supabase, vehicleId, tenant.id);
  const room = MAX_PHOTOS - existing.length;
  if (room <= 0) {
    return {
      error: `Limite de ${MAX_PHOTOS} fotos atingido.`,
      photos: existing,
    };
  }

  const skipped: SkippedPhoto[] = files.slice(room).map((f) => ({
    name: f.name,
    reason: `limite de ${MAX_PHOTOS} fotos atingido`,
  }));
  const added: VehiclePhoto[] = [];

  for (const file of files.slice(0, room)) {
    try {
      const buf = await processVehiclePhoto(file);
      const id = randomUUID();
      const path = `${tenant.id}/${vehicleId}/${id}.webp`;
      const url = await uploadPublic(supabase, "vehicle-photos", path, buf);
      added.push({ id, path, url });
    } catch (err) {
      skipped.push({
        name: file.name,
        reason:
          err instanceof ImageError ? err.message : "falha ao processar a imagem",
      });
    }
  }

  if (added.length === 0) {
    return {
      error: "Nenhuma imagem válida foi enviada.",
      photos: existing,
      skipped,
    };
  }

  const next = [...existing, ...added];
  const { error: updateError } = await supabase
    .from("vehicles")
    .update({ photos: next })
    .eq("id", vehicleId)
    .eq("tenant_id", tenant.id);

  if (updateError) {
    // não finge sucesso nem deixa arquivo órfão no storage
    await removePublic(
      supabase,
      "vehicle-photos",
      added.map((p) => p.path),
    );
    return {
      error: "Não foi possível salvar as fotos. Tente novamente.",
      photos: existing,
      skipped,
    };
  }

  revalidatePath(`/admin/veiculos/${vehicleId}`);
  return {
    added: added.length,
    photos: next,
    skipped: skipped.length > 0 ? skipped : undefined,
  };
}

export async function removePhotoAction(
  vehicleId: string,
  photoId: string,
): Promise<{ photos: VehiclePhoto[]; error?: string }> {
  const { tenant } = await requireStaff();
  const supabase = await createClient();

  const photos = await loadPhotos(supabase, vehicleId, tenant.id);
  const target = photos.find((p) => p.id === photoId);
  if (!target) return { photos };

  await removePublic(supabase, "vehicle-photos", [
    target.path ?? pathFromPublicUrl(target.url, "vehicle-photos") ?? "",
  ]);

  const next = photos.filter((p) => p.id !== photoId);
  const { error } = await supabase
    .from("vehicles")
    .update({ photos: next })
    .eq("id", vehicleId)
    .eq("tenant_id", tenant.id);
  if (error) {
    return { photos, error: "Não foi possível remover a foto. Tente de novo." };
  }
  revalidatePath(`/admin/veiculos/${vehicleId}`);
  return { photos: next };
}

/** Reordena as fotos. A primeira do array é sempre a capa. */
export async function reorderPhotosAction(
  vehicleId: string,
  orderedIds: string[],
): Promise<{ photos: VehiclePhoto[]; error?: string }> {
  const { tenant } = await requireStaff();
  const supabase = await createClient();

  const photos = await loadPhotos(supabase, vehicleId, tenant.id);
  const byId = new Map(photos.map((p) => [p.id, p]));
  const next = orderedIds
    .map((id) => byId.get(id))
    .filter((p): p is VehiclePhoto => Boolean(p));
  // anexa qualquer foto que não estava na lista (defensivo)
  for (const p of photos) if (!orderedIds.includes(p.id)) next.push(p);

  // cliente desatualizado: devolve o estado real para re-sincronizar
  if (next.length !== photos.length) return { photos };

  const { error } = await supabase
    .from("vehicles")
    .update({ photos: next })
    .eq("id", vehicleId)
    .eq("tenant_id", tenant.id);
  if (error) {
    return { photos, error: "Não foi possível reordenar as fotos. Tente de novo." };
  }
  revalidatePath(`/admin/veiculos/${vehicleId}`);
  return { photos: next };
}
