"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { TEAM_ROLE_LABELS } from "@/lib/types";
import { FormBanner } from "@/components/admin/FormBanner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInviteAction, type InviteState } from "./actions";

const INVITE_ROLES = ["vendedor", "admin"] as const;

export function InviteForm() {
  const [state, action] = useActionState<InviteState, FormData>(
    createInviteAction,
    {},
  );

  return (
    <Card className="gap-3 px-5 py-5">
      <CardHeader className="px-0">
        <CardTitle className="text-sm font-semibold">
          Convidar para a equipe
        </CardTitle>
        <CardDescription>
          A pessoa recebe um e-mail com um link para entrar na sua loja. O
          convite vale por 7 dias.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <form action={action} className="space-y-4">
          {state.ok && (
            <FormBanner variant="success">Convite enviado por e-mail.</FormBanner>
          )}
          {state.error && <FormBanner variant="error">{state.error}</FormBanner>}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="invite-email">E-mail</Label>
              <Input
                id="invite-email"
                name="email"
                type="email"
                placeholder="vendedor@minhaloja.com.br"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invite-role">Papel</Label>
              <Select name="role" defaultValue="vendedor">
                <SelectTrigger id="invite-role" className="w-full sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} align="start">
                  {INVITE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {TEAM_ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <SubmitButton />
          </div>
          {state.fieldErrors?.email && (
            <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
          )}
          {state.fieldErrors?.role && (
            <p className="text-xs text-destructive">{state.fieldErrors.role}</p>
          )}
          <p className="text-xs text-muted-foreground">
            <strong className="font-semibold">Administrador</strong> gerencia
            estoque, leads e o site. <strong className="font-semibold">Vendedor</strong>{" "}
            vê o estoque e atende os leads.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enviando…" : "Enviar convite"}
    </Button>
  );
}
