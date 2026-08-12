import { requireTenant } from "@/lib/auth";
import type { Storefront } from "@/lib/public";
import { PageHeader } from "@/components/admin/PageHeader";
import { SiteCustomizer } from "./SiteCustomizer";

export const metadata = { title: "Meu site" };

export default async function SitePage() {
  const { tenant } = await requireTenant();

  // monta o Storefront a partir do tenant (mesmos campos da view pública)
  const store: Storefront = {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    phone: tenant.phone,
    whatsapp: tenant.whatsapp,
    email: tenant.email,
    address: tenant.address,
    template_id: tenant.template_id,
    colors: tenant.colors,
    logo_url: tenant.logo_url,
    settings: tenant.settings,
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Meu site"
        description="Personalize o template, as cores, o logo e os textos da sua loja."
      />
      <SiteCustomizer store={store} />
    </div>
  );
}
