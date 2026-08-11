import { VEHICLE_STATUS_LABELS, type VehicleStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STYLES: Record<VehicleStatus, string> = {
  available: "bg-emerald-500/15 text-emerald-400",
  reserved: "bg-amber-500/15 text-amber-400",
  sold: "bg-muted text-muted-foreground",
  archived: "bg-muted/60 text-muted-foreground",
};

export function StatusBadge({ status }: { status: VehicleStatus }) {
  return (
    <Badge className={cn("rounded-full", STYLES[status])}>
      {VEHICLE_STATUS_LABELS[status]}
    </Badge>
  );
}
