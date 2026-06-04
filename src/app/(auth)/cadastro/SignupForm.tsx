"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { signupAction, type AuthFormState } from "../actions";
import { PLANS, formatPlanPrice, type BillingInterval } from "@/lib/billing";
import type { PlanId } from "@/lib/types";
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

export function SignupForm({
  plano,
  intervalo,
}: {
  plano: PlanId;
  intervalo: BillingInterval;
}) {
  const [state, action] = useActionState<AuthFormState, FormData>(
    signupAction,
    {},
  );
  const plan = PLANS[plano];

  return (
    <>
      <h1 className="text-xl font-bold">Crie a conta da sua loja</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Em poucos minutos seu site estará no ar.
      </p>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3.5 py-2.5 text-sm">
        <span>
          Plano <strong>{plan.name}</strong>{" "}
          <span className="text-muted-foreground">
            ({intervalo === "anual" ? "anual" : "mensal"})
          </span>{" "}
          —{" "}
          <span className="text-primary font-semibold">
            {formatPlanPrice(plan, intervalo)}
          </span>
        </span>
        <Link
          href="/#planos"
          className="text-xs text-muted-foreground hover:text-primary hover:underline"
        >
          trocar
        </Link>
      </div>

      <form action={action} className="mt-5 space-y-4">
        <input type="hidden" name="plano" value={plano} />
        <input type="hidden" name="intervalo" value={intervalo} />
        {state.error && (
          <div className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            {state.error}
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="name">Seu nome</Label>
          <Input id="name" name="name" autoComplete="name" required />
          {state.fieldErrors?.name && (
            <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
          )}
        </div>
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
            autoComplete="new-password"
            required
          />
          {state.fieldErrors?.password ? (
            <p className="text-xs text-destructive">
              {state.fieldErrors.password}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Mínimo de 8 caracteres.
            </p>
          )}
        </div>
        <SubmitButton pendingLabel="Criando conta…">
          Criar conta e continuar
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          Entrar
        </Link>
      </p>
    </>
  );
}
