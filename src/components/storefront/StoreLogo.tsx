import Image from "next/image";
import type { Storefront } from "@/lib/public";

/** Logo da loja com fallback para a inicial do nome. */
export function StoreLogo({
  store,
  size = 40,
  className = "",
}: {
  store: Storefront;
  size?: number;
  className?: string;
}) {
  if (store.logo_url) {
    return (
      <Image
        src={store.logo_url}
        alt={store.name}
        width={size}
        height={size}
        className={`object-contain ${className}`}
        style={{ maxHeight: size }}
      />
    );
  }
  return (
    <span
      className={`flex items-center justify-center rounded-lg font-bold ${className}`}
      style={{
        width: size,
        height: size,
        background: "var(--sf-primary)",
        color: "var(--sf-on-primary)",
        fontSize: size * 0.45,
      }}
    >
      {store.name.charAt(0).toUpperCase()}
    </span>
  );
}
