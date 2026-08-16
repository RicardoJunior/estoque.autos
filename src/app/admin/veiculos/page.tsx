import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { requireTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatKm, vehicleTitle } from "@/lib/format";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VehicleFilters } from "./VehicleFilters";
import { VehicleQuickActions } from "./VehicleQuickActions";
import type { Vehicle, VehicleStatus } from "@/lib/types";

export const metadata = { title: "Estoque" };

const SORT_COLUMNS: Record<string, { col: string; asc: boolean }> = {
  recent: { col: "created_at", asc: false },
  price_asc: { col: "price", asc: true },
  price_desc: { col: "price", asc: false },
  km_asc: { col: "mileage", asc: true },
};

export default async function VehicleListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string }>;
}) {
  const { tenant } = await requireTenant();
  const sp = await searchParams;
  const supabase = await createClient();

  const sort = SORT_COLUMNS[sp.sort ?? "recent"] ?? SORT_COLUMNS.recent;

  let query = supabase
    .from("vehicles")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order(sort.col, { ascending: sort.asc, nullsFirst: false });

  if (sp.status) query = query.eq("status", sp.status as VehicleStatus);
  if (sp.q) {
    const term = sp.q.replace(/[%,()]/g, " ").trim();
    if (term) query = query.or(`brand.ilike.%${term}%,model.ilike.%${term}%`);
  }

  const { data } = await query;
  const vehicles = (data ?? []) as Vehicle[];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Estoque"
        description={`${vehicles.length} ${
          vehicles.length === 1 ? "veículo" : "veículos"
        }`}
      >
        <Link href="/admin/veiculos/novo" className={buttonVariants()}>
          <Plus data-icon="inline-start" aria-hidden />
          Cadastrar carro
        </Link>
      </PageHeader>

      <VehicleFilters count={vehicles.length} />

      {vehicles.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <p className="text-muted-foreground">
            {sp.q || sp.status
              ? "Nenhum veículo encontrado com esses filtros."
              : "Você ainda não cadastrou nenhum carro."}
          </p>
          {!sp.q && !sp.status && (
            <Link
              href="/admin/veiculos/novo"
              className={buttonVariants()}
            >
              Cadastrar meu primeiro carro
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const cover = vehicle.photos?.[0];
  const muted: VehicleStatus[] = ["sold", "archived"];
  return (
    <Link
      href={`/admin/veiculos/${vehicle.id}`}
      className={`group block overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 transition hover:ring-foreground/20 ${
        muted.includes(vehicle.status) ? "opacity-70" : ""
      }`}
    >
      <div className="relative aspect-[4/3] bg-muted">
        {cover ? (
          <Image
            src={cover.url}
            alt={vehicleTitle(vehicle)}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            sem foto
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          <StatusBadge status={vehicle.status} />
          <div className="flex flex-wrap gap-1">
            {vehicle.featured && (
              <Badge className="rounded-full">Destaque</Badge>
            )}
            {vehicle.consigned && (
              <Badge
                variant="secondary"
                className="rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-300"
              >
                Consignado
              </Badge>
            )}
          </div>
        </div>
        <div className="absolute right-2 top-2">
          <VehicleQuickActions
            vehicleId={vehicle.id}
            status={vehicle.status}
            consigned={vehicle.consigned}
          />
        </div>
      </div>
      <div className="p-3">
        <div className="truncate font-semibold">{vehicleTitle(vehicle)}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {formatKm(vehicle.mileage)}
          {vehicle.photos?.length ? ` · ${vehicle.photos.length} fotos` : ""}
        </div>
        <div className="mt-1.5 font-bold text-primary">
          {formatPrice(vehicle.price)}
        </div>
      </div>
    </Link>
  );
}
