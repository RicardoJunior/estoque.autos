/** Helpers de endereço da loja (view storefronts → tenants.address). */

type Addr = Record<string, string> | null | undefined;

/** Endereço resumido em uma linha, separado por " · " (uso em footer). */
export function formatAddressShort(addr: Addr): string | null {
  if (!addr) return null;
  const parts = [
    [addr.street, addr.number].filter(Boolean).join(", "),
    addr.neighborhood,
    [addr.city, addr.state].filter(Boolean).join(" - "),
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

/** Endereço completo numa linha (rua, nº, complemento, bairro, cidade-UF, CEP). */
export function formatAddressFull(addr: Addr): string | null {
  if (!addr) return null;
  const parts = [
    [addr.street, addr.number].filter(Boolean).join(", "),
    addr.complement,
    addr.neighborhood,
    [addr.city, addr.state].filter(Boolean).join(" - "),
    addr.cep,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

/** true quando há ao menos um campo de endereço preenchido. */
export function hasAddress(addr: Addr): boolean {
  return !!formatAddressFull(addr);
}
