"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updatePasswordAction, type AuthFormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton({
  children,
  pendingLabel,
}: {
  children: React.ReactNode;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}

export default function ResetPasswordPage() {
  const [state, action] = useActionState<AuthFormState, FormData>(
    updatePasswordAction,
    {},
  );

  return (
    <>
      <h1 className="text-xl font-bold">Crie uma nova senha</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Digite a nova senha da sua conta.
      </p>

      <form action={action} className="mt-6 space-y-4">
        {state.error && (
          <div className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            {state.error}
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="password">Nova senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
          {state.fieldErrors?.password ? (
            <p className="text-xs text-destructive">
              {state.fieldErrors.password}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Mínimo de 8 caracteres.
            </p>
          )}
        </div>
        <SubmitButton pendingLabel="Salvando…">Salvar nova senha</SubmitButton>
      </form>
    </>
  );
}
