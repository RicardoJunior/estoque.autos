import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/types";

const STYLES: Record<LeadStatus, string> = {
  new: "bg-blue-500/15 text-blue-400",
  in_progress: "bg-amber-500/15 text-amber-400",
  won: "bg-emerald-500/15 text-emerald-400",
  lost: "bg-muted text-muted-foreground",
};

export function LeadStatusPill({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}
    >
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}
