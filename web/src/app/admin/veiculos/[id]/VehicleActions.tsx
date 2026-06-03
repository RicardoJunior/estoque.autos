"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  VEHICLE_STATUSES,
  VEHICLE_STATUS_LABELS,
  type VehicleStatus,
} from "@/lib/types";
import { deleteVehicleAction, setVehicleStatusAction } from "../actions";

export function VehicleActions({
  vehicleId,
  status,
}: {
  vehicleId: string;
  status: VehicleStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function changeStatus(next: VehicleStatus) {
    if (next === status) return;
    startTransition(async () => {
      await setVehicleStatusAction(vehicleId, next);
      router.refresh();
    });
  }

  return (
    <div className="card space-y-4 p-5">
      <div>
        <h2 className="text-sm font-semibold">Status do anúncio</h2>
        <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
          “Disponível” e “Reservado” aparecem no site. “Vendido” e “Arquivado”
          são removidos da vitrine.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {VEHICLE_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={pending}
            onClick={() => changeStatus(s)}
            className={`rounded-[var(--radius)] border px-3 py-1.5 text-sm font-medium transition ${
              s === status
                ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand-ink)]"
                : "border-[var(--color-border)] hover:bg-slate-50"
            }`}
          >
            {VEHICLE_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <hr className="border-[var(--color-border)]" />

      {confirming ? (
        <div className="flex items-center justify-between gap-3 rounded-[var(--radius)] bg-red-50 p-3">
          <span className="text-sm text-[var(--color-danger)]">
            Excluir permanentemente? As fotos serão apagadas.
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setConfirming(false)}
            >
              Não
            </button>
            <button
              type="button"
              className="btn-danger"
              disabled={pending}
              onClick={() =>
                startTransition(() => deleteVehicleAction(vehicleId))
              }
            >
              Sim, excluir
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="text-sm font-medium text-[var(--color-danger)] hover:underline"
          onClick={() => setConfirming(true)}
        >
          Excluir veículo
        </button>
      )}
    </div>
  );
}
