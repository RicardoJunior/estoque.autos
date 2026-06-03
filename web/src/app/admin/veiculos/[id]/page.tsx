import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { vehicleTitle } from "@/lib/format";
import { VehicleForm } from "../VehicleForm";
import { PhotoManager } from "./PhotoManager";
import { VehicleActions } from "./VehicleActions";
import { updateVehicleAction } from "../actions";
import type { Vehicle } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicles")
    .select("brand, model")
    .eq("id", id)
    .single();
  return { title: data ? `${data.brand} ${data.model}` : "Veículo" };
}

export default async function EditVehiclePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ novo?: string }>;
}) {
  const { tenant } = await requireTenant();
  const { id } = await params;
  const { novo } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .single();

  if (!data) notFound();
  const vehicle = data as Vehicle;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link
          href="/admin/veiculos"
          className="text-sm text-[var(--color-ink-soft)] hover:underline"
        >
          ← Estoque
        </Link>
        <div className="mt-1 flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold">{vehicleTitle(vehicle)}</h1>
          <a
            href={`/${tenant.slug}/carros/${vehicle.id}`}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-sm font-medium text-[var(--color-brand)] hover:underline"
          >
            Ver no site ↗
          </a>
        </div>
      </div>

      {novo && (
        <div className="card border-[var(--color-brand)]/20 bg-[var(--color-brand)]/5 p-4 text-sm">
          ✅ Carro cadastrado! Agora adicione as fotos abaixo.
        </div>
      )}

      <PhotoManager vehicleId={vehicle.id} initial={vehicle.photos ?? []} />

      <VehicleActions vehicleId={vehicle.id} status={vehicle.status} />

      <VehicleForm
        action={updateVehicleAction.bind(null, vehicle.id)}
        initial={vehicle}
        submitLabel="Salvar alterações"
      />
    </div>
  );
}
