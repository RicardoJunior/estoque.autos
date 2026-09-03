"use client";

import { useActionState, useEffect, useState, use } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  sendLoginCodeAction,
  verifyLoginCodeAction,
  type CodeFormState,
} from "../../actions";
import { trackFunnel } from "@/lib/funnel";
import { useTrackFormErrors } from "@/hooks/use-track-form-errors";
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

export default function LoginCodePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = use(searchParams);
  const [sendState, sendAction] = useActionState<CodeFormState, FormData>(
    sendLoginCodeAction,
    {},
  );
  const [verifyState, verifyAction] = useActionState<CodeFormState, FormData>(
    verifyLoginCodeAction,
    {},
  );

  // "corrigir e-mail": volta à etapa do e-mail até um novo envio
  const [fixing, setFixing] = useState(false);
  const [seenSend, setSeenSend] = useState(sendState);
  if (sendState !== seenSend) {
    setSeenSend(sendState);
    setFixing(false);
  }

  useTrackFormErrors(sendState, "login_code_request_error", { method: "code" });
  useTrackFormErrors(verifyState, "login_code_error", { method: "code" });
  useEffect(() => {
    if (sendState.sent) trackFunnel("login_code_sent", { method: "code" });
    // cada resultado da action é um objeto novo → 1 disparo por envio
  }, [sendState]);

  const email = verifyState.email ?? sendState.email;
  const sent = (sendState.sent || verifyState.sent) && !fixing;

  if (sent && email) {
    return (
      <>
        <h1 className="text-xl font-bold">Digite o código</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Enviamos um código de 6 dígitos para{" "}
          <strong className="text-foreground">{email}</strong>. Você também
          pode clicar no link do e-mail — funciona em qualquer aparelho.
        </p>

        <form
          action={verifyAction}
          className="mt-6 space-y-4"
          onSubmit={() => trackFunnel("login_code_submit", { method: "code" })}
        >
          <input type="hidden" name="email" value={email} />
          {next && <input type="hidden" name="next" value={next} />}
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
            <Label htmlFor="code">Código de acesso</Label>
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
          <SubmitButton pendingLabel="Verificando…">Entrar</SubmitButton>
        </form>

        <ResendCode
          email={email}
          action={sendLoginCodeAction}
          prefix="login_code"
          onFixEmail={() => setFixing(true)}
        >
          <p className="mt-2 text-xs text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link
              href="/cadastro"
              className="font-semibold text-primary underline-offset-2 hover:underline"
            >
              Criar minha loja
            </Link>
          </p>
        </ResendCode>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-bold">Entrar com código</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Sem senha: enviamos um código de acesso para o seu e-mail.
      </p>

      <form
        action={sendAction}
        className="mt-6 space-y-4"
        onSubmit={() => trackFunnel("login_code_request", { method: "code" })}
      >
        {sendState.error && (
          <Alert
            variant="destructive"
            className="border-transparent bg-destructive/10"
          >
            <AlertDescription className="text-destructive">
              {sendState.error}
            </AlertDescription>
          </Alert>
        )}
        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            key={email ?? ""}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={email}
            autoFocus={fixing}
            required
          />
          {sendState.fieldErrors?.email && (
            <p className="text-xs text-destructive">
              {sendState.fieldErrors.email}
            </p>
          )}
        </div>
        <SubmitButton pendingLabel="Enviando…">Enviar código</SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-ink-soft)]">
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="font-semibold text-[var(--color-brand)] hover:underline"
        >
          Entrar com senha
        </Link>
      </p>
    </>
  );
}
