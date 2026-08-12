"use client";

import { useState } from "react";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

/**
 * Seleção múltipla em chips (substitui paredões de checkbox).
 * Cada chip selecionado vira um <input hidden name={name}> — o server
 * recebe formData.getAll(name), igual aos checkboxes de antes.
 */
export function ChipPicker({
  name,
  options,
  labels,
  initial,
  searchable,
  warnValues,
  alphabetical,
}: {
  name: string;
  options: readonly string[];
  /** rótulo por valor; ausente = o próprio valor */
  labels?: Record<string, string>;
  initial?: readonly string[];
  /** acima de ~15 opções, mostra busca */
  searchable?: boolean;
  /** valores que rendem em tom de aviso (ex.: leilão/alienado) */
  warnValues?: readonly string[];
  /** ordena os chips pelo rótulo (pt-BR) */
  alphabetical?: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initial ?? []),
  );
  const [query, setQuery] = useState("");

  const ordered = alphabetical
    ? [...options].sort((a, b) =>
        (labels?.[a] ?? a).localeCompare(labels?.[b] ?? b, "pt-BR"),
      )
    : options;
  const q = query.trim().toLowerCase();
  const visible = q
    ? ordered.filter((o) => (labels?.[o] ?? o).toLowerCase().includes(q))
    : ordered;

  function toggle(value: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {searchable && (
        <InputGroup className="max-w-64">
          <InputGroupAddon>
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder="Filtrar…"
            value={query}
            onChange={(ev) => setQuery(ev.target.value)}
          />
        </InputGroup>
      )}

      <div className="flex flex-wrap gap-2">
        {visible.map((value) => {
          const on = selected.has(value);
          const warn = warnValues?.includes(value);
          return (
            <button
              key={value}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                on
                  ? warn
                    ? "border-amber-500/60 bg-amber-500/15 text-amber-500"
                    : "border-primary/60 bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {on && <Check className="size-3.5" aria-hidden />}
              {labels?.[value] ?? value}
            </button>
          );
        })}
        {visible.length === 0 && (
          <p className="text-sm text-muted-foreground">Nada encontrado.</p>
        )}
      </div>

      {[...selected].map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}

      {selected.size > 0 && (
        <p className="text-xs text-muted-foreground">
          {selected.size} selecionado{selected.size > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
