"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { requestPasswordResetAction, type AuthFormState } from "../actions";
import { Button, buttonVariants } from "@/components/ui/button";
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
        <Link
          href="/login"
          className={buttonVariants({
            variant: "ghost",
            className: "mt-6 w-full border border-border",
          })}
        >
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
        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
          {state.fieldErrors?.email && (
            <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
          )}
        </div>
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
