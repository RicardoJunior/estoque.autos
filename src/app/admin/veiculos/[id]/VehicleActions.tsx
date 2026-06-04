"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  VEHICLE_STATUSES,
  VEHICLE_STATUS_LABELS,
  type VehicleStatus,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    <Card className="gap-4 px-5 py-5">
      <CardHeader className="gap-0 px-0">
        <CardTitle className="text-sm font-semibold">Status do anúncio</CardTitle>
        <p className="mt-0.5 text-xs text-muted-foreground">
          “Disponível” e “Reservado” aparecem no site. “Vendido” e “Arquivado”
          são removidos da vitrine.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        <div className="flex flex-wrap gap-2">
          {VEHICLE_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() => changeStatus(s)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50 ${
                s === status
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              {VEHICLE_STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <Separator />

        {confirming ? (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-destructive/10 p-3">
            <span className="text-sm text-destructive">
              Excluir permanentemente? As fotos serão apagadas.
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirming(false)}
              >
                Não
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={() =>
                  startTransition(() => deleteVehicleAction(vehicleId))
                }
              >
                Sim, excluir
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="text-sm font-medium text-destructive hover:underline"
            onClick={() => setConfirming(true)}
          >
            Excluir veículo
          </button>
        )}
      </CardContent>
    </Card>
  );
}
