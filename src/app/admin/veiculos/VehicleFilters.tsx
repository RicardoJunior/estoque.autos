"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  ArrowUpDownIcon,
  Loader2Icon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import {
  VEHICLE_STATUSES,
  VEHICLE_STATUS_LABELS,
  type VehicleStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORTS: Record<string, string> = {
  recent: "Mais recentes",
  price_asc: "Menor preço",
  price_desc: "Maior preço",
  km_asc: "Menor km",
};

/** Mesmas cores do StatusBadge dos cards, para leitura rápida no select. */
const STATUS_DOTS: Record<VehicleStatus, string> = {
  available: "bg-emerald-400",
  reserved: "bg-amber-400",
  sold: "bg-muted-foreground",
  archived: "bg-muted-foreground/60",
};

export function VehicleFilters({ count }: { count: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const urlQ = params.get("q") ?? "";
  const status = params.get("status") ?? "all";
  const sort = params.get("sort") ?? "recent";

  // Estado da busca: `value` é o rascunho digitado; `applied` é o último q
  // que NÓS enviamos pra URL; `url` rastreia o q da URL pra detectar
  // navegações externas (voltar/avançar) e ressincronizar a caixa.
  const [q, setQ] = useState({ url: urlQ, value: urlQ, applied: urlQ });

  /** Aplica mudanças na URL sem recarregar; `null` remove o parâmetro. */
  function apply(updates: Record<string, string | null>) {
    if ("q" in updates) {
      const applied = updates.q ?? "";
      setQ((s) => ({ ...s, applied }));
    }
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

  // Ajuste de estado durante o render (padrão do React, sem efeito): se a URL
  // mudou por navegação externa, reflete na caixa; se foi o nosso próprio
  // replace aterrissando, preserva o que o usuário está digitando.
  if (q.url !== urlQ) {
    setQ((s) => ({
      url: urlQ,
      applied: urlQ,
      value: urlQ === s.applied ? s.value : urlQ,
    }));
  }

  // Busca textual com debounce.
  useEffect(() => {
    if (q.value === q.applied) return;
    const t = setTimeout(() => apply({ q: q.value || null }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hasFilters = urlQ !== "" || status !== "all" || sort !== "recent";

  function clearAll() {
    setQ((s) => ({ ...s, value: "" }));
    apply({ q: null, status: null, sort: null });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <InputGroup className="sm:max-w-xs">
          <InputGroupAddon>
            {isPending ? (
              <Loader2Icon className="animate-spin" aria-label="Atualizando…" />
            ) : (
              <SearchIcon />
            )}
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            className="[&::-webkit-search-cancel-button]:appearance-none"
            placeholder="Buscar por marca ou modelo…"
            aria-label="Buscar por marca ou modelo"
            value={q.value}
            onChange={(e) => {
              const value = e.target.value;
              setQ((s) => ({ ...s, value }));
            }}
          />
          {q.value !== "" && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label="Limpar busca"
                onClick={() => {
                  setQ((s) => ({ ...s, value: "" }));
                  apply({ q: null });
                }}
              >
                <XIcon />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>

        <div className="flex items-center gap-2">
          <Select
            value={status}
            onValueChange={(value) =>
              apply({ status: !value || value === "all" ? null : String(value) })
            }
          >
            <SelectTrigger
              aria-label="Filtrar por status"
              className="flex-1 sm:flex-initial"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {VEHICLE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  <span
                    aria-hidden
                    className={cn("size-2 rounded-full", STATUS_DOTS[s])}
                  />
                  {VEHICLE_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sort}
            onValueChange={(value) =>
              apply({ sort: !value || value === "recent" ? null : String(value) })
            }
          >
            <SelectTrigger aria-label="Ordenar" className="flex-1 sm:flex-initial">
              <ArrowUpDownIcon className="size-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SORTS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasFilters && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span aria-live="polite">
            {count === 1 ? "1 resultado" : `${count} resultados`}
          </span>
          <span aria-hidden>·</span>
          <Button
            variant="ghost"
            size="sm"
            className="-my-1 h-7 px-2 text-muted-foreground hover:text-foreground"
            onClick={clearAll}
          >
            <XIcon data-icon="inline-start" />
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
