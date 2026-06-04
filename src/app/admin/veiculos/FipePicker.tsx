"use client";

import { useCallback, useState } from "react";
import { ChevronsUpDown, Loader2, X } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/format";
import { fipeTypeForCategory } from "@/lib/fipe/types";
import type { Fuel, VehicleCategory } from "@/lib/types";

// ============================================================
// Cascata FIPE: Marca → Modelo → Ano, com autocomplete e valor
// da tabela (estilo Webmotors). Preenche os campos do form via
// onFill e grava o snapshot fipe_* em inputs hidden próprios.
// Opcional — o cadastro manual continua funcionando sem ela.
// ============================================================

interface Ref {
  id: string;
  name: string;
}

interface PriceInfo {
  fipe_code: string;
  price: number;
  reference: string;
  year_model: number | null;
  fuel: string | null;
  year_id: string;
}

export interface FipeFill {
  brand?: string;
  model?: string;
  year_model?: number;
  year_fab?: number;
  fuel?: Fuel;
}

export interface FipeSnapshot {
  fipe_code: string;
  fipe_year_id: string;
  fipe_price: number;
  fipe_reference: string;
}

/** FIPE marca o combustível no sufixo do yearCode (1=G, 2=A, 3=D). */
function fuelFromFipe(yearId: string, label: string | null): Fuel | undefined {
  if (/zero km/i.test(label ?? "")) return undefined;
  const suffix = yearId.split("-")[1];
  if (suffix === "1") return "gasolina";
  if (suffix === "2") return "etanol";
  if (suffix === "3") return "diesel";
  return undefined;
}

function PickerButton({
  label,
  value,
  placeholder,
  disabled,
  onClick,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 text-left text-sm shadow-xs transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={value ? "truncate" : "truncate text-muted-foreground"}>
          {value ?? placeholder}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
      </button>
    </div>
  );
}

export function FipePicker({
  category,
  initialSnapshot,
  onFill,
  onUsePrice,
}: {
  category: VehicleCategory;
  initialSnapshot?: FipeSnapshot | null;
  onFill: (fill: FipeFill) => void;
  onUsePrice: (price: number) => void;
}) {
  const type = fipeTypeForCategory(category);

  const [brand, setBrand] = useState<Ref | null>(null);
  const [model, setModel] = useState<Ref | null>(null);
  const [year, setYear] = useState<Ref | null>(null);
  const [price, setPrice] = useState<PriceInfo | null>(null);

  const [openList, setOpenList] = useState<"brand" | "model" | "year" | null>(null);
  const [options, setOptions] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);

  // snapshot existente (modo edição), preservado no submit até o
  // lojista refazer a busca ou limpar explicitamente
  const existing = !price && !cleared && initialSnapshot ? initialSnapshot : null;

  // o que vai no submit: nova seleção > snapshot existente > nada
  const snapshot: FipeSnapshot | null = price
    ? {
        fipe_code: price.fipe_code,
        fipe_year_id: price.year_id,
        fipe_price: price.price,
        fipe_reference: price.reference,
      }
    : existing;

  const load = useCallback(
    async (which: "brand" | "model" | "year") => {
      setOpenList(which);
      setOptions([]);
      setError(null);
      setLoading(true);
      try {
        const params = new URLSearchParams({ type });
        let resource = "brands";
        if (which === "model" && brand) {
          resource = "models";
          params.set("brand", brand.id);
        } else if (which === "year" && brand && model) {
          resource = "years";
          params.set("brand", brand.id);
          params.set("model", model.id);
        }
        const res = await fetch(`/api/fipe/${resource}?${params}`);
        if (!res.ok) throw new Error(await res.text());
        setOptions((await res.json()) as Ref[]);
      } catch {
        setError("Não foi possível consultar a FIPE agora. Preencha manualmente.");
        setOpenList(null);
      } finally {
        setLoading(false);
      }
    },
    [type, brand, model],
  );

  async function fetchPrice(selectedYear: Ref) {
    if (!brand || !model) return;
    setPriceLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        type,
        brand: brand.id,
        model: model.id,
        year: selectedYear.id,
      });
      const res = await fetch(`/api/fipe/price?${params}`);
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as PriceInfo;
      setPrice(data);
      onFill({
        brand: brand.name,
        model: model.name,
        year_model: data.year_model ?? undefined,
        year_fab: data.year_model ?? undefined,
        fuel: fuelFromFipe(selectedYear.id, selectedYear.name),
      });
    } catch {
      setError("Valor FIPE indisponível no momento — os campos seguem editáveis.");
    } finally {
      setPriceLoading(false);
    }
  }

  function select(item: Ref) {
    setOpenList(null);
    if (openList === "brand") {
      setBrand(item);
      setModel(null);
      setYear(null);
      setPrice(null);
    } else if (openList === "model") {
      setModel(item);
      setYear(null);
      setPrice(null);
    } else if (openList === "year") {
      setYear(item);
      void fetchPrice(item);
    }
  }

  function reset() {
    setBrand(null);
    setModel(null);
    setYear(null);
    setPrice(null);
    setError(null);
    setCleared(true);
  }

  const dialogTitle =
    openList === "brand" ? "Marca" : openList === "model" ? "Modelo" : "Ano";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <PickerButton
          label="Marca (FIPE)"
          value={brand?.name ?? null}
          placeholder="Buscar marca…"
          onClick={() => void load("brand")}
        />
        <PickerButton
          label="Modelo"
          value={model?.name ?? null}
          placeholder={brand ? "Buscar modelo…" : "Escolha a marca"}
          disabled={!brand}
          onClick={() => void load("model")}
        />
        <PickerButton
          label="Ano"
          value={year?.name ?? null}
          placeholder={model ? "Escolher ano…" : "Escolha o modelo"}
          disabled={!model}
          onClick={() => void load("year")}
        />
      </div>

      {/* snapshot fipe_* vai junto no submit do form pai */}
      {snapshot && (
        <>
          <input type="hidden" name="fipe_code" value={snapshot.fipe_code} />
          <input type="hidden" name="fipe_year_id" value={snapshot.fipe_year_id} />
          <input type="hidden" name="fipe_price" value={snapshot.fipe_price} />
          <input type="hidden" name="fipe_reference" value={snapshot.fipe_reference} />
        </>
      )}

      {priceLoading && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Consultando valor na tabela FIPE…
        </p>
      )}

      {price && !priceLoading && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <div>
            <p className="text-sm font-semibold">
              Tabela FIPE:{" "}
              <span className="text-primary">{formatPrice(price.price)}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Código {price.fipe_code} · referência {price.reference} ·
              atualizado todo mês
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onUsePrice(price.price)}
            >
              Usar como preço do anúncio
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={reset}
              aria-label="Limpar seleção FIPE"
            >
              <X className="size-4" aria-hidden />
              Limpar
            </Button>
          </div>
        </div>
      )}

      {existing && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
          <div>
            <p className="text-sm">
              Tabela FIPE:{" "}
              <span className="font-semibold text-primary">
                {formatPrice(existing.fipe_price)}
              </span>{" "}
              <span className="text-xs text-muted-foreground">
                (código {existing.fipe_code} · referência {existing.fipe_reference})
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Para atualizar o vínculo FIPE, refaça a busca acima.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={reset}
            aria-label="Remover vínculo FIPE"
          >
            <X className="size-4" aria-hidden />
            Remover vínculo
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <CommandDialog
        open={openList !== null}
        onOpenChange={(open) => !open && setOpenList(null)}
        title={`Selecionar ${dialogTitle}`}
        description="Busque e selecione uma opção da tabela FIPE"
      >
        {/* CommandDialog (base-nova) não embute o root <Command>; sem ele
            o CommandInput fica sem o store do cmdk e quebra */}
        <Command>
          <CommandInput placeholder={`Buscar ${dialogTitle.toLowerCase()}…`} autoFocus />
          <CommandList>
            {loading ? (
              <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Carregando…
              </p>
            ) : (
              <>
                <CommandEmpty>Nada encontrado.</CommandEmpty>
                {options.map((o) => (
                  <CommandItem key={o.id} value={o.name} onSelect={() => select(o)}>
                    {o.name}
                  </CommandItem>
                ))}
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}
