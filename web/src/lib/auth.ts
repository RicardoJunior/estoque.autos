import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile, Tenant } from "./types";

export interface SessionContext {
  userId: string;
  email: string;
  profile: Profile;
  tenant: Tenant | null;
}

/**
 * Carrega usuário + profile + tenant. Retorna null se não logado.
 * Usado por Server Components e Server Actions do admin.
 */
export async function getSession(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  let tenant: Tenant | null = null;
  if (profile.tenant_id) {
    const { data } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", profile.tenant_id)
      .single();
    tenant = data as Tenant | null;
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    profile: profile as Profile,
    tenant,
  };
}

/**
 * Exige sessão com loja criada. Redireciona para login ou onboarding.
 * Retorna um contexto onde `tenant` é garantidamente não-nulo.
 */
export async function requireTenant(): Promise<
  SessionContext & { tenant: Tenant }
> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.tenant) redirect("/onboarding");
  return session as SessionContext & { tenant: Tenant };
}
