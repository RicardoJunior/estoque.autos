import { formatAddressFull } from "./address";

interface Props {
  address: Record<string, string> | null;
  /** nome da loja — ajuda o Google a achar o local certo */
  storeName?: string;
  className?: string;
  rounded?: string;
}

/**
 * Mapa do Google embutido SEM API key, via endpoint público
 * `maps?q=...&output=embed`. Renderiza null se não houver endereço.
 */
export function StoreMap({
  address,
  storeName,
  className = "",
  rounded = "rounded-2xl",
}: Props) {
  const full = formatAddressFull(address);
  if (!full) return null;

  const query = encodeURIComponent(
    storeName ? `${storeName}, ${full}` : full,
  );
  const src = `https://www.google.com/maps?q=${query}&output=embed`;

  return (
    <div
      className={`aspect-video w-full overflow-hidden border border-black/10 ${rounded} ${className}`}
    >
      <iframe
        title={`Mapa — ${storeName ?? "localização da loja"}`}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="h-full w-full border-0"
      />
    </div>
  );
}
