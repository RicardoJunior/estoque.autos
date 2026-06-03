import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/types";

const STYLES: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  won: "bg-green-100 text-green-700",
  lost: "bg-slate-200 text-slate-500",
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
