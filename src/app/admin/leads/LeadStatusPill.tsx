import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const STYLES: Record<LeadStatus, string> = {
  new: "bg-blue-500/15 text-blue-400",
  in_progress: "bg-amber-500/15 text-amber-400",
  won: "bg-emerald-500/15 text-emerald-400",
  lost: "bg-muted text-muted-foreground",
};

export function LeadStatusPill({ status }: { status: LeadStatus }) {
  return (
    <Badge variant="secondary" className={cn("shrink-0", STYLES[status])}>
      <span aria-hidden className="size-1.5 rounded-full bg-current opacity-70" />
      {LEAD_STATUS_LABELS[status]}
    </Badge>
  );
}
