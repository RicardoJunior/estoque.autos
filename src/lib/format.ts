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

/** "agora" · "há 35 min" · "há 3 h" · "ontem" · "há 5 dias" · "12/07/2026" */
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const mins = Math.floor((Date.now() - then) / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  return formatDate(iso);
}

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

/**
 * Título para os portais, limitado a `max` caracteres (ML 60, OLX 90),
 * cortando por palavra: "Honda Civic Touring 1.5 Turbo 2023". Marca +
 * modelo + ano têm prioridade sobre a versão quando não cabe tudo.
 */
export function portalTitle(
  v: {
    brand: string;
    model: string;
    version?: string | null;
    year_model?: number | null;
  },
  max: number,
): string {
  const clean = (s: string) => s.replace(/\s+/g, " ").trim();
  const base = clean([v.brand, v.model].join(" "));
  const year = v.year_model ? String(v.year_model) : "";
  const version = clean(v.version ?? "");

  const full = [base, version, year].filter(Boolean).join(" ");
  if (full.length <= max) return full;

  // corta a versão por palavra até caber; ano sempre no fim
  const words = version.split(" ");
  while (words.length > 0) {
    words.pop();
    const candidate = [base, words.join(" "), year].filter(Boolean).join(" ");
    if (candidate.length <= max) return candidate;
  }
  const short = [base, year].filter(Boolean).join(" ");
  return short.length <= max ? short : short.slice(0, max).trimEnd();
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
