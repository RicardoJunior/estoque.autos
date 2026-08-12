"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

/**
 * Lista de seleção múltipla em colunas com checkboxes, ordenada
 * alfabeticamente (pt-BR). Cada item marcado submete no FormData
 * como <input name={name} value={item}> — igual aos checkboxes de antes.
 */
export function CheckboxGrid({
  name,
  options,
  initial,
  searchable,
}: {
  name: string;
  options: readonly string[];
  initial?: readonly string[];
  /** mostra um filtro acima da grade (útil com muitos itens) */
  searchable?: boolean;
}) {
  const [query, setQuery] = useState("");
  const selected = new Set(initial ?? []);

  const ordered = [...options].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const q = query.trim().toLowerCase();
  const visible = q
    ? ordered.filter((o) => o.toLowerCase().includes(q))
    : ordered;

  return (
    <div className="space-y-3">
      {searchable && (
        <InputGroup className="max-w-64">
          <InputGroupAddon>
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder="Filtrar opcionais…"
            value={query}
            onChange={(ev) => setQuery(ev.target.value)}
          />
        </InputGroup>
      )}

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nada encontrado.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 md:grid-cols-3">
          {visible.map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-2.5 text-sm"
            >
              <Checkbox
                name={name}
                value={opt}
                defaultChecked={selected.has(opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
