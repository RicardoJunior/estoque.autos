"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FONT_CATEGORY_LABELS,
  specimenHref,
  type FontCategory,
  type GoogleFont,
} from "@/lib/google-fonts";
import { injectFontCss } from "@/lib/font-css";

const MAX_RESULTS = 60;

const CATEGORY_FILTERS: { id: FontCategory | "all"; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "sans", label: FONT_CATEGORY_LABELS.sans },
  { id: "serif", label: FONT_CATEGORY_LABELS.serif },
  { id: "display", label: FONT_CATEGORY_LABELS.display },
  { id: "handwriting", label: FONT_CATEGORY_LABELS.handwriting },
  { id: "mono", label: FONT_CATEGORY_LABELS.mono },
];

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Autocomplete sobre TODO o catálogo do Google Fonts (~1.9k famílias).
 * Cada opção renderiza o próprio nome na própria fonte: um stylesheet
 * subsetado (só os glifos do nome) é injetado quando a opção entra na
 * viewport — rolar a lista carrega os specimens sob demanda.
 */
export function FontPicker({
  label,
  value,
  catalog,
  onChange,
  renderTrigger,
}: {
  label: string;
  /** Família atual (nome exato do Google Fonts). */
  value: string;
  /** Catálogo carregado pelo pai (null enquanto carrega). */
  catalog: GoogleFont[] | null;
  onChange: (font: GoogleFont) => void;
  /** Substitui o botão padrão (ex.: card "Outras" no onboarding). */
  renderTrigger?: (open: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FontCategory | "all">("all");

  // o gatilho mostra a fonte atual nela mesma (com o meta do catálogo,
  // que sabe o peso certo para famílias sem o corte 400)
  useEffect(() => {
    if (!value) return;
    const meta = catalog?.find(
      (f) => f.f.toLowerCase() === value.toLowerCase(),
    );
    injectFontCss(specimenHref(meta ?? value));
  }, [value, catalog]);

  const { results, total } = useMemo(() => {
    if (!catalog) return { results: [] as GoogleFont[], total: 0 };
    const inCategory =
      category === "all" ? catalog : catalog.filter((f) => f.c === category);

    const q = normalize(query.trim());
    if (!q) {
      // navegação sem busca: só famílias com suporte a latin (as demais
      // continuam encontráveis digitando o nome)
      const browsable = inCategory.filter((f) => f.l === 1);
      return { results: browsable.slice(0, MAX_RESULTS), total: browsable.length };
    }

    const scored = inCategory
      .map((f) => {
        const name = normalize(f.f);
        const rank =
          name === q ? 0 : name.startsWith(q) ? 1 : name.includes(q) ? 2 : -1;
        return { f, rank };
      })
      .filter((x) => x.rank >= 0)
      .sort((a, b) => a.rank - b.rank || a.f.p - b.f.p);
    return {
      results: scored.slice(0, MAX_RESULTS).map((x) => x.f),
      total: scored.length,
    };
  }, [catalog, category, query]);

  function pick(font: GoogleFont) {
    onChange(font);
    setOpen(false);
  }

  return (
    <>
      {renderTrigger ? (
        renderTrigger(() => setOpen(true))
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-input bg-input/30 px-3 text-left transition hover:border-primary/40"
          aria-label={`${label}: ${value}`}
        >
          <span
            className="truncate text-sm text-foreground"
            style={{ fontFamily: `"${value}"` }}
          >
            {value}
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
        </button>
      )}

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={label}
        description="Buscar entre todas as fontes do Google Fonts"
        className="sm:max-w-md"
      >
        {/* CommandDialog (base-nova) não embute o root <Command>; sem ele o
            CommandInput fica sem o store do cmdk e quebra */}
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar fonte… (ex.: Montserrat)"
            value={query}
            onValueChange={setQuery}
            autoFocus
          />
          <div className="flex flex-wrap gap-1 px-2 pt-2">
            {CATEGORY_FILTERS.map((c) => (
              <Button
                key={c.id}
                type="button"
                size="xs"
                variant={category === c.id ? "secondary" : "ghost"}
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id)}
              >
                {c.label}
              </Button>
            ))}
          </div>
          <CommandList className="mt-1">
            {catalog === null ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-7 w-full" />
                ))}
              </div>
            ) : (
              <>
                <CommandEmpty>Nenhuma fonte encontrada.</CommandEmpty>
                {results.map((font) => (
                  <FontOption
                    key={font.f}
                    font={font}
                    selected={font.f === value}
                    onPick={pick}
                  />
                ))}
              </>
            )}
          </CommandList>
          {catalog !== null && total > results.length && (
            <div className="border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">
              Mostrando {results.length} de {total} fontes — continue digitando
              para refinar.
            </div>
          )}
        </Command>
      </CommandDialog>
    </>
  );
}

function FontOption({
  font,
  selected,
  onPick,
}: {
  font: GoogleFont;
  selected: boolean;
  onPick: (font: GoogleFont) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (seen) {
      injectFontCss(specimenHref(font));
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setSeen(true);
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, font]);

  return (
    <CommandItem
      value={font.f}
      data-checked={selected}
      onSelect={() => onPick(font)}
    >
      <div ref={ref} className="flex w-full items-center justify-between gap-3">
        <span
          className="truncate text-[15px] leading-6 text-foreground"
          style={{ fontFamily: seen ? `"${font.f}"` : undefined }}
        >
          {font.f}
        </span>
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground/70">
          {FONT_CATEGORY_LABELS[font.c]}
        </span>
      </div>
    </CommandItem>
  );
}
