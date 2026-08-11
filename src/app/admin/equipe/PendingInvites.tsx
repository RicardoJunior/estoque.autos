import { X } from "lucide-react";
import { TEAM_ROLE_LABELS, type Invite } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { revokeInviteAction } from "./actions";

/** Convites ainda não aceitos — com opção de revogar (apagar). */
export function PendingInvites({
  invites,
}: {
  invites: (Invite & { expired: boolean })[];
}) {
  return (
    <Card className="gap-0 p-0">
      <CardHeader className="px-5 pt-5 pb-3">
        <CardTitle className="text-sm font-semibold">
          Convites pendentes ({invites.length})
        </CardTitle>
      </CardHeader>
      <ul className="divide-y divide-border border-t border-border">
        {invites.map((invite) => {
          const { expired } = invite;
          return (
            <li
              key={invite.id}
              className="flex items-center gap-3 px-5 py-3.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{invite.email}</p>
                <p className="text-xs text-muted-foreground">
                  {expired
                    ? `Expirou em ${formatDate(invite.expires_at)}`
                    : `Enviado em ${formatDate(invite.created_at)} · expira em ${formatDate(invite.expires_at)}`}
                </p>
              </div>
              {expired && <Badge variant="destructive">Expirado</Badge>}
              <Badge variant="outline">{TEAM_ROLE_LABELS[invite.role]}</Badge>
              <form action={revokeInviteAction}>
                <input type="hidden" name="id" value={invite.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Revogar convite de ${invite.email}`}
                  title="Revogar convite"
                >
                  <X />
                </Button>
              </form>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
