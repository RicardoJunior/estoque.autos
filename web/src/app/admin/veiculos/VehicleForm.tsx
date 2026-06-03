"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  FUELS,
  FUEL_LABELS,
  TRANSMISSIONS,
  TRANSMISSION_LABELS,
  VEHICLE_CATEGORIES,
  CATEGORY_LABELS,
  type Vehicle,
} from "@/lib/types";
import { COMMON_OPTIONALS } from "@/lib/optionals";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { VehicleFormState } from "./actions";

type Action = (
  prev: VehicleFormState,
  formData: FormData,
) => Promise<VehicleFormState>;

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

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-[var(--radius)] bg-red-50 px-3.5 py-2.5 text-sm text-[var(--color-danger)]">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-[var(--radius)] bg-green-50 px-3.5 py-2.5 text-sm text-[var(--color-success)]">
          ✓ Alterações salvas.
        </div>
      )}

      {/* Identificação */}
      <fieldset className="card space-y-4 p-5">
        <legend className="px-1 text-sm font-semibold">Identificação</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Marca" name="brand" required defaultValue={initial?.brand} error={e.brand} placeholder="Honda" />
          <Field label="Modelo" name="model" required defaultValue={initial?.model} error={e.model} placeholder="Civic" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Versão" name="version" defaultValue={initial?.version ?? ""} error={e.version} placeholder="EXL 2.0" />
          <Field label="Categoria" name="category" error={e.category}>
            <select name="category" className="field" defaultValue={initial?.category ?? "carro"}>
              {VEHICLE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </Field>
        </div>
      </fieldset>

      {/* Ficha técnica */}
      <fieldset className="card space-y-4 p-5">
        <legend className="px-1 text-sm font-semibold">Ficha técnica</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Ano fabricação" name="year_fab" type="number" inputMode="numeric" defaultValue={initial?.year_fab ?? ""} error={e.year_fab} placeholder="2021" />
          <Field label="Ano modelo" name="year_model" type="number" inputMode="numeric" defaultValue={initial?.year_model ?? ""} error={e.year_model} placeholder="2022" />
          <Field label="Quilometragem" name="mileage" type="number" inputMode="numeric" defaultValue={initial?.mileage ?? ""} error={e.mileage} placeholder="32000" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Combustível" name="fuel" error={e.fuel}>
            <select name="fuel" className="field" defaultValue={initial?.fuel ?? ""}>
              <option value="">—</option>
              {FUELS.map((f) => (
                <option key={f} value={f}>{FUEL_LABELS[f]}</option>
              ))}
            </select>
          </Field>
          <Field label="Câmbio" name="transmission" error={e.transmission}>
            <select name="transmission" className="field" defaultValue={initial?.transmission ?? ""}>
              <option value="">—</option>
              {TRANSMISSIONS.map((t) => (
                <option key={t} value={t}>{TRANSMISSION_LABELS[t]}</option>
              ))}
            </select>
          </Field>
          <Field label="Portas" name="doors" type="number" inputMode="numeric" defaultValue={initial?.doors ?? ""} error={e.doors} placeholder="4" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cor" name="color" defaultValue={initial?.color ?? ""} error={e.color} placeholder="Prata" />
          <Field label="Placa (uso interno)" name="plate" defaultValue={initial?.plate ?? ""} error={e.plate} placeholder="ABC1D23" hint="Não aparece no site público." />
        </div>
      </fieldset>

      {/* Opcionais */}
      <fieldset className="card space-y-3 p-5">
        <legend className="px-1 text-sm font-semibold">Opcionais</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {COMMON_OPTIONALS.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="optionals"
                value={opt}
                defaultChecked={selectedOptionals.has(opt)}
                className="h-4 w-4 rounded border-slate-300"
              />
              {opt}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Preço e descrição */}
      <fieldset className="card space-y-4 p-5">
        <legend className="px-1 text-sm font-semibold">Anúncio</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Preço (R$)" name="price" type="number" inputMode="numeric" step="100" required defaultValue={initial?.price ?? ""} error={e.price} placeholder="132900" />
          <label className="flex items-end gap-2 pb-2.5 text-sm">
            <input type="checkbox" name="featured" defaultChecked={initial?.featured} className="h-4 w-4 rounded border-slate-300" />
            Marcar como destaque na vitrine
          </label>
        </div>
        <Field label="Descrição" name="description" error={e.description}>
          <textarea
            name="description"
            className="field min-h-28"
            defaultValue={initial?.description ?? ""}
            placeholder="Único dono, todas as revisões em concessionária…"
          />
        </Field>
      </fieldset>

      <div className="flex items-center justify-end gap-3">
        <button type="button" className="btn-ghost" onClick={() => router.back()}>
          Cancelar
        </button>
        <SubmitButton pendingLabel="Salvando…" className="btn-primary">
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
