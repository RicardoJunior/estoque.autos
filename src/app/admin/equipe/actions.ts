"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendInviteEmail } from "@/lib/email";
import type { Invite } from "@/lib/types";

// ------------------------------------------------------------
// Convites
// ------------------------------------------------------------

export interface InviteState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/** Erros conhecidos da RPC create_invite → mensagens pt-BR. */
const INVITE_ERRORS: Record<string, string> = {
  pro_required:
    "Equipe é um recurso do plano Pro. Faça upgrade em Configurações → Assinatura.",
  already_member: "Esta pessoa já faz parte da equipe da loja.",
  invalid_email: "E-mail inválido.",
};

export async function createInviteAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const { tenant } = await requireStaff();
  if (tenant.plan !== "pro") return { error: INVITE_ERRORS.pro_required };

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const role = String(formData.get("role") ?? "");
  if (!email || !email.includes("@")) {
    return { fieldErrors: { email: "Informe um e-mail válido." } };
  }
  if (role !== "admin" && role !== "vendedor") {
    return { fieldErrors: { role: "Escolha o papel do convidado." } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_invite", {
    p_tenant: tenant.id,
    p_email: email,
    p_role: role,
  });

  if (error) {
    const known = Object.keys(INVITE_ERRORS).find((k) =>
      error.message.includes(k),
    );
    return {
      error: known
        ? INVITE_ERRORS[known]
        : "Não foi possível criar o convite. Tente novamente.",
    };
  }

  // a RPC devolve a linha do convite (única ou em array, conforme o retorno)
  const invite = (Array.isArray(data) ? data[0] : data) as Invite | null;
  if (invite?.token) {
    await sendInviteEmail({
      to: email,
      storeName: tenant.name,
      role,
      token: invite.token,
    });
  }

  revalidatePath("/admin/equipe");
  return { ok: true };
}

/** Revoga (apaga) um convite pendente — staff da loja, via RLS. */
export async function revokeInviteAction(formData: FormData): Promise<void> {
  const { tenant } = await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("invites").delete().eq("id", id).eq("tenant_id", tenant.id);
  revalidatePath("/admin/equipe");
}

// ------------------------------------------------------------
// Membros (owner apenas)
// ------------------------------------------------------------

export interface MemberState {
  ok?: boolean;
  error?: string;
}

/** Erros conhecidos da RPC transfer_ownership → mensagens pt-BR. */
const TRANSFER_ERRORS: Record<string, string> = {
  not_owner: "Apenas o proprietário pode transferir a propriedade da loja.",
  not_a_member: "Essa pessoa não faz parte da equipe da loja.",
  already_owner: "Essa pessoa já é a proprietária da loja.",
};

/** Alterna o papel de um membro entre admin e vendedor (nunca o owner). */
export async function updateMemberRoleAction(
  _prev: MemberState,
  formData: FormData,
): Promise<MemberState> {
  const { tenant, userId } = await requireOwner();

  const target = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (role !== "admin" && role !== "vendedor") {
    return { error: "Papel inválido." };
  }
  if (!target || target === userId) {
    return { error: "Não é possível alterar o papel do proprietário." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .update({ role })
    .eq("tenant_id", tenant.id)
    .eq("user_id", target)
    .neq("role", "owner");

  if (error) return { error: "Não foi possível alterar o papel." };

  revalidatePath("/admin/equipe");
  return { ok: true };
}

/** Remove um membro da equipe (nunca o owner). */
export async function removeMemberAction(
  _prev: MemberState,
  formData: FormData,
): Promise<MemberState> {
  const { tenant, userId } = await requireOwner();

  const target = String(formData.get("user_id") ?? "");
  if (!target || target === userId) {
    return { error: "O proprietário não pode ser removido da equipe." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .delete()
    .eq("tenant_id", tenant.id)
    .eq("user_id", target)
    .neq("role", "owner");

  if (error) return { error: "Não foi possível remover o membro." };

  revalidatePath("/admin/equipe");
  return { ok: true };
}

/**
 * Transfere a propriedade da loja para outro membro. Depois da
 * transferência o usuário atual deixa de ser owner — redireciona
 * para /admin, onde o fluxo de auth resolve o novo contexto.
 */
export async function transferOwnershipAction(
  _prev: MemberState,
  formData: FormData,
): Promise<MemberState> {
  const { tenant } = await requireOwner();

  const target = String(formData.get("user_id") ?? "");
  if (!target) return { error: "Escolha o novo proprietário." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("transfer_ownership", {
    p_tenant: tenant.id,
    p_new_owner: target,
  });

  if (error) {
    const known = Object.keys(TRANSFER_ERRORS).find((k) =>
      error.message.includes(k),
    );
    return {
      error: known
        ? TRANSFER_ERRORS[known]
        : "Não foi possível transferir a propriedade. Tente novamente.",
    };
  }

  revalidatePath("/admin/equipe");
  redirect("/admin");
}
