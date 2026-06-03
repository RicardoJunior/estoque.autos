import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Sobe um buffer para um bucket e devolve a URL pública.
 * O path SEMPRE começa com `{tenantId}/` — é o que as policies de
 * storage exigem (escrita restrita ao path do próprio tenant).
 */
export async function uploadPublic(
  supabase: SupabaseClient,
  bucket: "logos" | "vehicle-photos",
  path: string,
  body: Buffer,
  contentType = "image/webp",
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`upload_failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function removePublic(
  supabase: SupabaseClient,
  bucket: "logos" | "vehicle-photos",
  paths: string[],
): Promise<void> {
  if (paths.length === 0) return;
  await supabase.storage.from(bucket).remove(paths);
}

/** Extrai o storage path a partir de uma URL pública do Supabase. */
export function pathFromPublicUrl(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}
