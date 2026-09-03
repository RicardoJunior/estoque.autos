"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Megaphone } from "lucide-react";
import {
  BODY_TYPES,
  BODY_TYPE_LABELS,
  FUELS,
  FUEL_LABELS,
  STEERINGS,
  STEERING_LABELS,
  TRANSMISSIONS,
  TRANSMISSION_LABELS,
  VEHICLE_CATEGORIES,
  CATEGORY_LABELS,
  VEHICLE_FLAGS,
  VEHICLE_FLAG_LABELS,
  type Vehicle,
  type VehicleCategory,
} from "@/lib/types";
import { FipePicker, type FipeFill } from "./FipePicker";
import { PhotoStage } from "./PhotoStage";
import type { FormPortal } from "./portals-data";
import { Checkbox } from "@/components/ui/checkbox";
import { COMMON_OPTIONALS, VEHICLE_COLORS } from "@/lib/optionals";
import { ChipPicker } from "@/components/admin/ChipPicker";
import { CheckboxGrid } from "@/components/admin/CheckboxGrid";
import {
  MoneyInput,
  SuffixNumberInput,
} from "@/components/admin/masked-inputs";
import { FormBanner } from "@/components/admin/FormBanner";
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
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Salvando…" : children}
    </Button>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans text-base font-semibold tracking-normal">
          {title}
        </CardTitle>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-destructive">{msg}</p> : null;
}

export function VehicleForm({
  action,
  initial,
  submitLabel,
  withPhotoStage,
  portals = [],
}: {
  action: Action;
  initial?: Vehicle;
  submitLabel: string;
  /** cadastro novo: fotos sobem junto (staging) */
  withPhotoStage?: boolean;
  /** portais conectados (plano Pro) — seção "Publicar em" */
  portals?: FormPortal[];
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<VehicleFormState, FormData>(
    action,
    {},
  );
  const e = state.fieldErrors ?? {};

  // controlados: a busca FIPE preenche e o lojista ajusta à vontade
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
    <form action={formAction} className="space-y-5">
      {state.error && <FormBanner variant="error">{state.error}</FormBanner>}
      {state.success && (
        <FormBanner variant="success">Alterações salvas.</FormBanner>
      )}

      <Section title="Identificação">
        <div className="grid gap-2">
          <Label htmlFor="category">Categoria</Label>
          <Select
            name="category"
            value={category}
            onValueChange={(v) =>
              setCategory((v ?? "carro") as VehicleCategory)
            }
          >
            <SelectTrigger id="category" className="w-full sm:max-w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="start">
              {VEHICLE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError msg={e.category} />
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

        <div className="grid gap-4 sm:grid-cols-3">
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
            <FieldError msg={e.brand} />
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
            <FieldError msg={e.model} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="version">Versão</Label>
            <Input
              id="version"
              name="version"
              defaultValue={initial?.version ?? ""}
              placeholder="EXL 2.0"
            />
            <FieldError msg={e.version} />
          </div>
        </div>
      </Section>

      <Section title="Ficha técnica">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="year_fab">Ano de fabricação</Label>
            <Input
              id="year_fab"
              name="year_fab"
              type="number"
              inputMode="numeric"
              value={yearFab}
              onChange={(ev) => setYearFab(ev.target.value)}
              placeholder="2021"
            />
            <FieldError msg={e.year_fab} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="year_model">Ano do modelo</Label>
            <Input
              id="year_model"
              name="year_model"
              type="number"
              inputMode="numeric"
              value={yearModel}
              onChange={(ev) => setYearModel(ev.target.value)}
              placeholder="2022"
            />
            <FieldError msg={e.year_model} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mileage">Quilometragem</Label>
            <SuffixNumberInput
              id="mileage"
              name="mileage"
              suffix="km"
              defaultValue={initial?.mileage ?? ""}
              placeholder="32.000"
            />
            <FieldError msg={e.mileage} />
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
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} align="start">
                {FUELS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {FUEL_LABELS[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError msg={e.fuel} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="transmission">Câmbio</Label>
            <Select name="transmission" defaultValue={initial?.transmission ?? ""}>
              <SelectTrigger id="transmission" className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} align="start">
                {TRANSMISSIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TRANSMISSION_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError msg={e.transmission} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="doors">Portas</Label>
            <Input
              id="doors"
              name="doors"
              type="number"
              inputMode="numeric"
              defaultValue={initial?.doors ?? ""}
              placeholder="4"
            />
            <FieldError msg={e.doors} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="color">Cor</Label>
            <Select name="color" defaultValue={initial?.color ?? ""}>
              <SelectTrigger id="color" className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} align="start">
                {VEHICLE_COLORS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
                {initial?.color &&
                  !VEHICLE_COLORS.includes(
                    initial.color as (typeof VEHICLE_COLORS)[number],
                  ) && (
                    <SelectItem value={initial.color}>{initial.color}</SelectItem>
                  )}
              </SelectContent>
            </Select>
            <FieldError msg={e.color} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="plate">Placa</Label>
            <Input
              id="plate"
              name="plate"
              defaultValue={initial?.plate ?? ""}
              placeholder="ABC1D23"
            />
            <p className="text-xs text-muted-foreground">
              Não aparece no site. Os portais (OLX, Mercado Livre) usam para
              validar o anúncio.
            </p>
            <FieldError msg={e.plate} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="body_type">Carroceria</Label>
            <Select name="body_type" defaultValue={initial?.body_type ?? ""}>
              <SelectTrigger id="body_type" className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} align="start">
                {BODY_TYPES.map((b) => (
                  <SelectItem key={b} value={b}>
                    {BODY_TYPE_LABELS[b]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError msg={e.body_type} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="engine">Motor</Label>
            <Input
              id="engine"
              name="engine"
              defaultValue={initial?.engine ?? ""}
              placeholder="1.0 turbo"
              maxLength={40}
            />
            <FieldError msg={e.engine} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="steering">Direção</Label>
            <Select name="steering" defaultValue={initial?.steering ?? ""}>
              <SelectTrigger id="steering" className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} align="start">
                {STEERINGS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STEERING_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError msg={e.steering} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <div className="grid gap-2">
            <Label htmlFor="vin_last6">Final do chassi</Label>
            <Input
              id="vin_last6"
              name="vin_last6"
              defaultValue={initial?.vin_last6 ?? ""}
              placeholder="6 últimos"
              maxLength={6}
              className="uppercase"
            />
            <p className="text-xs text-muted-foreground">
              Uso interno — pedido pelo Mercado Livre.
            </p>
            <FieldError msg={e.vin_last6} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="video_url">Vídeo (YouTube)</Label>
            <Input
              id="video_url"
              name="video_url"
              type="url"
              defaultValue={initial?.video_url ?? ""}
              placeholder="https://youtube.com/watch?v=…"
            />
            <FieldError msg={e.video_url} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Switch name="zero_km" defaultChecked={initial?.zero_km} />
          Veículo 0 km
        </label>
      </Section>

      {withPhotoStage && (
        <Section
          title="Fotos"
          hint="Suba as fotos agora mesmo — o anúncio já nasce completo."
        >
          <PhotoStage />
        </Section>
      )}

      <Section
        title="Condição do veículo"
        hint="Viram selos no anúncio. “Veículo de leilão” e “Alienado” são divulgação de procedência e aparecem em tom de aviso."
      >
        <ChipPicker
          name="condition_flags"
          options={VEHICLE_FLAGS}
          labels={VEHICLE_FLAG_LABELS}
          initial={initial?.condition_flags ?? []}
          warnValues={["leilao", "alienado"]}
        />
      </Section>

      <Section title="Opcionais">
        <CheckboxGrid
          name="optionals"
          options={COMMON_OPTIONALS}
          initial={initial?.optionals ?? []}
          searchable
        />
      </Section>

      <Section title="Anúncio">
        <div className="grid items-end gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="price">Preço</Label>
            <MoneyInput
              id="price"
              name="price"
              required
              value={price}
              onValueChange={setPrice}
              placeholder="132.900"
            />
            <FieldError msg={e.price} />
          </div>
          <div className="grid gap-2 pb-2">
            <label className="flex items-center gap-2 text-sm">
              <Switch name="featured" defaultChecked={initial?.featured} />
              Destaque na vitrine
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch name="consigned" defaultChecked={initial?.consigned} />
              Veículo consignado
            </label>
            <p className="text-xs text-muted-foreground">
              Consignado: você vende em nome de terceiro. É um controle
              interno — não aparece no site.
            </p>
          </div>
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
          <FieldError msg={e.description} />
        </div>
      </Section>

      {portals.length > 0 && (
        <Section
          title="Publicar em"
          hint="Marque onde este carro deve ser anunciado. A publicação acontece em segundo plano; acompanhe o status na página do carro."
        >
          <input type="hidden" name="portals_present" value="1" />
          <div className="space-y-3">
            {portals.map((p) => (
              <div key={p.portal} className="space-y-1.5">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <Checkbox name="portals" value={p.portal} defaultChecked={p.checked} />
                  <Megaphone className="size-4 text-muted-foreground" aria-hidden />
                  <span className="font-medium">{p.label}</span>
                </label>
                {p.attention && (
                  <FormBanner variant="neutral" className="ml-7">
                    {p.attention}
                  </FormBanner>
                )}
                {!p.attention && p.missing.length > 0 && (
                  <FormBanner variant="neutral" className="ml-7">
                    Para publicar no {p.label} ainda falta: {p.missing.join(", ")}.
                  </FormBanner>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* barra de ação grudada no rodapé: salvar sempre à mão num form longo */}
      <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-background/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancelar
          </Button>
          <SubmitButton>{submitLabel}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
