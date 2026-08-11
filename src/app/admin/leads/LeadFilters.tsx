"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Loader2Icon, SearchIcon, XIcon } from "lucide-react";
import type { LeadStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/** Rótulos no plural (aba de listagem), com o dot na cor do LeadStatusPill. */
const STATUS_TABS: { key: "all" | LeadStatus; label: string; dot?: string }[] = [
  { key: "all", label: "Todos" },
  { key: "new", label: "Novos", dot: "bg-blue-400" },
  { key: "in_progress", label: "Em atendimento", dot: "bg-amber-400" },
  { key: "won", label: "Convertidos", dot: "bg-emerald-400" },
  { key: "lost", label: "Perdidos", dot: "bg-muted-foreground" },
];

export function LeadFilters({ count }: { count: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const urlQ = params.get("q") ?? "";
  const urlStatus = params.get("status") ?? "";
  const active: "all" | LeadStatus = STATUS_TABS.some(
    (t) => t.key === urlStatus,
  )
    ? (urlStatus as LeadStatus)
    : "all";

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

  const hasFilters = urlQ !== "" || active !== "all";

  function clearAll() {
    setQ((s) => ({ ...s, value: "" }));
    apply({ q: null, status: null });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <ToggleGroup
          aria-label="Filtrar por status"
          className="flex-wrap"
          value={[active]}
          onValueChange={(values) => {
            const value = values[0];
            // Clicar na pill ativa desmarca (values vazio): mantém a seleção.
            if (!value || value === active) return;
            apply({ status: value === "all" ? null : value });
          }}
        >
          {STATUS_TABS.map((t) => (
            <ToggleGroupItem
              key={t.key}
              value={t.key}
              size="sm"
              variant="outline"
              className="rounded-full px-3.5 aria-pressed:border-transparent aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary aria-pressed:hover:text-primary-foreground"
            >
              {t.dot && (
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 rounded-full group-aria-pressed/toggle:bg-primary-foreground/70",
                    t.dot,
                  )}
                />
              )}
              {t.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <InputGroup className="sm:w-64">
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
            placeholder="Buscar por nome ou telefone…"
            aria-label="Buscar por nome ou telefone"
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
      </div>

      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <span aria-live="polite">
          {count === 1 ? "1 lead" : `${count} leads`}
          {hasFilters ? " com esses filtros" : ""}
        </span>
        {hasFilters && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
