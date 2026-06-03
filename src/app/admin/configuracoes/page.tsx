import { requireTenant } from "@/lib/auth";
import { ContactForm } from "./ContactForm";

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
    </div>
  );
}
