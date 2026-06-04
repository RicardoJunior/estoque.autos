import type { ReactNode } from "react";
import type { PublicVehicle } from "@/lib/public";
import { CarCard } from "../CarCard";

interface Props {
  vehicles: PublicVehicle[];
  slug: string;
  tone?: "light" | "dark";
  /** repassado ao CarCard (varia por template) */
  rounded?: string;
  /** classes do grid; default = 1/2/3 colunas */
  columns?: string;
  /** texto do estado vazio */
  emptyText?: string;
  /** estado vazio custom (sobrepõe emptyText) */
  empty?: ReactNode;
}

const DEFAULT_COLS = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

/**
 * Grid de CarCard com empty state. Centraliza o padrão repetido nos
 * templates (mapear veículos + mensagem de "nenhum encontrado").
 */
export function VehicleGrid({
  vehicles,
  slug,
  tone = "light",
  rounded = "rounded-xl",
  columns = DEFAULT_COLS,
  emptyText = "Nenhum veículo encontrado.",
  empty,
}: Props) {
  const dark = tone === "dark";

  if (vehicles.length === 0) {
    return (
      empty ?? (
        <p
          className={`py-16 text-center ${dark ? "text-slate-500" : "text-slate-400"}`}
        >
          {emptyText}
        </p>
      )
    );
  }

  return (
    <div className={`grid gap-5 ${columns}`}>
      {vehicles.map((v) => (
        <CarCard
          key={v.id}
          vehicle={v}
          slug={slug}
          tone={tone}
          rounded={rounded}
        />
      ))}
    </div>
  );
}
