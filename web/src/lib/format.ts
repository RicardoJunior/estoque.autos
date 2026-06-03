const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number): string {
  return brl.format(value);
}

const intFmt = new Intl.NumberFormat("pt-BR");

export function formatKm(value: number | null): string {
  if (value == null) return "—";
  return `${intFmt.format(value)} km`;
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}

/** "Civic EXL" + 2022 → "Civic EXL 2022" sem null/undefined no meio */
export function vehicleTitle(v: {
  brand: string;
  model: string;
  version?: string | null;
  year_model?: number | null;
}): string {
  return [v.brand, v.model, v.version, v.year_model]
    .filter(Boolean)
    .join(" ");
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Link wa.me com mensagem pré-formatada (apenas dígitos no telefone). */
export function whatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}
