import { CONNECTION_STATUS_LABELS } from "@/lib/integrations/labels";
import type { ConnectionStatus } from "@/lib/integrations/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const STYLE: Record<ConnectionStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  needs_plan: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  error: "bg-destructive/10 text-destructive",
  disconnected: "bg-muted text-muted-foreground",
};

export function ConnectionBadge({
  status,
  implemented = true,
}: {
  status: ConnectionStatus | null;
  implemented?: boolean;
}) {
  if (!implemented) {
    return (
      <Badge variant="outline" className="rounded-full text-muted-foreground">
        Em breve
      </Badge>
    );
  }
  if (!status || status === "disconnected") {
    return (
      <Badge variant="outline" className="rounded-full text-muted-foreground">
        Não conectado
      </Badge>
    );
  }
  return <Badge className={cn("rounded-full", STYLE[status])}>{CONNECTION_STATUS_LABELS[status]}</Badge>;
}
