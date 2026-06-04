"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  FUELS,
  FUEL_LABELS,
  TRANSMISSIONS,
  TRANSMISSION_LABELS,
  VEHICLE_CATEGORIES,
  CATEGORY_LABELS,
  type Vehicle,
  type VehicleCategory,
} from "@/lib/types";
import { FipePicker, type FipeFill } from "./FipePicker";
import { COMMON_OPTIONALS } from "@/lib/optionals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VehicleFormState } from "./actions";

type Action = (
  prev: VehicleFormState,
  formData: FormData,
) => Promise<VehicleFormState>;

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando…" : children}
    </Button>
  );
}

export function VehicleForm({
  action,
  initial,
  submitLabel,
}: {
  action: Action;
  initial?: Vehicle;
  submitLabel: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<VehicleFormState, FormData>(
    action,
    {},
  );
  const e = state.fieldErrors ?? {};
  const selectedOptionals = new Set(initial?.optionals ?? []);

  // controlados: a cascata FIPE preenche e o lojista pode ajustar
  const [category, setCategory] = useState<VehicleCategory>(
    initial?.category ?? "carro",
  );
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [yearFab, setYearFab] = useState(initial?.year_fab?.toString() ?? "");
  const [yearModel, setYearModel] = useState(
    initial?.year_model?.toString() ?? "",
  );
  const [fuel, setFuel] = useState<string>(initial?.fuel ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");

  function applyFipe(fill: FipeFill) {
    if (fill.brand) setBrand(fill.brand);
    if (fill.model) setModel(fill.model);
    if (fill.year_model) setYearModel(String(fill.year_model));
    if (fill.year_fab) setYearFab(String(fill.year_fab));
    if (fill.fuel) setFuel(fill.fuel);
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg bg-primary/10 px-3.5 py-2.5 text-sm text-primary">
          ✓ Alterações salvas.
        </div>
      )}

      {/* Identificação — cascata FIPE primeiro, campos editáveis embaixo */}
      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              name="category"
              value={category}
              onValueChange={(v) => setCategory((v ?? "carro") as VehicleCategory)}
            >
              <SelectTrigger id="category" className="w-full sm:max-w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {e.category && <p className="text-xs text-destructive">{e.category}</p>}
          </div>

          <FipePicker
            category={category}
            initialSnapshot={
              initial?.fipe_code &&
              initial.fipe_year_id &&
              initial.fipe_price != null &&
              initial.fipe_reference
                ? {
                    fipe_code: initial.fipe_code,
                    fipe_year_id: initial.fipe_year_id,
                    fipe_price: initial.fipe_price,
                    fipe_reference: initial.fipe_reference,
                  }
                : null
            }
            onFill={applyFipe}
            onUsePrice={(p) => setPrice(String(p))}
          />

          <p className="text-xs text-muted-foreground">
            Buscar pela FIPE preenche os campos abaixo — ajuste o que quiser.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                name="brand"
                required
                value={brand}
                onChange={(ev) => setBrand(ev.target.value)}
                placeholder="Honda"
              />
              {e.brand && <p className="text-xs text-destructive">{e.brand}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                name="model"
                required
                value={model}
                onChange={(ev) => setModel(ev.target.value)}
                placeholder="Civic"
              />
              {e.model && <p className="text-xs text-destructive">{e.model}</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="version">Versão</Label>
              <Input id="version" name="version" defaultValue={initial?.version ?? ""} placeholder="EXL 2.0" />
              {e.version && <p className="text-xs text-destructive">{e.version}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ficha técnica */}
      <Card>
        <CardHeader>
          <CardTitle>Ficha técnica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="year_fab">Ano fabricação</Label>
              <Input
                id="year_fab"
                name="year_fab"
                type="number"
                inputMode="numeric"
                value={yearFab}
                onChange={(ev) => setYearFab(ev.target.value)}
                placeholder="2021"
              />
              {e.year_fab && <p className="text-xs text-destructive">{e.year_fab}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="year_model">Ano modelo</Label>
              <Input
                id="year_model"
                name="year_model"
                type="number"
                inputMode="numeric"
                value={yearModel}
                onChange={(ev) => setYearModel(ev.target.value)}
                placeholder="2022"
              />
              {e.year_model && <p className="text-xs text-destructive">{e.year_model}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mileage">Quilometragem</Label>
              <Input id="mileage" name="mileage" type="number" inputMode="numeric" defaultValue={initial?.mileage ?? ""} placeholder="32000" />
              {e.mileage && <p className="text-xs text-destructive">{e.mileage}</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="fuel">Combustível</Label>
              <Select
                name="fuel"
                value={fuel}
                onValueChange={(v) => setFuel(String(v ?? ""))}
              >
                <SelectTrigger id="fuel" className="w-full">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">—</SelectItem>
                  {FUELS.map((f) => (
                    <SelectItem key={f} value={f}>{FUEL_LABELS[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {e.fuel && <p className="text-xs text-destructive">{e.fuel}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="transmission">Câmbio</Label>
              <Select name="transmission" defaultValue={initial?.transmission ?? ""}>
                <SelectTrigger id="transmission" className="w-full">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">—</SelectItem>
                  {TRANSMISSIONS.map((t) => (
                    <SelectItem key={t} value={t}>{TRANSMISSION_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {e.transmission && <p className="text-xs text-destructive">{e.transmission}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="doors">Portas</Label>
              <Input id="doors" name="doors" type="number" inputMode="numeric" defaultValue={initial?.doors ?? ""} placeholder="4" />
              {e.doors && <p className="text-xs text-destructive">{e.doors}</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="color">Cor</Label>
              <Input id="color" name="color" defaultValue={initial?.color ?? ""} placeholder="Prata" />
              {e.color && <p className="text-xs text-destructive">{e.color}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plate">Placa (uso interno)</Label>
              <Input id="plate" name="plate" defaultValue={initial?.plate ?? ""} placeholder="ABC1D23" />
              {e.plate ? (
                <p className="text-xs text-destructive">{e.plate}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Não aparece no site público.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opcionais */}
      <Card>
        <CardHeader>
          <CardTitle>Opcionais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {COMMON_OPTIONALS.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="optionals"
                  value={opt}
                  defaultChecked={selectedOptionals.has(opt)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                {opt}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preço e descrição */}
      <Card>
        <CardHeader>
          <CardTitle>Anúncio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                inputMode="numeric"
                step="100"
                required
                value={price}
                onChange={(ev) => setPrice(ev.target.value)}
                placeholder="132900"
              />
              {e.price && <p className="text-xs text-destructive">{e.price}</p>}
            </div>
            <label className="flex items-end gap-2 pb-2.5 text-sm">
              <Switch name="featured" defaultChecked={initial?.featured} />
              Marcar como destaque na vitrine
            </label>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              className="min-h-28"
              defaultValue={initial?.description ?? ""}
              placeholder="Único dono, todas as revisões em concessionária…"
            />
            {e.description && <p className="text-xs text-destructive">{e.description}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
