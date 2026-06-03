import Link from "next/link";
import Image from "next/image";
import { requireTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatKm, vehicleTitle } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { VehicleFilters } from "./VehicleFilters";
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Estoque</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {vehicles.length}{" "}
            {vehicles.length === 1 ? "veículo" : "veículos"}
          </p>
        </div>
        <Link href="/admin/veiculos/novo" className="btn-primary shrink-0">
          + Cadastrar carro
        </Link>
      </div>

      <VehicleFilters />

      {vehicles.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 p-12 text-center">
          <p className="text-[var(--color-ink-soft)]">
            {sp.q || sp.status
              ? "Nenhum veículo encontrado com esses filtros."
              : "Você ainda não cadastrou nenhum carro."}
          </p>
          {!sp.q && !sp.status && (
            <Link href="/admin/veiculos/novo" className="btn-primary">
              Cadastrar meu primeiro carro
            </Link>
          )}
        </div>
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
      className={`card group overflow-hidden transition hover:border-slate-300 ${
        muted.includes(vehicle.status) ? "opacity-70" : ""
      }`}
    >
      <div className="relative aspect-[4/3] bg-slate-100">
        {cover ? (
          <Image
            src={cover.url}
            alt={vehicleTitle(vehicle)}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            sem foto
          </div>
        )}
        <div className="absolute left-2 top-2">
          <StatusBadge status={vehicle.status} />
        </div>
        {vehicle.featured && (
          <div className="absolute right-2 top-2 rounded-full bg-[var(--color-brand)] px-2 py-0.5 text-xs font-medium text-white">
            Destaque
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="truncate font-semibold">{vehicleTitle(vehicle)}</div>
        <div className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
          {formatKm(vehicle.mileage)}
          {vehicle.photos?.length ? ` · ${vehicle.photos.length} fotos` : ""}
        </div>
        <div className="mt-1.5 font-bold text-[var(--color-brand)]">
          {formatPrice(vehicle.price)}
        </div>
      </div>
    </Link>
  );
}
