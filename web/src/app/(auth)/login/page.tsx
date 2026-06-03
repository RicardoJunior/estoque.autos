"use client";

import { useActionState } from "react";
import { use } from "react";
import Link from "next/link";
import { loginAction, type AuthFormState } from "../actions";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

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
          <div className="rounded-[var(--radius)] bg-red-50 px-3.5 py-2.5 text-sm text-[var(--color-danger)]">
            {state.error}
          </div>
        )}
        <Field
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={state.fieldErrors?.email}
        />
        <Field
          label="Senha"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={state.fieldErrors?.password}
        />
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

      <p className="mt-6 text-center text-sm text-[var(--color-ink-soft)]">
        Ainda não tem conta?{" "}
        <Link
          href="/cadastro"
          className="font-semibold text-[var(--color-brand)] hover:underline"
        >
          Criar loja grátis
        </Link>
      </p>
    </>
  );
}
