import type { Storefront } from "@/lib/public";
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

  return (
    <footer
      className={`border-t ${
        dark
          ? "border-white/10 bg-black/30 text-slate-300"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 sm:grid-cols-3">
        <div>
          <div
            className={`font-bold ${dark ? "text-white" : "text-slate-900"}`}
          >
            {store.name}
          </div>
          {store.settings.footer_text && (
            <p className="mt-2 text-sm">{store.settings.footer_text}</p>
          )}
        </div>

        <div className="text-sm">
          <div className={`font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
            Contato
          </div>
          <ul className="mt-2 space-y-1">
            {store.whatsapp && <li>WhatsApp: {store.whatsapp}</li>}
            {store.phone && <li>Telefone: {store.phone}</li>}
            {store.email && <li>{store.email}</li>}
          </ul>
        </div>

        <div className="text-sm">
          {address && (
            <>
              <div className={`font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                Endereço
              </div>
              <p className="mt-2">{address}</p>
            </>
          )}
          {hours && (
            <>
              <div className={`mt-3 font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                Horário
              </div>
              <p className="mt-1 whitespace-pre-line">{hours}</p>
            </>
          )}
        </div>
      </div>
      <div
        className={`border-t py-4 text-center text-xs ${
          dark ? "border-white/10 text-slate-500" : "border-slate-200 text-slate-400"
        }`}
      >
        © {new Date().getFullYear()} {store.name} · feito com estoque.autos
      </div>
    </footer>
  );
}
