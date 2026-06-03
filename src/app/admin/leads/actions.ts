"use server";

import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LeadStatus } from "@/lib/types";

export async function updateLeadStatusAction(
  leadId: string,
  status: LeadStatus,
): Promise<void> {
  await requireTenant();
  const supabase = await createClient();
  await supabase.from("leads").update({ status }).eq("id", leadId);
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
}

export async function updateLeadNotesAction(
  leadId: string,
  notes: string,
): Promise<{ ok: boolean }> {
  await requireTenant();
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ notes: notes.slice(0, 5000) })
    .eq("id", leadId);
  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: !error };
}

export async function deleteLeadAction(leadId: string): Promise<void> {
  await requireTenant();
  const supabase = await createClient();
  await supabase.from("leads").delete().eq("id", leadId);
  revalidatePath("/admin/leads");
}
