"use client";

import { useActionState } from "react";
import { use } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { loginAction, type AuthFormState } from "../actions";
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

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = use(searchParams);
  const [state, action] = useActionState<AuthFormState, FormData>(loginAction, {});

  return (
    <>
      <h1 className="text-xl font-bold">Entrar na sua conta</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Acesse o painel da sua loja.
      </p>

      <form action={action} className="mt-6 space-y-4">
        {next && <input type="hidden" name="next" value={next} />}
        {state.error && (
          <div className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            {state.error}
          </div>
        )}
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
        <div className="grid gap-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          {state.fieldErrors?.password && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.password}
            </p>
          )}
        </div>
        <div className="flex justify-end">
          <Link
            href="/esqueci-senha"
            className="text-sm font-medium text-[var(--color-brand)] hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>
        <SubmitButton pendingLabel="Entrando…">Entrar</SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link
          href="/cadastro"
          className="font-semibold text-primary hover:underline"
        >
          Criar minha loja
        </Link>
      </p>
    </>
  );
}
