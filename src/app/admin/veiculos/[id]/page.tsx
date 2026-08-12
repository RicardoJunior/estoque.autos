import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getSession, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { vehicleTitle } from "@/lib/format";
import { VehicleForm } from "../VehicleForm";
import { PhotoManager } from "./PhotoManager";
import { VehicleActions } from "./VehicleActions";
import { updateVehicleAction } from "../actions";
import { PageHeader } from "@/components/admin/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Vehicle } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.tenant) return { title: "Veículo" };
  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicles")
    .select("brand, model")
    .eq("id", id)
    .eq("tenant_id", session.tenant.id)
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
  const { tenant } = await requireStaff();
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
      <PageHeader
        title={vehicleTitle(vehicle)}
        backHref="/admin/veiculos"
        backLabel="Estoque"
      >
        <a
          href={`/${tenant.slug}/carros/${vehicle.id}`}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Ver no site
          <ExternalLink data-icon="inline-end" aria-hidden />
        </a>
      </PageHeader>

      {novo && (
        <Card className="bg-primary/5 p-4 text-sm ring-primary/20">
          ✅ Carro cadastrado! Agora adicione as fotos abaixo.
        </Card>
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
