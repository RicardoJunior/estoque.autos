import { requireTenant } from "@/lib/auth";
import { Sidebar } from "@/components/admin/Sidebar";
import { LeadsRealtime } from "@/components/admin/LeadsRealtime";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { tenant, profile, email, role, memberships } = await requireTenant();

  return (
    <SidebarProvider>
      <Sidebar
        storeName={tenant.name}
        slug={tenant.slug}
        role={role}
        userName={profile.name || email}
        userEmail={email}
        activeStoreId={tenant.id}
        stores={memberships.map((m) => ({
          id: m.tenant.id,
          name: m.tenant.name,
          role: m.role,
        }))}
      />
      <SidebarInset>
        {/* header só no mobile: o gatilho do menu; no desktop o sidebar é fixo */}
        <header className="flex h-14 items-center gap-2 border-b border-border px-4 md:hidden">
          <SidebarTrigger />
          <span className="text-sm font-semibold">
            estoque<span className="text-primary">.autos</span>
          </span>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
      <LeadsRealtime tenantId={tenant.id} />
    </SidebarProvider>
  );
}
