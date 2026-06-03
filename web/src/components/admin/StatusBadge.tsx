import { VEHICLE_STATUS_LABELS, type VehicleStatus } from "@/lib/types";

const STYLES: Record<VehicleStatus, string> = {
  available: "bg-green-100 text-green-700",
  reserved: "bg-amber-100 text-amber-700",
  sold: "bg-slate-200 text-slate-600",
  archived: "bg-slate-100 text-slate-500",
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
