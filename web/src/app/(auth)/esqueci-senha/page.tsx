"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction, type AuthFormState } from "../actions";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState<
    AuthFormState & { sent?: boolean },
    FormData
  >(requestPasswordResetAction, {});

  if (state.sent) {
    return (
      <>
        <h1 className="text-xl font-bold">Verifique seu e-mail</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Se houver uma conta com esse e-mail, enviamos um link para redefinir
          a senha. O link expira em 1 hora.
        </p>
        <Link href="/login" className="btn-ghost mt-6 w-full">
          Voltar para o login
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-bold">Redefinir senha</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Informe seu e-mail e enviaremos um link de redefinição.
      </p>

      <form action={action} className="mt-6 space-y-4">
        <Field
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={state.fieldErrors?.email}
        />
        <SubmitButton pendingLabel="Enviando…">Enviar link</SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-ink-soft)]">
        <Link
          href="/login"
          className="font-semibold text-[var(--color-brand)] hover:underline"
        >
          Voltar para o login
        </Link>
      </p>
    </>
  );
}
