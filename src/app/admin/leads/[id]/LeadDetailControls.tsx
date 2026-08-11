"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type LeadStatus,
} from "@/lib/types";
import {
  deleteLeadAction,
  updateLeadNotesAction,
  updateLeadStatusAction,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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

export function LeadDetailControls({
  leadId,
  status,
  notes,
  canDelete,
}: {
  leadId: string;
  status: LeadStatus;
  notes: string;
  /** excluir é ação de staff — a RLS barra vendedor, então nem mostramos */
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [noteValue, setNoteValue] = useState(notes);
  const [savedNote, setSavedNote] = useState(notes);

  function changeStatus(next: LeadStatus) {
    if (next === status) return;
    startTransition(async () => {
      await updateLeadStatusAction(leadId, next);
      router.refresh();
    });
  }

  function saveNotes() {
    startTransition(async () => {
      const res = await updateLeadNotesAction(leadId, noteValue);
      if (res.ok) setSavedNote(noteValue);
    });
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h2 className="text-sm font-semibold">Status do atendimento</h2>
        <ToggleGroup
          aria-label="Status do atendimento"
          className="mt-3 flex-wrap"
          value={[status]}
          onValueChange={(values) => {
            const next = values[0] as LeadStatus | undefined;
            // clicar na opção ativa desmarca (values vazio): mantém a seleção
            if (next && next !== status) changeStatus(next);
          }}
        >
          {LEAD_STATUSES.map((s) => (
            <ToggleGroupItem
              key={s}
              value={s}
              variant="outline"
              disabled={pending}
              className="aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary aria-pressed:hover:bg-primary/10 aria-pressed:hover:text-primary"
            >
              {LEAD_STATUS_LABELS[s]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">Anotações internas</h2>
        <Textarea
          value={noteValue}
          onChange={(e) => setNoteValue(e.target.value)}
          placeholder="Registre o andamento do atendimento…"
          className="mt-3 min-h-28"
        />
        <div className="mt-2 flex items-center justify-end gap-3">
          {savedNote !== noteValue && (
            <span className="text-xs text-muted-foreground">
              alterações não salvas
            </span>
          )}
          <Button
            type="button"
            disabled={pending || savedNote === noteValue}
            onClick={saveNotes}
          >
            {pending ? "Salvando…" : "Salvar anotações"}
          </Button>
        </div>
      </Card>

      {canDelete && (
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              variant="ghost"
              className="w-fit px-0 text-destructive hover:bg-transparent hover:text-destructive hover:underline"
            />
          }
        >
          Excluir lead
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este lead?</AlertDialogTitle>
            <AlertDialogDescription>
              O contato e as anotações serão apagados. Essa ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await deleteLeadAction(leadId);
                  if (!res.error) router.push("/admin/leads");
                })
              }
            >
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      )}
    </div>
  );
}
