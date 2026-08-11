"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  requestPasswordResetAction,
  verifyRecoveryCodeAction,
  type AuthFormState,
  type CodeFormState,
} from "../actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
    AuthFormState & { sent?: boolean; email?: string },
    FormData
  >(requestPasswordResetAction, {});
  const [verifyState, verifyAction] = useActionState<CodeFormState, FormData>(
    verifyRecoveryCodeAction,
    {},
  );

  if (state.sent && state.email) {
    return (
      <>
        <h1 className="text-xl font-bold">Verifique seu e-mail</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Se houver uma conta com esse e-mail, enviamos um link e um código de
          6 dígitos para redefinir a senha. Clique no link — em qualquer
          aparelho — ou digite o código abaixo. Ambos expiram em 1 hora.
        </p>

        <form action={verifyAction} className="mt-6 space-y-4">
          <input type="hidden" name="email" value={state.email} />
          {verifyState.error && (
            <Alert
              variant="destructive"
              className="border-transparent bg-destructive/10"
            >
              <AlertDescription className="text-destructive">
                {verifyState.error}
              </AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="code">Código de redefinição</Label>
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              className="text-center font-mono text-lg tracking-[0.5em]"
              required
            />
            {verifyState.fieldErrors?.code && (
              <p className="text-xs text-destructive">
                {verifyState.fieldErrors.code}
              </p>
            )}
          </div>
          <SubmitButton pendingLabel="Verificando…">
            Redefinir senha
          </SubmitButton>
        </form>

        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "mt-6 w-full font-semibold",
          )}
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
