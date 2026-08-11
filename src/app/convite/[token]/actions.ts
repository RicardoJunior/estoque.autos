"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACTIVE_TENANT_COOKIE } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface AcceptState {
  error?: string;
}

/**
 * Aceita o convite (usuário logado): cria a membership via RPC,
 * ativa a loja no cookie e leva ao painel.
 */
export async function acceptInviteAction(
  _prev: AcceptState,
  formData: FormData,
): Promise<AcceptState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "Convite inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/convite/${token}`)}`);
  }

  const { data, error } = await supabase.rpc("accept_invite", {
    p_token: token,
  });

  if (error) {
    if (error.message.includes("email_mismatch")) {
      return {
        error:
          "Este convite foi enviado para outro e-mail. Saia e entre com a conta do e-mail convidado.",
      };
    }
    if (error.message.includes("invite_invalid")) {
      return { error: "Este convite é inválido, expirou ou já foi utilizado." };
    }
    return { error: "Não foi possível aceitar o convite. Tente novamente." };
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | { tenant_id: string; slug: string; role: string }
    | null
    | undefined;
  if (!row?.tenant_id) {
    return { error: "Não foi possível aceitar o convite. Tente novamente." };
  }

  // ativa a loja recém-aceita e entra no painel (mesmos atributos do
  // setActiveTenantAction — cookie durável e httpOnly)
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TENANT_COOKIE, row.tenant_id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/admin");
}

/** Sai da conta atual e volta ao login apontando de volta pro convite. */
export async function logoutToInviteAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(
    token ? `/login?next=${encodeURIComponent(`/convite/${token}`)}` : "/login",
  );
}
