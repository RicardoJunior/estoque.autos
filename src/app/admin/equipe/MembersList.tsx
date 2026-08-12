"use client";

import { startTransition, useActionState, useState } from "react";
import { Crown, MoreVertical, Trash2, UserCog } from "lucide-react";
import { TEAM_ROLE_LABELS, type TeamMember } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { FormBanner } from "@/components/admin/FormBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  removeMemberAction,
  transferOwnershipAction,
  updateMemberRoleAction,
  type MemberState,
} from "./actions";

export function MembersList({
  members,
  isOwner,
  currentUserId,
  storeName,
}: {
  members: TeamMember[];
  isOwner: boolean;
  currentUserId: string;
  storeName: string;
}) {
  const [roleState, roleAction, rolePending] = useActionState<
    MemberState,
    FormData
  >(updateMemberRoleAction, {});
  const [removeState, removeAction, removePending] = useActionState<
    MemberState,
    FormData
  >(removeMemberAction, {});
  const [transferState, transferAction, transferPending] = useActionState<
    MemberState,
    FormData
  >(transferOwnershipAction, {});

  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [transferTarget, setTransferTarget] = useState<TeamMember | null>(null);
  // confirmação dupla da transferência: 1 = aviso, 2 = confirmação final
  const [transferStep, setTransferStep] = useState<1 | 2>(1);

  const error = roleState.error ?? removeState.error ?? transferState.error;
  const pending = rolePending || removePending || transferPending;

  function changeRole(member: TeamMember, role: "admin" | "vendedor") {
    const fd = new FormData();
    fd.set("user_id", member.user_id);
    fd.set("role", role);
    startTransition(() => roleAction(fd));
  }

  function confirmRemove() {
    if (!removeTarget) return;
    const fd = new FormData();
    fd.set("user_id", removeTarget.user_id);
    startTransition(() => removeAction(fd));
    setRemoveTarget(null);
  }

  function confirmTransfer() {
    if (!transferTarget) return;
    const fd = new FormData();
    fd.set("user_id", transferTarget.user_id);
    startTransition(() => transferAction(fd));
    setTransferTarget(null);
    setTransferStep(1);
  }

  return (
    <>
      {error && <FormBanner variant="error">{error}</FormBanner>}

      <Card className="gap-0 p-0">
        <CardHeader className="px-5 pt-5 pb-3">
          <CardTitle className="text-sm font-semibold">
            Membros ({members.length})
          </CardTitle>
        </CardHeader>
        <ul className="divide-y divide-border border-t border-border">
          {members.map((member) => {
            const isSelf = member.user_id === currentUserId;
            const canManage = isOwner && member.role !== "owner" && !isSelf;
            return (
              <li
                key={member.user_id}
                className="flex items-center gap-3 px-5 py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {member.name || member.email}
                    {isSelf && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        (você)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.email} · desde {formatDate(member.created_at)}
                  </p>
                </div>
                <Badge
                  variant={member.role === "owner" ? "default" : "outline"}
                >
                  {TEAM_ROLE_LABELS[member.role]}
                </Badge>
                {canManage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={pending}
                          aria-label={`Ações para ${member.name || member.email}`}
                        />
                      }
                    >
                      <MoreVertical />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {member.role === "admin" ? (
                        <DropdownMenuItem
                          onClick={() => changeRole(member, "vendedor")}
                        >
                          <UserCog /> Tornar vendedor
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => changeRole(member, "admin")}
                        >
                          <UserCog /> Tornar administrador
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => {
                          setTransferStep(1);
                          setTransferTarget(member);
                        }}
                      >
                        <Crown /> Transferir propriedade
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setRemoveTarget(member)}
                      >
                        <Trash2 /> Remover da equipe
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Remover membro */}
      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover da equipe?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget?.name || removeTarget?.email} perderá o acesso ao
              painel da {storeName} imediatamente. Você pode convidar de novo
              quando quiser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmRemove}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transferir propriedade — confirmação dupla */}
      <AlertDialog
        open={!!transferTarget}
        onOpenChange={(open) => {
          if (!open) {
            setTransferTarget(null);
            setTransferStep(1);
          }
        }}
      >
        <AlertDialogContent>
          {transferStep === 1 ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Transferir propriedade?</AlertDialogTitle>
                <AlertDialogDescription>
                  {transferTarget?.name || transferTarget?.email} passará a ser
                  o proprietário da {storeName}, com controle total sobre a
                  loja, a assinatura e a equipe —{" "}
                  <strong className="text-foreground">
                    e você perderá o acesso à loja
                  </strong>
                  .
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  variant="outline"
                  onClick={() => setTransferStep(2)}
                >
                  Continuar
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação é definitiva e não pode ser desfeita por você. Ao
                  confirmar, você perderá o acesso à loja {storeName} e somente
                  o novo proprietário poderá convidá-lo de volta.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={confirmTransfer}
                >
                  Sim, transferir e perder o acesso
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
