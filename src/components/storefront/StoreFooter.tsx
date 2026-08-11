import type { Storefront } from "@/lib/public";
import { SOCIAL_NETWORKS, SOCIAL_NETWORK_LABELS } from "@/lib/types";
import { StoreLogo } from "./StoreLogo";
import { showStoreName } from "./identity";
import { formatAddressShort } from "./address";

export function StoreFooter({
  store,
  tone = "light",
}: {
  store: Storefront;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  const address = formatAddressShort(store.address);
  const hours = store.settings.business_hours;
  // redes sociais na ordem canônica; só URLs https salvas aparecem
  const social = SOCIAL_NETWORKS.map((net) => ({
    net,
    url: store.settings.social?.[net],
  })).filter((s): s is { net: (typeof SOCIAL_NETWORKS)[number]; url: string } =>
    Boolean(s.url?.startsWith("https://")),
  );
  // títulos das colunas seguem a tinta do tema (fallback = visual atual)
  const ink = dark ? "var(--sf-ink, #ffffff)" : "var(--sf-ink, #0f172a)";

  return (
    <footer
      className="border-t"
      style={{
        borderColor: dark
          ? "var(--sf-border, rgba(255,255,255,0.1))"
          : "var(--sf-border, #e2e8f0)",
        background: dark
          ? "var(--sf-surface, rgba(0,0,0,0.3))"
          : "var(--sf-surface, #f8fafc)",
        color: dark
          ? "var(--sf-ink-soft, #cbd5e1)"
          : "var(--sf-ink-soft, #64748b)",
      }}
    >
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 sm:grid-cols-3">
        <div>
          {/* sem nome em texto (show_name off + logo): o logo identifica a loja */}
          {!showStoreName(store) && store.logo_url ? (
            <StoreLogo store={store} size={32} />
          ) : (
            <div className="font-bold" style={{ color: ink }}>
              {store.name}
            </div>
          )}
          {store.settings.footer_text && (
            <p className="mt-2 text-sm">{store.settings.footer_text}</p>
          )}
        </div>

        <div className="text-sm">
          <div className="font-semibold" style={{ color: ink }}>
            Contato
          </div>
          <ul className="mt-2 space-y-1">
            {store.whatsapp && <li>WhatsApp: {store.whatsapp}</li>}
            {store.phone && <li>Telefone: {store.phone}</li>}
            {store.email && <li>{store.email}</li>}
          </ul>
          {social.length > 0 && (
            <>
              <div className="mt-3 font-semibold" style={{ color: ink }}>
                Redes
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {social.map(({ net, url }) => (
                  <li key={net}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline-offset-2 transition hover:underline hover:opacity-80"
                    >
                      {SOCIAL_NETWORK_LABELS[net]}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="text-sm">
          {address && (
            <>
              <div className="font-semibold" style={{ color: ink }}>
                Endereço
              </div>
              <p className="mt-2">{address}</p>
            </>
          )}
          {hours && (
            <>
              <div className="mt-3 font-semibold" style={{ color: ink }}>
                Horário
              </div>
              <p className="mt-1 whitespace-pre-line">{hours}</p>
            </>
          )}
        </div>
      </div>
      <div
        className="border-t py-4 text-center text-xs"
        style={{
          borderColor: dark
            ? "var(--sf-border, rgba(255,255,255,0.1))"
            : "var(--sf-border, #e2e8f0)",
          color: dark
            ? "var(--sf-ink-faint, #64748b)"
            : "var(--sf-ink-faint, #94a3b8)",
        }}
      >
        © {new Date().getFullYear()} {store.name} · feito com estoque.autos
      </div>
    </footer>
  );
}
