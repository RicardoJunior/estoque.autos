"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { PortalMode } from "@/lib/integrations/registry";
import type { ConnectionStatus } from "@/lib/integrations/types";
import type { PortalId } from "@/lib/types";
import { Button } from "@/components/ui/button";
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
import {
  connectFeedAction,
  disconnectPortalAction,
  syncAllAction,
  syncTaxonomyAction,
} from "../actions";

export function PortalButtons({
  portal,
  mode,
  connected,
  status,
}: {
  portal: PortalId;
  mode: PortalMode;
  connected: boolean;
  status: ConnectionStatus | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok?: boolean; error?: string }>, ok: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.error) {
        setError(res.error);
        toast.error(res.error);
      } else {
        setError(null);
        toast.success(ok);
        router.refresh();
      }
    });
  }

  return (
    <>
      {mode === "feed" && !connected && (
        <Button disabled={pending} onClick={() => run(() => connectFeedAction(portal), "Feed gerado.")}>
          Gerar URL do feed
        </Button>
      )}
      {connected && mode !== "feed" && (
        <>
          <Button
            variant={status === "needs_plan" || status === "error" ? "default" : "outline"}
            disabled={pending}
            onClick={() => run(() => syncAllAction(portal), "Sincronização agendada.")}
          >
            {status === "needs_plan" ? "Já contratei — sincronizar" : status === "error" ? "Tentar de novo" : "Sincronizar tudo"}
          </Button>
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => run(() => syncTaxonomyAction(portal), "Catálogo em atualização.")}
          >
            Atualizar catálogo
          </Button>
        </>
      )}
      {connected && (
        <AlertDialog>
          <AlertDialogTrigger
            render={<Button variant="ghost" className="text-destructive hover:text-destructive" />}
          >
            Desconectar
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Desconectar este portal?</AlertDialogTitle>
              <AlertDialogDescription>
                {mode === "feed"
                  ? "A URL do feed deixa de funcionar e o portal para de receber seu estoque."
                  : "Os anúncios publicados por aqui serão removidos do portal e a autorização será apagada."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={pending}
                onClick={() => run(() => disconnectPortalAction(portal), "Portal desconectado.")}
              >
                Desconectar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </>
  );
}
