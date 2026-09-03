"use client";

import { useActionState, use } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  resendConfirmationAction,
  verifySignupCodeAction,
  type CodeFormState,
} from "../../actions";
import { trackFunnel } from "@/lib/funnel";
import { useTrackFormErrors } from "@/hooks/use-track-form-errors";
import { FunnelEvent } from "@/components/FunnelEvent";
import { ResendCode } from "@/components/auth/ResendCode";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

/**
 * Tela do código de confirmação do cadastro. Chega aqui logo após o
 * signupAction (enviado=1) — plano/intervalo/next vêm na URL só para
 * o tracking e para o link "corrigir e-mail" voltar ao mesmo cadastro.
 */
export default function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string;
    plano?: string;
    intervalo?: string;
    enviado?: string;
    next?: string;
  }>;
}) {
  const { email, plano, intervalo, enviado, next } = use(searchParams);
  const [verifyState, verifyAction] = useActionState<CodeFormState, FormData>(
    verifySignupCodeAction,
    {},
  );
  const justSent = enviado === "1";
  const funnel = { plan: plano, interval: intervalo, invited: !!next };

  useTrackFormErrors(verifyState, "confirm_code_error", funnel);

  const fixEmail = new URLSearchParams();
  if (plano) fixEmail.set("plano", plano);
  if (intervalo) fixEmail.set("intervalo", intervalo);
  if (next) fixEmail.set("next", next);
  if (email) fixEmail.set("email", email);

  return (
    <>
      {/* conta criada + e-mail enviado = lead (GA4 sign_up_submitted / Meta Lead) */}
      {justSent && email && (
        <FunnelEvent name="sign_up_submitted" params={funnel} dedupeKey={email} />
      )}

      <h1 className="text-xl font-bold">Confirme seu e-mail</h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        Enviamos um código de 6 dígitos
        {email ? (
          <>
            {" "}
            para <strong className="text-foreground">{email}</strong>
          </>
        ) : null}
        . Digite o código abaixo — ou clique no link do e-mail, em qualquer
        aparelho — para ativar sua conta e continuar.
      </p>

      {email ? (
        <>
          <form
            action={verifyAction}
            className="mt-6 space-y-4"
            onSubmit={() => trackFunnel("confirm_code_submit", funnel)}
          >
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
                autoFocus
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

          <ResendCode
            email={email}
            action={resendConfirmationAction}
            prefix="confirm_code"
            fixEmailHref={`/cadastro?${fixEmail.toString()}`}
            startCooldown={justSent}
          >
            <p className="mt-2 text-xs text-muted-foreground">
              Já tinha conta com este e-mail?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                Entrar
              </Link>
            </p>
          </ResendCode>
        </>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          Não encontramos o e-mail do cadastro.{" "}
          <Link href="/cadastro" className="font-semibold text-primary hover:underline">
            Criar conta
          </Link>{" "}
          ou{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            entrar
          </Link>
          .
        </p>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          Voltar para o login
        </Link>
      </p>
    </>
  );
}
