"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/format";
import { LISTING_STATUS_LABELS } from "@/lib/integrations/labels";
import type { ListingStatus } from "@/lib/integrations/types";
import type { PortalId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resyncVehiclePortalsAction } from "../actions";

export interface PanelListing {
  portal: PortalId;
  desired: boolean;
  status: ListingStatus;
  external_url: string | null;
  last_error: string | null;
  last_synced_at: string | null;
}

const STATUS_STYLE: Record<ListingStatus, string> = {
  queued: "bg-muted text-muted-foreground",
  publishing: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  paused: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  error: "bg-destructive/10 text-destructive",
  rejected: "bg-destructive/10 text-destructive",
  removed: "bg-muted text-muted-foreground",
};

/** Painel "Anúncios nos portais" no detalhe do veículo. */
export function PortalListingsPanel({
  vehicleId,
  listings,
  portals,
}: {
  vehicleId: string;
  listings: PanelListing[];
  portals: { portal: PortalId; label: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const byPortal = new Map(listings.map((l) => [l.portal, l]));

  function resend() {
    startTransition(async () => {
      const res = await resyncVehiclePortalsAction(vehicleId);
      if (res?.error) setError(res.error);
      else {
        setError(null);
        toast.success("Reenviado — o status atualiza em instantes.");
        router.refresh();
      }
    });
  }

  return (
    <Card className="gap-4 px-5 py-5">
      <CardHeader className="flex-row items-start justify-between gap-3 px-0">
        <div>
          <CardTitle className="text-sm font-semibold">Anúncios nos portais</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Marque os portais em “Publicar em” (abaixo) e salve. A sincronização
            roda em segundo plano.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={resend}
        >
          <RefreshCw data-icon="inline-start" className={cn(pending && "animate-spin")} aria-hidden />
          Reenviar
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 px-0">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {portals.map((p) => {
          const l = byPortal.get(p.portal);
          const status: ListingStatus | null = l ? (l.desired ? l.status : "removed") : null;
          return (
            <div
              key={p.portal}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{p.label}</span>
                  {status ? (
                    <Badge className={cn("rounded-full", STATUS_STYLE[status])}>
                      {l && !l.desired ? "Não publicar" : LISTING_STATUS_LABELS[status]}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-full text-muted-foreground">
                      Não marcado
                    </Badge>
                  )}
                </div>
                {l?.last_error && l.desired && (
                  <p className="mt-1 text-xs text-destructive">{l.last_error}</p>
                )}
                {l?.last_synced_at && !l.last_error && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sincronizado {formatRelativeTime(l.last_synced_at)}
                  </p>
                )}
              </div>
              {l?.external_url && l.status === "active" && (
                <a
                  href={l.external_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Ver anúncio
                  <ExternalLink className="size-3" aria-hidden />
                </a>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
