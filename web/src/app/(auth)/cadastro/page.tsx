"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type AuthFormState } from "../actions";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default function SignupPage() {
  const [state, action] = useActionState<AuthFormState, FormData>(
    signupAction,
    {},
  );

  return (
    <>
      <h1 className="text-xl font-bold">Crie a conta da sua loja</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Em poucos minutos seu site estará no ar.
      </p>

      <form action={action} className="mt-6 space-y-4">
        {state.error && (
          <div className="rounded-[var(--radius)] bg-red-50 px-3.5 py-2.5 text-sm text-[var(--color-danger)]">
            {state.error}
          </div>
        )}
        <Field
          label="Seu nome"
          name="name"
          autoComplete="name"
          required
          error={state.fieldErrors?.name}
        />
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
          autoComplete="new-password"
          required
          hint="Mínimo de 8 caracteres."
          error={state.fieldErrors?.password}
        />
        <SubmitButton pendingLabel="Criando conta…">
          Criar minha conta
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-ink-soft)]">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--color-brand)] hover:underline"
        >
          Entrar
        </Link>
      </p>
    </>
  );
}
