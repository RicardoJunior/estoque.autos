import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  type Profile,
  type Subscription,
  type Tenant,
} from "./types";

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

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Self-heal: sessão válida sem linha em profiles (conta anterior ao
  // schema ou trigger falho). Sem isso, /admin→/login→/admin vira loop
  // infinito de redirects. Policy profiles_own_insert permite só o
  // próprio profile.
  if (!profile) {
    const { data: created } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        name: (user.user_metadata?.name as string | undefined) ?? "",
      })
      .select("*")
      .single();
    profile = created;
  }

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
 * Assinatura Stripe do usuário logado (RLS: owner-read).
 * null = nunca assinou.
 */
export async function getSubscription(): Promise<Subscription | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return (data as Subscription | null) ?? null;
}

export function isSubscriptionActive(sub: Subscription | null): boolean {
  return (
    !!sub &&
    (ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(sub.status)
  );
}

/**
 * Exige sessão com loja criada E assinatura ativa (plano-primeiro).
 * Redireciona para login, assinatura ou onboarding conforme o caso.
 * Retorna um contexto onde `tenant` é garantidamente não-nulo.
 */
export async function requireTenant(): Promise<
  SessionContext & { tenant: Tenant }
> {
  const session = await getSession();
  if (!session) redirect("/login");

  const sub = await getSubscription();
  if (!isSubscriptionActive(sub)) redirect("/cadastro/assinatura");

  if (!session.tenant) redirect("/onboarding");
  return session as SessionContext & { tenant: Tenant };
}
