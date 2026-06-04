import { requireTenant } from "@/lib/auth";
import { appHost } from "@/lib/domain";
import { isCloudflareSaasEnabled } from "@/lib/cloudflare-saas";
import { ContactForm } from "./ContactForm";
import { DomainForm } from "./DomainForm";

export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const { tenant } = await requireTenant();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-bold">Configurações</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Dados de contato e endereço exibidos no seu site.
        </p>
      </div>
      <ContactForm tenant={tenant} />
      <DomainForm
        tenant={tenant}
        appHost={appHost()}
        cfEnabled={isCloudflareSaasEnabled()}
      />
    </div>
  );
}
