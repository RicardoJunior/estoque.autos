import { requireTenant } from "@/lib/auth";
import { logoutAction } from "../(auth)/actions";
import { Sidebar } from "@/components/admin/Sidebar";
import { LeadsRealtime } from "@/components/admin/LeadsRealtime";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { tenant, profile } = await requireTenant();

  return (
    <div className="flex min-h-dvh">
      <Sidebar storeName={tenant.name} slug={tenant.slug} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-white px-6">
          <div />
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--color-ink-soft)]">
              {profile.name}
            </span>
            <form action={logoutAction}>
              <button className="text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                Sair
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
      <LeadsRealtime tenantId={tenant.id} />
    </div>
  );
}
