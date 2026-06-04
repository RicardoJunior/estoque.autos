import { requireTenant } from "@/lib/auth";
import { logoutAction } from "../(auth)/actions";
import { Sidebar } from "@/components/admin/Sidebar";
import { LeadsRealtime } from "@/components/admin/LeadsRealtime";
import { buttonVariants } from "@/components/ui/button";

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
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6 pl-16 md:pl-6">
          <div />
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {profile.name}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
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
