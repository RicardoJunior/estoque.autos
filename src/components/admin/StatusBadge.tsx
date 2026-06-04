import { VEHICLE_STATUS_LABELS, type VehicleStatus } from "@/lib/types";

const STYLES: Record<VehicleStatus, string> = {
  available: "bg-emerald-500/15 text-emerald-400",
  reserved: "bg-amber-500/15 text-amber-400",
  sold: "bg-muted text-muted-foreground",
  archived: "bg-muted/60 text-muted-foreground",
};

export function StatusBadge({ status }: { status: VehicleStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {VEHICLE_STATUS_LABELS[status]}
    </span>
  );
}
