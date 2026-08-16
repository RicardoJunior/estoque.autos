"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Check } from "lucide-react";
import { toast } from "sonner";
import type { VehicleStatus } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  setVehicleStatusAction,
  setVehicleConsignedAction,
} from "./actions";

/**
 * Menu de ações rápidas sobre o card do veículo (na lista). Fica dentro
 * de um <Link> de card inteiro — por isso todo clique faz stopPropagation
 * + preventDefault para NÃO navegar ao abrir/usar o menu.
 */
export function VehicleQuickActions({
  vehicleId,
  status,
  consigned,
}: {
  vehicleId: string;
  status: VehicleStatus;
  consigned: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ error?: string }>, ok: string) {
    startTransition(async () => {
      const res = await fn();
      if (res?.error) toast.error(res.error);
      else {
        toast.success(ok);
        router.refresh();
      }
    });
  }

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const active = status === "available" || status === "reserved";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={stop}
        aria-label="Ações do veículo"
        disabled={pending}
        className="flex size-8 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm ring-1 ring-foreground/10 backdrop-blur transition hover:bg-background disabled:opacity-50"
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={stop} className="min-w-52">
        {status !== "sold" && (
          <DropdownMenuItem
            onClick={(e) => {
              stop(e);
              run(() => setVehicleStatusAction(vehicleId, "sold"), "Marcado como vendido.");
            }}
          >
            Marcar como vendido
          </DropdownMenuItem>
        )}
        {status !== "reserved" && active && (
          <DropdownMenuItem
            onClick={(e) => {
              stop(e);
              run(() => setVehicleStatusAction(vehicleId, "reserved"), "Marcado como reservado.");
            }}
          >
            Marcar como reservado
          </DropdownMenuItem>
        )}
        {active ? (
          <DropdownMenuItem
            variant="destructive"
            onClick={(e) => {
              stop(e);
              run(() => setVehicleStatusAction(vehicleId, "archived"), "Anúncio desativado (fora do site).");
            }}
          >
            Desativar anúncio
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={(e) => {
              stop(e);
              run(() => setVehicleStatusAction(vehicleId, "available"), "Anúncio reativado.");
            }}
          >
            Reativar (voltar ao site)
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            stop(e);
            run(
              () => setVehicleConsignedAction(vehicleId, !consigned),
              consigned ? "Consignação removida." : "Marcado como consignado.",
            );
          }}
        >
          {consigned && <Check className="size-4" />}
          {consigned ? "Remover consignação" : "Marcar como consignado"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
