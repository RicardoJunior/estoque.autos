import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "./supabase/server";
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  type Profile,
  type Subscription,
  type TeamRole,
  type Tenant,
} from "./types";

/** Cookie com a loja ativa (usuário pode ter várias lojas). */
export const ACTIVE_TENANT_COOKIE = "ea_loja";

export interface TenantMembership {
  role: TeamRole;
  tenant: Tenant;
}

export interface SessionContext {
  userId: string;
  email: string;
  profile: Profile;
  /** todas as lojas às quais o usuário pertence */
  memberships: TenantMembership[];
  /** loja ativa (cookie, com fallback para a primeira) */
  tenant: Tenant | null;
  /** papel do usuário na loja ativa */
  role: TeamRole | null;
}

/**
 * Carrega usuário + profile + lojas (memberships). Retorna null se
 * não logado. Usado por Server Components e Server Actions do admin.
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
  // schema ou trigger falho). Sem isso, /admin→/login→/admin vira loop.
  if (!profile) {
    const { data: created } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        name: (user.user_metadata?.name as string | undefined) ?? "",
        phone: (user.user_metadata?.phone as string | undefined) ?? null,
      })
      .select("*")
      .single();
    profile = created;
  }
  if (!profile) return null;

  const { data: rows } = await supabase
    .from("memberships")
    .select("role, tenant:tenants(*)")
    .eq("user_id", user.id);

  const memberships: TenantMembership[] = (rows ?? [])
    .filter((r) => r.tenant)
    .map((r) => ({
      role: r.role as TeamRole,
      tenant: r.tenant as unknown as Tenant,
    }));

  // loja ativa: cookie → legado (profiles.tenant_id) → primeira
  const cookieStore = await cookies();
  const wanted = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value;
  const active =
    memberships.find((m) => m.tenant.id === wanted) ??
    memberships.find((m) => m.tenant.id === profile.tenant_id) ??
    memberships[0] ??
    null;

  return {
    userId: user.id,
    email: user.email ?? "",
    profile: profile as Profile,
    memberships,
    tenant: active?.tenant ?? null,
    role: active?.role ?? null,
  };
}

/** Assinatura ATIVA-porém-sem-loja do usuário (pagou, falta o onboarding). */
export async function getUnlinkedSubscription(): Promise<Subscription | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .is("tenant_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Subscription | null) ?? null;
}

/** Assinatura mais recente do usuário (qualquer loja) — reuso de customer. */
export async function getLatestSubscription(): Promise<Subscription | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Subscription | null) ?? null;
}

/** Assinatura DA LOJA (linha completa — visível para o owner da loja). */
export async function getTenantSubscription(
  tenantId: string,
): Promise<Subscription | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("tenant_id", tenantId)
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
 * Exige sessão com loja ativa E assinatura vigente DESSA loja.
 * Redireciona para login, assinatura ou onboarding conforme o caso.
 */
export async function requireTenant(): Promise<
  SessionContext & { tenant: Tenant; role: TeamRole }
> {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!session.tenant) {
    // sem loja nenhuma: ou falta onboarding (já pagou) ou falta assinar
    const unlinked = await getUnlinkedSubscription();
    if (isSubscriptionActive(unlinked)) redirect("/onboarding");
    redirect("/cadastro/assinatura");
  }

  // status da assinatura DA loja ativa (RPC — qualquer membro consulta)
  const supabase = await createClient();
  const { data } = await supabase.rpc("tenant_subscription_status", {
    p_tenant: session.tenant.id,
  });
  const status = (data as { status: string }[] | null)?.[0]?.status ?? null;

  if (!status || !(ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(status)) {
    if (session.role === "owner") redirect("/cadastro/assinatura");
    // colaborador de loja suspensa: tenta outra loja do usuário
    const other = session.memberships.find(
      (m) => m.tenant.id !== session.tenant!.id,
    );
    if (other) {
      const cookieStore = await cookies();
      cookieStore.set(ACTIVE_TENANT_COOKIE, other.tenant.id, { path: "/" });
      redirect("/admin");
    }
    redirect("/");
  }

  return session as SessionContext & { tenant: Tenant; role: TeamRole };
}

/** Exige papel de gestão (owner/admin) na loja ativa. */
export async function requireStaff() {
  const ctx = await requireTenant();
  if (ctx.role !== "owner" && ctx.role !== "admin") redirect("/admin");
  return ctx;
}

/** Exige o proprietário da loja ativa. */
export async function requireOwner() {
  const ctx = await requireTenant();
  if (ctx.role !== "owner") redirect("/admin");
  return ctx;
}
