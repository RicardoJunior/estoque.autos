"use client";

import { useActionState } from "react";
import { updatePasswordAction, type AuthFormState } from "../actions";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

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
          <div className="rounded-[var(--radius)] bg-red-50 px-3.5 py-2.5 text-sm text-[var(--color-danger)]">
            {state.error}
          </div>
        )}
        <Field
          label="Nova senha"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          hint="Mínimo de 8 caracteres."
          error={state.fieldErrors?.password}
        />
        <SubmitButton pendingLabel="Salvando…">Salvar nova senha</SubmitButton>
      </form>
    </>
  );
}
