"use server";

import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { tenantContactSchema, fieldErrorsFromZod } from "@/lib/validation";

export interface ContactState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function updateContactAction(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const { tenant } = await requireTenant();

  const parsed = tenantContactSchema.safeParse({
    name: formData.get("name") || undefined,
    phone: formData.get("phone") || null,
    whatsapp: formData.get("whatsapp") || null,
    email: formData.get("email") || "",
    address: {
      cep: formData.get("cep") || undefined,
      street: formData.get("street") || undefined,
      number: formData.get("number") || undefined,
      complement: formData.get("complement") || undefined,
      neighborhood: formData.get("neighborhood") || undefined,
      city: formData.get("city") || undefined,
      state: formData.get("state") || undefined,
    },
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      name: parsed.data.name ?? tenant.name,
      phone: parsed.data.phone || null,
      whatsapp: parsed.data.whatsapp || null,
      email: parsed.data.email || null,
      address: parsed.data.address ?? null,
    })
    .eq("id", tenant.id);

  if (error) return { error: "Não foi possível salvar." };

  revalidatePath("/admin/configuracoes");
  revalidatePath(`/${tenant.slug}`);
  return { ok: true };
}
