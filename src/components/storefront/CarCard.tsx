import Link from "next/link";
import Image from "next/image";
import type { PublicVehicle } from "@/lib/public";
import {
  FUEL_LABELS,
  TRANSMISSION_LABELS,
} from "@/lib/types";
import { formatPrice, formatKm, vehicleTitle } from "@/lib/format";

interface Props {
  vehicle: PublicVehicle;
  slug: string;
  tone?: "light" | "dark";
  /** estilo do card; varia levemente por template */
  rounded?: string;
}

/**
 * Card de veículo reutilizado pelos templates. Cor do preço vem do
 * tema da loja (var(--sf-primary)); o restante adapta a tom claro/escuro.
 */
export function CarCard({ vehicle, slug, tone = "light", rounded = "rounded-xl" }: Props) {
  const cover = vehicle.photos?.[0];
  const dark = tone === "dark";
  const reserved = vehicle.status === "reserved";

  return (
    <Link
      href={`/${slug}/carros/${vehicle.id}`}
      className={`group block overflow-hidden border transition hover:-translate-y-0.5 hover:shadow-lg ${rounded} ${
        dark
          ? "border-white/10 bg-white/5"
          : "border-slate-200 bg-white shadow-sm"
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {cover ? (
          <Image
            src={cover.url}
            alt={vehicleTitle(vehicle)}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            sem foto
          </div>
        )}
        {reserved && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white">
            Reservado
          </span>
        )}
        {vehicle.photos?.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
            {vehicle.photos.length} fotos
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className={`truncate font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
          {vehicleTitle(vehicle)}
        </h3>
        <div className={`mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs ${dark ? "text-slate-300" : "text-slate-500"}`}>
          {vehicle.year_model && <span>{vehicle.year_model}</span>}
          {vehicle.mileage != null && <span>· {formatKm(vehicle.mileage)}</span>}
          {vehicle.transmission && (
            <span>· {TRANSMISSION_LABELS[vehicle.transmission]}</span>
          )}
          {vehicle.fuel && <span>· {FUEL_LABELS[vehicle.fuel]}</span>}
        </div>
        <div
          className="mt-2.5 text-lg font-bold"
          style={{ color: "var(--sf-primary)" }}
        >
          {formatPrice(vehicle.price)}
        </div>
      </div>
    </Link>
  );
}
