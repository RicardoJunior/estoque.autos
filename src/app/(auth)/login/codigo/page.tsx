"use client";

import { useActionState, use } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  sendLoginCodeAction,
  verifyLoginCodeAction,
  type CodeFormState,
} from "../../actions";
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

  const email = verifyState.email ?? sendState.email;
  const sent = sendState.sent || verifyState.sent;

  if (sent && email) {
    return (
      <>
        <h1 className="text-xl font-bold">Digite o código</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Enviamos um código de 6 dígitos para <strong>{email}</strong>. Você
          também pode clicar no link do e-mail — funciona em qualquer aparelho.
        </p>

        <form action={verifyAction} className="mt-6 space-y-4">
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

        <form action={sendAction} className="mt-4">
          <input type="hidden" name="email" value={email} />
          <Button type="submit" variant="link" className="w-full">
            Reenviar código
          </Button>
        </form>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-bold">Entrar com código</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Sem senha: enviamos um código de acesso para o seu e-mail.
      </p>

      <form action={sendAction} className="mt-6 space-y-4">
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
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={sendState.email}
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
