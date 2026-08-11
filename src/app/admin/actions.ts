"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACTIVE_TENANT_COOKIE, getSession } from "@/lib/auth";

/**
 * Troca a loja ativa do usuário (multi-loja). Valida que a loja
 * pertence às memberships antes de gravar o cookie.
 */
export async function setActiveTenantAction(tenantId: string): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = session.memberships.find(
    (m) => m.tenant.id === tenantId,
  );
  // loja que não é do usuário: ignora e volta ao admin
  if (!membership) redirect("/admin");

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TENANT_COOKIE, tenantId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 ano
  });

  redirect("/admin");
}
