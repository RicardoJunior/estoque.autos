"use client";

import { useActionState, use } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  resendConfirmationAction,
  verifySignupCodeAction,
  type CodeFormState,
} from "../../actions";
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

export default function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = use(searchParams);
  const [verifyState, verifyAction] = useActionState<CodeFormState, FormData>(
    verifySignupCodeAction,
    {},
  );
  const [resendState, resendAction] = useActionState<CodeFormState, FormData>(
    resendConfirmationAction,
    {},
  );

  return (
    <>
      <h1 className="text-xl font-bold">Confirme seu e-mail</h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        Enviamos um link e um código de 6 dígitos
        {email ? (
          <>
            {" "}
            para <strong>{email}</strong>
          </>
        ) : null}
        . Clique no link do e-mail — em qualquer aparelho — ou digite o código
        abaixo para ativar sua conta e continuar a criação da sua loja.
      </p>

      {email && (
        <>
          <form action={verifyAction} className="mt-6 space-y-4">
            <input type="hidden" name="email" value={email} />
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
              <Label htmlFor="code">Código de confirmação</Label>
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
            <SubmitButton pendingLabel="Confirmando…">
              Confirmar e continuar
            </SubmitButton>
          </form>

          <form action={resendAction} className="mt-4">
            <input type="hidden" name="email" value={email} />
            {resendState.error && (
              <p className="mb-2 text-center text-xs text-destructive">
                {resendState.error}
              </p>
            )}
            {resendState.sent && (
              <p className="mb-2 text-center text-xs text-[var(--color-ink-soft)]">
                E-mail reenviado. Confira também a caixa de spam.
              </p>
            )}
            <Button type="submit" variant="link" className="w-full">
              Não recebeu? Reenviar e-mail
            </Button>
          </form>
        </>
      )}

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
