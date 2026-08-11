"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, requireTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { leadUpdateSchema } from "@/lib/validation";
import type { LeadStatus } from "@/lib/types";

// SEMPRE .eq('tenant_id'): a RLS permite QUALQUER loja do usuário
// (multi-loja) — o escopo da loja ATIVA é responsabilidade daqui.

export async function updateLeadStatusAction(
  leadId: string,
  status: LeadStatus,
): Promise<{ error?: string }> {
  const { tenant } = await requireTenant();
  const parsed = leadUpdateSchema.safeParse({ status });
  if (!parsed.success) return { error: "Status inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status: parsed.data.status })
    .eq("id", leadId)
    .eq("tenant_id", tenant.id);
  if (error) return { error: "Não foi possível atualizar o status." };
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
  return {};
}

export async function updateLeadNotesAction(
  leadId: string,
  notes: string,
): Promise<{ ok: boolean }> {
  const { tenant } = await requireTenant();
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ notes: notes.slice(0, 5000) })
    .eq("id", leadId)
    .eq("tenant_id", tenant.id);
  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: !error };
}

export async function deleteLeadAction(
  leadId: string,
): Promise<{ error?: string }> {
  const { tenant } = await requireStaff();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .delete()
    .eq("id", leadId)
    .eq("tenant_id", tenant.id)
    .select("id");
  if (error || !data?.length) {
    return { error: "Não foi possível excluir o lead." };
  }
  revalidatePath("/admin/leads");
  return {};
}
