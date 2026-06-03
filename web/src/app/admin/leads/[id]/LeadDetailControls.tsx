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
      <div className="card p-5">
        <h2 className="text-sm font-semibold">Status do atendimento</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {LEAD_STATUSES.map((s) => (
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
              {LEAD_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold">Anotações internas</h2>
        <textarea
          value={noteValue}
          onChange={(e) => setNoteValue(e.target.value)}
          placeholder="Registre o andamento do atendimento…"
          className="field mt-3 min-h-28"
        />
        <div className="mt-2 flex items-center justify-end gap-3">
          {savedNote !== noteValue && (
            <span className="text-xs text-[var(--color-ink-soft)]">
              alterações não salvas
            </span>
          )}
          <button
            type="button"
            className="btn-primary"
            disabled={pending || savedNote === noteValue}
            onClick={saveNotes}
          >
            {pending ? "Salvando…" : "Salvar anotações"}
          </button>
        </div>
      </div>

      {confirming ? (
        <div className="flex items-center justify-between gap-3 rounded-[var(--radius)] bg-red-50 p-3">
          <span className="text-sm text-[var(--color-danger)]">
            Excluir este lead?
          </span>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setConfirming(false)}>
              Não
            </button>
            <button
              className="btn-danger"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await deleteLeadAction(leadId);
                  router.push("/admin/leads");
                })
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
          Excluir lead
        </button>
      )}
    </div>
  );
}
