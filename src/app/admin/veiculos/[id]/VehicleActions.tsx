"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  VEHICLE_STATUSES,
  VEHICLE_STATUS_LABELS,
  type VehicleStatus,
} from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  const [error, setError] = useState<string | null>(null);

  function changeStatus(next: VehicleStatus) {
    if (next === status) return;
    startTransition(async () => {
      const result = await setVehicleStatusAction(vehicleId, next);
      setError(result?.error ?? null);
      if (!result?.error) router.refresh();
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
        {error && (
          <Alert
            variant="destructive"
            className="border-transparent bg-destructive/10"
          >
            <AlertDescription className="text-destructive">
              {error}
            </AlertDescription>
          </Alert>
        )}
        <ToggleGroup
          aria-label="Status do anúncio"
          className="flex-wrap"
          value={[status]}
          onValueChange={(values) => {
            const next = values[0] as VehicleStatus | undefined;
            // clicar na opção ativa desmarca (values vazio): mantém a seleção
            if (next && next !== status) changeStatus(next);
          }}
        >
          {VEHICLE_STATUSES.map((s) => (
            <ToggleGroupItem
              key={s}
              value={s}
              variant="outline"
              disabled={pending}
              className="aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary aria-pressed:hover:bg-primary/10 aria-pressed:hover:text-primary"
            >
              {VEHICLE_STATUS_LABELS[s]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Separator />

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                className="w-fit px-0 text-destructive hover:bg-transparent hover:text-destructive hover:underline"
              />
            }
          >
            Excluir veículo
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
              <AlertDialogDescription>
                O anúncio e as fotos serão apagados. Essa ação não pode ser
                desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Não</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={pending}
                onClick={() =>
                  startTransition(() => deleteVehicleAction(vehicleId))
                }
              >
                Sim, excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
