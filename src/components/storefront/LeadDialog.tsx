"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  submitLeadAction,
  type LeadFormState,
} from "@/app/[slug]/lead-actions";

interface Props {
  vehicleId: string;
  vehicleTitle: string;
  /** rótulo do botão que abre o diálogo */
  trigger: React.ReactNode;
  triggerClassName?: string;
  triggerStyle?: React.CSSProperties;
}

export function LeadDialog({
  vehicleId,
  vehicleTitle,
  trigger,
  triggerClassName,
  triggerStyle,
}: Props) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<LeadFormState, FormData>(
    submitLeadAction,
    {},
  );
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        style={triggerStyle}
        onClick={() => setOpen(true)}
      >
        {trigger}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            ref={dialogRef}
            className="w-full max-w-md rounded-t-2xl bg-white p-6 text-slate-900 shadow-xl sm:rounded-2xl"
          >
            {state.ok ? (
              <div className="py-6 text-center">
                <div className="text-4xl">✅</div>
                <h3 className="mt-3 text-lg font-bold">Proposta enviada!</h3>
                <p className="mt-1 text-sm text-slate-500">
                  A loja vai entrar em contato em breve.
                </p>
                <button
                  className="mt-5 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white"
                  onClick={() => setOpen(false)}
                >
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold">Fazer proposta</h3>
                    <p className="text-sm text-slate-500">{vehicleTitle}</p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-2xl leading-none text-slate-400 hover:text-slate-600"
                    aria-label="Fechar"
                  >
                    ×
                  </button>
                </div>

                <form action={action} className="mt-4 space-y-3">
                  <input type="hidden" name="vehicle_id" value={vehicleId} />
                  <input type="hidden" name="type" value="proposal" />
                  {/* honeypot — escondido de humanos */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    aria-hidden
                  />

                  {state.error && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                      {state.error}
                    </p>
                  )}

                  <LeadInput
                    name="name"
                    placeholder="Seu nome *"
                    error={state.fieldErrors?.name}
                    autoComplete="name"
                  />
                  <LeadInput
                    name="phone"
                    placeholder="Telefone / WhatsApp *"
                    error={state.fieldErrors?.phone}
                    autoComplete="tel"
                  />
                  <LeadInput
                    name="email"
                    type="email"
                    placeholder="E-mail (opcional)"
                    error={state.fieldErrors?.email}
                    autoComplete="email"
                  />
                  <LeadInput
                    name="proposal_value"
                    type="number"
                    inputMode="numeric"
                    placeholder="Valor da sua proposta (R$)"
                  />
                  <LeadInput
                    name="trade_vehicle"
                    placeholder="Tem carro na troca? Qual? (opcional)"
                  />
                  <textarea
                    name="message"
                    placeholder="Mensagem (opcional)"
                    className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  />

                  <LeadSubmit />
                  <p className="text-center text-xs text-slate-400">
                    Ao enviar, você concorda em ser contatado pela loja.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function LeadInput({
  error,
  ...props
}: { error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <input
        {...props}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function LeadSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg py-3 text-sm font-bold disabled:opacity-60"
      style={{
        background: "var(--sf-accent)",
        color: "var(--sf-on-accent)",
      }}
    >
      {pending ? "Enviando…" : "Enviar proposta"}
    </button>
  );
}
