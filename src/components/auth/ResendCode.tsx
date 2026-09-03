"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { CodeFormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { trackFunnel, type FunnelEvent } from "@/lib/funnel";

/** = [auth.email].max_frequency no supabase/config.toml (1 minuto). */
const COOLDOWN_SECONDS = 60;

type Prefix = "confirm_code" | "login_code";

function storageKey(email: string) {
  return `code_sent_at:${email.trim().toLowerCase()}`;
}
function readSentAt(email: string): number | null {
  try {
    const raw = sessionStorage.getItem(storageKey(email));
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}
function writeSentAt(email: string, ts: number) {
  try {
    sessionStorage.setItem(storageKey(email), String(ts));
  } catch {
    /* storage bloqueado — segue sem persistir o cooldown */
  }
}
function secondsLeft(sentAt: number, now: number): number {
  return Math.max(0, Math.ceil((sentAt + COOLDOWN_SECONDS * 1000 - now) / 1000));
}

function ResendButton({ remaining }: { remaining: number }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      className="w-full"
      disabled={pending || remaining > 0}
    >
      {pending
        ? "Reenviando…"
        : remaining > 0
          ? `Reenviar código em ${remaining}s`
          : "Reenviar código"}
    </Button>
  );
}

/**
 * Fluxo "não recebi o código" das telas de código (cadastro e login):
 * dicas (spam, remetente, prazo), reenvio com cooldown de 60s (o
 * Supabase recusa reenvio antes disso — melhor mostrar a contagem do
 * que um erro), correção do e-mail e eventos GA4 de cada passo.
 *
 * O cooldown fica no sessionStorage por e-mail: recarregar a página
 * não zera a contagem.
 */
export function ResendCode({
  email,
  action,
  prefix,
  fixEmailHref,
  onFixEmail,
  startCooldown = true,
  children,
}: {
  email: string;
  /** server action de reenvio — recebe `email` no FormData */
  action: (prev: CodeFormState, formData: FormData) => Promise<CodeFormState>;
  /** prefixo dos eventos GA4 (confirm_code_* | login_code_*) */
  prefix: Prefix;
  /** link para corrigir o e-mail (cadastro) */
  fixEmailHref?: string;
  /** callback para corrigir o e-mail (login: volta à etapa do e-mail) */
  onFixEmail?: () => void;
  /** começa contando ao montar (o e-mail acabou de sair) */
  startCooldown?: boolean;
  /** ajuda extra (ex.: "já tem conta? entrar") */
  children?: React.ReactNode;
}) {
  const [state, formAction] = useActionState<CodeFormState, FormData>(action, {});
  const [open, setOpen] = useState(false);
  const [remaining, setRemaining] = useState(0);

  // o e-mail acabou de sair: registra o horário para o cooldown
  // sobreviver a um reload (o storage é a fonte única da contagem)
  useEffect(() => {
    if (startCooldown && !readSentAt(email)) writeSentAt(email, Date.now());
  }, [email, startCooldown]);

  // resultado do reenvio → sistemas externos: GA4 + storage
  useEffect(() => {
    if (state.sent) {
      trackFunnel(`${prefix}_resent`);
      writeSentAt(email, Date.now());
    } else if (state.error) {
      trackFunnel(`${prefix}_resend_error`, { error_type: state.code ?? "unknown" });
      // o servidor mandou esperar e não sabemos desde quando: conta 60s
      if (state.code === "rate_limit" && !readSentAt(email)) writeSentAt(email, Date.now());
    }
    // cada resultado da action é um objeto novo → 1 disparo por tentativa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // relógio da contagem: só com o painel aberto; relê o storage a cada
  // segundo e logo após um reenvio (`state` nas deps, effect acima
  // já gravou o novo horário)
  useEffect(() => {
    if (!open) return;
    const tick = () => {
      const at = readSentAt(email);
      setRemaining(at ? secondsLeft(at, Date.now()) : 0);
    };
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [open, email, state]);

  const event = (suffix: string) => `${prefix}_${suffix}` as FunnelEvent;

  if (!open) {
    return (
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            trackFunnel(event("not_received"));
          }}
          className="text-sm text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
        >
          Não recebeu o código?
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4 text-left text-sm">
      <p className="font-semibold">Não recebeu o código?</p>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
        <li>Pode levar até 2 minutos para chegar.</li>
        <li>Confira a caixa de spam/lixo eletrônico e a aba Promoções.</li>
        <li>
          O remetente é <strong className="text-foreground">noreply@estoque.autos</strong>.
        </li>
      </ul>

      <form
        action={formAction}
        className="mt-3"
        onSubmit={() => trackFunnel(event("resend"))}
      >
        <input type="hidden" name="email" value={email} />
        <ResendButton remaining={remaining} />
      </form>

      {state.sent && (
        <p className="mt-2 text-xs text-primary" role="status">
          Código reenviado para <strong>{email}</strong>. Use o mais recente —
          o anterior deixa de valer.
        </p>
      )}
      {state.error && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {state.error}
        </p>
      )}

      {(fixEmailHref || onFixEmail) && (
        <p className="mt-3 text-xs text-muted-foreground">
          Digitou o e-mail errado?{" "}
          {fixEmailHref ? (
            <Link
              href={fixEmailHref}
              className="font-semibold text-primary underline-offset-2 hover:underline"
            >
              Corrigir e-mail
            </Link>
          ) : (
            <button
              type="button"
              onClick={onFixEmail}
              className="font-semibold text-primary underline-offset-2 hover:underline"
            >
              Corrigir e-mail
            </button>
          )}
        </p>
      )}
      {children}
    </div>
  );
}
