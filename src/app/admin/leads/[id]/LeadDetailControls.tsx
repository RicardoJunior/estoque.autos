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

export function LeadDetailControls({
  leadId,
  status,
  notes,
}: {
  leadId: string;
  status: LeadStatus;
  notes: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [noteValue, setNoteValue] = useState(notes);
  const [savedNote, setSavedNote] = useState(notes);
  const [confirming, setConfirming] = useState(false);

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
        <div className="mt-3 flex flex-wrap gap-2">
          {LEAD_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() => changeStatus(s)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
                s === status
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              {LEAD_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
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

      {confirming ? (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-destructive/10 p-3">
          <span className="text-sm text-destructive">Excluir este lead?</span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Não
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await deleteLeadAction(leadId);
                  router.push("/admin/leads");
                })
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
          Excluir lead
        </button>
      )}
    </div>
  );
}
