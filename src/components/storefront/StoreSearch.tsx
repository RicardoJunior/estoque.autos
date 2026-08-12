"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { CSSProperties } from "react";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import {
  CATEGORY_LABELS,
  FUEL_LABELS,
  TRANSMISSION_LABELS,
  VEHICLE_CATEGORIES,
  FUELS,
  TRANSMISSIONS,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  captureSfVars,
  LIGHT_ISLAND,
} from "@/components/storefront/theme-island";

const SORTS: Record<string, string> = {
  recent: "Mais recentes",
  price_asc: "Menor preço",
  price_desc: "Maior preço",
  km_asc: "Menor km",
};

/** Filtros avançados propagados na URL (o SSR re-filtra no servidor). */
const FILTER_KEYS = [
  "category",
  "fuel",
  "transmission",
  "minPrice",
  "maxPrice",
] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

const FILTER_LABELS: Record<FilterKey, (v: string) => string> = {
  category: (v) =>
    CATEGORY_LABELS[v as keyof typeof CATEGORY_LABELS] ?? v,
  fuel: (v) => FUEL_LABELS[v as keyof typeof FUEL_LABELS] ?? v,
  transmission: (v) =>
    TRANSMISSION_LABELS[v as keyof typeof TRANSMISSION_LABELS] ?? v,
  minPrice: (v) => `a partir de R$ ${Number(v).toLocaleString("pt-BR")}`,
  maxPrice: (v) => `até R$ ${Number(v).toLocaleString("pt-BR")}`,
};

/**
 * Busca + ordenação + filtros da vitrine. Tudo vive na URL e aplica
 * sem recarregar a página (router.replace → SSR re-filtra). Os
 * overlays (Select/Sheet) são portalados para fora do container
 * temado, então levam junto as vars --sf-* + tokens claros do shadcn.
 */
export function StoreSearch({ tone = "light" }: { tone?: "light" | "dark" }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const dark = tone === "dark";

  // overlays portalados perdem as --sf-*: copia os valores resolvidos
  const rootRef = useRef<HTMLDivElement>(null);
  const [sfVars, setSfVars] = useState<CSSProperties>();
  useEffect(() => {
    if (rootRef.current) setSfVars(captureSfVars(rootRef.current));
  }, []);
  const overlayStyle: CSSProperties = {
    ...sfVars,
    ...LIGHT_ISLAND,
    fontFamily: "var(--sf-font, inherit)",
  };

  function apply(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  // busca textual com debounce (o replace não recarrega a página)
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => apply({ q: q || null }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const active = FILTER_KEYS.filter((k) => params.get(k));

  function clearAll() {
    setQ("");
    apply({
      q: null,
      sort: null,
      ...Object.fromEntries(FILTER_KEYS.map((k) => [k, null])),
    });
  }

  // campos inline seguem o tom do template (claro/escuro) via --sf-*;
  // dark: também é sobrescrito — o app inteiro roda com .dark no <html>
  const fieldCls = dark
    ? "border-[color:var(--sf-border,rgba(255,255,255,0.15))] bg-[color:var(--sf-surface,rgba(255,255,255,0.1))] text-[color:var(--sf-ink,#ffffff)] placeholder:text-[color:var(--sf-ink-faint,rgba(255,255,255,0.5))] dark:border-[color:var(--sf-border,rgba(255,255,255,0.15))] dark:bg-[color:var(--sf-surface,rgba(255,255,255,0.1))]"
    : "border-[color:var(--sf-border,#cbd5e1)] bg-[color:var(--sf-surface,#ffffff)] text-[color:var(--sf-ink,#0f172a)] placeholder:text-[color:var(--sf-ink-faint,#94a3b8)] dark:border-[color:var(--sf-border,#cbd5e1)] dark:bg-[color:var(--sf-surface,#ffffff)]";

  return (
    <div ref={rootRef} className="flex w-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-auto sm:min-w-40 sm:max-w-sm sm:flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center opacity-60">
            {isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Search className="size-4" aria-hidden />
            )}
          </span>
          <Input
            className={cn("h-10 pl-8", fieldCls)}
            placeholder="Buscar marca ou modelo…"
            aria-label="Buscar marca ou modelo"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <Select
          value={params.get("sort") ?? "recent"}
          onValueChange={(v) =>
            apply({ sort: !v || v === "recent" ? null : String(v) })
          }
        >
          <SelectTrigger
            aria-label="Ordenar"
            className={cn("h-10 flex-1 sm:w-auto sm:flex-none", fieldCls)}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start" style={overlayStyle}>
            {Object.entries(SORTS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                aria-label="Abrir filtros"
                className={cn("h-10 flex-1 sm:flex-none", fieldCls)}
              />
            }
          >
            <SlidersHorizontal data-icon="inline-start" aria-hidden />
            Filtros
            {active.length > 0 && (
              <Badge
                className="ml-0.5 size-5 justify-center rounded-full p-0"
                style={{
                  background: "var(--sf-accent, #0f172a)",
                  color: "var(--sf-on-accent, #ffffff)",
                }}
              >
                {active.length}
              </Badge>
            )}
          </SheetTrigger>
          <SheetContent
            side="right"
            style={overlayStyle}
            className="w-full bg-white text-slate-900 sm:max-w-sm"
          >
            <SheetHeader>
              <SheetTitle style={{ fontFamily: "inherit" }}>
                Filtrar veículos
              </SheetTitle>
              <SheetDescription>
                Os resultados atualizam na hora, sem recarregar a página.
              </SheetDescription>
            </SheetHeader>

            <div className="grid gap-4 overflow-y-auto px-4 pb-4">
              <FilterSelect
                label="Categoria"
                value={params.get("category")}
                onChange={(v) => apply({ category: v })}
                options={VEHICLE_CATEGORIES.map((c) => [c, CATEGORY_LABELS[c]])}
                overlayStyle={overlayStyle}
              />
              <FilterSelect
                label="Combustível"
                value={params.get("fuel")}
                onChange={(v) => apply({ fuel: v })}
                options={FUELS.map((f) => [f, FUEL_LABELS[f]])}
                overlayStyle={overlayStyle}
              />
              <FilterSelect
                label="Câmbio"
                value={params.get("transmission")}
                onChange={(v) => apply({ transmission: v })}
                options={TRANSMISSIONS.map((t) => [t, TRANSMISSION_LABELS[t]])}
                overlayStyle={overlayStyle}
              />
              <div className="grid grid-cols-2 gap-3">
                <PriceField
                  label="Preço mínimo"
                  paramKey="minPrice"
                  params={params}
                  onApply={apply}
                />
                <PriceField
                  label="Preço máximo"
                  paramKey="maxPrice"
                  params={params}
                  onApply={apply}
                />
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={clearAll}
                  disabled={active.length === 0 && !params.get("q")}
                >
                  <X data-icon="inline-start" aria-hidden />
                  Limpar tudo
                </Button>
                <SheetClose render={<Button type="button" />}>
                  Ver resultados
                </SheetClose>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* chips dos filtros ativos — remoção com um toque */}
      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {active.map((key) => {
            const value = params.get(key)!;
            return (
              <Badge
                key={key}
                variant="secondary"
                className={cn(
                  "gap-1 rounded-full py-1 pl-2.5 pr-1",
                  dark
                    ? "bg-white/10 text-white"
                    : "bg-slate-900/5 text-slate-700",
                )}
              >
                {FILTER_LABELS[key](value)}
                <button
                  type="button"
                  aria-label={`Remover filtro ${FILTER_LABELS[key](value)}`}
                  onClick={() => apply({ [key]: null })}
                  className="rounded-full p-0.5 opacity-60 transition hover:opacity-100"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </Badge>
            );
          })}
          <button
            type="button"
            onClick={clearAll}
            className={cn(
              "text-xs underline underline-offset-2 opacity-70 transition hover:opacity-100",
              dark ? "text-white" : "text-slate-600",
            )}
          >
            limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  overlayStyle,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  options: [string, string][];
  overlayStyle: CSSProperties;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-slate-700">{label}</Label>
      <Select
        value={value ?? "all"}
        onValueChange={(v) => onChange(!v || v === "all" ? null : String(v))}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} align="start" style={overlayStyle}>
          <SelectItem value="all">Todos</SelectItem>
          {options.map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function PriceField({
  label,
  paramKey,
  params,
  onApply,
}: {
  label: string;
  paramKey: "minPrice" | "maxPrice";
  params: URLSearchParams;
  onApply: (updates: Record<string, string | null>) => void;
}) {
  const urlValue = params.get(paramKey) ?? "";
  const [value, setValue] = useState(urlValue);

  // ressincroniza quando o filtro é limpo por fora (chips/limpar tudo)
  const [prevUrl, setPrevUrl] = useState(urlValue);
  if (prevUrl !== urlValue) {
    setPrevUrl(urlValue);
    setValue(urlValue);
  }

  function commit() {
    const digits = value.replace(/\D/g, "");
    if (digits !== urlValue) onApply({ [paramKey]: digits || null });
  }

  return (
    <div className="grid gap-1.5">
      <Label className="text-slate-700" htmlFor={`price-${paramKey}`}>
        {label}
      </Label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
          R$
        </span>
        <Input
          id={`price-${paramKey}`}
          inputMode="numeric"
          className="pl-9"
          placeholder={paramKey === "minPrice" ? "30.000" : "80.000"}
          value={value ? Number(value).toLocaleString("pt-BR") : ""}
          onChange={(e) =>
            setValue(e.target.value.replace(/\D/g, "").slice(0, 9))
          }
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
        />
      </div>
    </div>
  );
}
