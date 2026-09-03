"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { signupAction, type AuthFormState } from "../actions";
import { PLANS, formatPlanPrice, type BillingInterval } from "@/lib/billing";
import type { PlanId } from "@/lib/types";
import { trackFunnel } from "@/lib/funnel";
import { useTrackFormErrors } from "@/hooks/use-track-form-errors";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/admin/masked-inputs";

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
  next,
  defaultEmail,
}: {
  plano: PlanId;
  intervalo: BillingInterval;
  /** destino pós-cadastro (ex.: /convite/{token}) — pula o checkout */
  next?: string;
  /** e-mail pré-preenchido (volta do "corrigir e-mail" da tela de código) */
  defaultEmail?: string;
}) {
  const [state, action] = useActionState<AuthFormState, FormData>(
    signupAction,
    {},
  );
  const plan = PLANS[plano];
  const invited = !!next;
  const funnel = { plan: plano, interval: intervalo, invited };

  useTrackFormErrors(state, "sign_up_error", funnel);

  return (
    <>
      <h1 className="text-xl font-bold">
        {invited ? "Crie sua conta" : "Crie a conta da sua loja"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {invited
          ? "Depois de confirmar o e-mail, você volta para aceitar o convite."
          : "Em poucos minutos seu site estará no ar."}
      </p>

      <div className={invited ? "hidden" : "mt-4 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3.5 py-2.5 text-sm"}>
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

      <form
        action={action}
        className="mt-5 space-y-4"
        onSubmit={(ev) => {
          const fd = new FormData(ev.currentTarget);
          trackFunnel("sign_up_submit", {
            ...funnel,
            has_phone: String(fd.get("phone") || "").length > 0,
          });
        }}
      >
        <input type="hidden" name="plano" value={plano} />
        <input type="hidden" name="intervalo" value={intervalo} />
        {next && <input type="hidden" name="next" value={next} />}
        {state.error && (
          <Alert
            variant="destructive"
            className="border-transparent bg-destructive/10"
          >
            <AlertDescription className="text-destructive">
              {state.error}
              {state.code === "email_exists" && (
                <>
                  {" "}
                  <Link href="/login" className="font-semibold underline">
                    Entrar
                  </Link>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}
        <div className="grid gap-2">
          <Label htmlFor="name">Seu nome</Label>
          <Input
            key={state.values?.name ?? ""}
            id="name"
            name="name"
            autoComplete="name"
            defaultValue={state.values?.name}
            required
          />
          {state.fieldErrors?.name && (
            <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            key={state.values?.email ?? defaultEmail ?? ""}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.values?.email ?? defaultEmail}
            required
          />
          {state.fieldErrors?.email && (
            <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Celular (WhatsApp)</Label>
          <PhoneInput
            id="phone"
            name="phone"
            autoComplete="tel"
            defaultValue={state.values?.phone}
            required
          />
          {state.fieldErrors?.phone ? (
            <p className="text-xs text-destructive">{state.fieldErrors.phone}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Só para te ajudar a colocar a loja no ar. Sem spam.
            </p>
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
        <p className="text-center text-xs text-muted-foreground">
          Ao criar a conta, você concorda com os{" "}
          <Link
            href="/termos"
            className="underline underline-offset-2 hover:text-primary"
          >
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link
            href="/privacidade"
            className="underline underline-offset-2 hover:text-primary"
          >
            Política de Privacidade
          </Link>
          .
        </p>
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
