"use client";

import { useActionState } from "react";
import { use } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { loginAction, type AuthFormState } from "../actions";
import { trackFunnel } from "@/lib/funnel";
import { useTrackFormErrors } from "@/hooks/use-track-form-errors";
import { FunnelEvent } from "@/components/FunnelEvent";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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

const URL_ERRORS: Record<string, string> = {
  link: "Este link expirou ou já foi usado. Entre com um código por e-mail ou peça um novo link.",
  auth: "Não foi possível validar o link. Entre com um código por e-mail ou tente de novo.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = use(searchParams);
  const [state, action] = useActionState<AuthFormState, FormData>(loginAction, {});
  const urlError = error ? URL_ERRORS[error] : undefined;

  useTrackFormErrors(state, "login_error", { method: "password" });

  return (
    <>
      {/* link de e-mail expirado/inválido (/auth/confirm, /auth/callback) */}
      {urlError && (
        <FunnelEvent
          name="login_error"
          params={{ method: "link", error_type: error }}
          dedupeKey={`link:${error}`}
        />
      )}
      <h1 className="text-xl font-bold">Entrar na sua conta</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Acesse o painel da sua loja.
      </p>

      <form
        action={action}
        className="mt-6 space-y-4"
        onSubmit={() => trackFunnel("login_submit", { method: "password" })}
      >
        {next && <input type="hidden" name="next" value={next} />}
        {!state.error && urlError && (
          <Alert
            variant="destructive"
            className="border-transparent bg-destructive/10"
          >
            <AlertDescription className="text-destructive">
              {urlError}
            </AlertDescription>
          </Alert>
        )}
        {state.error && (
          <Alert
            variant="destructive"
            className="border-transparent bg-destructive/10"
          >
            <AlertDescription className="text-destructive">
              {state.error}
            </AlertDescription>
          </Alert>
        )}
        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            key={state.values?.email ?? ""}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.values?.email}
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

      <div className="mt-4 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">ou</span>
        <Separator className="flex-1" />
      </div>

      <Link
        href={next ? `/login/codigo?next=${encodeURIComponent(next)}` : "/login/codigo"}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "mt-4 w-full font-semibold",
        )}
      >
        Entrar com código por e-mail (sem senha)
      </Link>

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
