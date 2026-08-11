import Link from "next/link";
import Image from "next/image";
import type { PublicVehicle } from "@/lib/public";
import {
  FUEL_LABELS,
  TRANSMISSION_LABELS,
  VEHICLE_FLAG_LABELS,
  VEHICLE_FLAG_WARNINGS,
  type VehicleFlag,
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
/** ordem de exibição no card (cabe pouco: mostra até 3) */
const CARD_FLAG_PRIORITY: readonly VehicleFlag[] = [
  "blindado",
  "leilao",
  "unico_dono",
  "ipva_pago",
  "cautelar_aprovada",
  "garantia_fabrica",
];

export function CarCard({ vehicle, slug, tone = "light", rounded = "rounded-xl" }: Props) {
  const photos = vehicle.photos ?? [];
  const cover = photos[0];
  const dark = tone === "dark";
  const reserved = vehicle.status === "reserved";
  const flags = CARD_FLAG_PRIORITY.filter((f) =>
    vehicle.condition_flags?.includes(f),
  ).slice(0, 3);

  return (
    <Link
      href={`/${slug}/carros/${vehicle.id}`}
      className={`group block overflow-hidden border transition hover:-translate-y-0.5 hover:shadow-lg ${rounded} ${
        dark ? "" : "shadow-sm"
      }`}
      style={{
        borderColor: dark
          ? "var(--sf-border, rgba(255,255,255,0.1))"
          : "var(--sf-border, #e2e8f0)",
        background: dark
          ? "var(--sf-surface, rgba(255,255,255,0.05))"
          : "var(--sf-surface, #ffffff)",
      }}
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
        {photos.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
            {photos.length} fotos
          </span>
        )}
      </div>

      <div className="p-4">
        <h3
          className="truncate font-semibold"
          style={{
            fontFamily: "var(--sf-font-head)",
            color: dark ? "var(--sf-ink, #ffffff)" : "var(--sf-ink, #0f172a)",
          }}
        >
          {vehicleTitle(vehicle)}
        </h3>
        <div
          className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs"
          style={{
            color: dark
              ? "var(--sf-ink-soft, #cbd5e1)"
              : "var(--sf-ink-soft, #64748b)",
          }}
        >
          {vehicle.year_model && <span>{vehicle.year_model}</span>}
          {vehicle.mileage != null && <span>· {formatKm(vehicle.mileage)}</span>}
          {vehicle.transmission && (
            <span>· {TRANSMISSION_LABELS[vehicle.transmission]}</span>
          )}
          {vehicle.fuel && <span>· {FUEL_LABELS[vehicle.fuel]}</span>}
        </div>
        {flags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {flags.map((flag) => (
              <span
                key={flag}
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  VEHICLE_FLAG_WARNINGS.includes(flag)
                    ? dark
                      ? "bg-amber-400/15 text-amber-300"
                      : "bg-amber-100 text-amber-800"
                    : dark
                      ? "bg-emerald-400/15 text-emerald-300"
                      : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {VEHICLE_FLAG_LABELS[flag]}
              </span>
            ))}
          </div>
        )}
        <div
          className="mt-2.5 text-lg font-bold"
          // em card escuro a primária da loja pode ser escura (ex.: navy)
          // e sumir — texto claro garante leitura; no claro, vale a marca
          style={{ color: dark ? "var(--sf-ink, #f8fafc)" : "var(--sf-primary)" }}
        >
          {formatPrice(vehicle.price)}
        </div>
      </div>
    </Link>
  );
}
