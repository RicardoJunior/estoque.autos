"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  submitLeadAction,
  type LeadFormState,
} from "@/app/[slug]/lead-actions";

// política de privacidade da plataforma (funciona também em domínio próprio)
const PRIVACY_URL = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/privacidade`;

/**
 * Vars do tema da vitrine que o painel usa. O DialogContent é portalado
 * para o <body>, FORA do container onde o [slug]/layout aplica as --sf-*
 * (ver storefront/theme.ts) — então copiamos os valores resolvidos a
 * partir do trigger, que vive dentro do container temado.
 */
const THEME_VARS = ["--sf-accent", "--sf-on-accent", "--sf-font"] as const;

interface Props {
  vehicleId: string;
  vehicleTitle: string;
  /** nome da loja exibido no aviso de LGPD do rodapé */
  storeName?: string;
  /** rótulo do botão que abre o diálogo */
  trigger: React.ReactNode;
  triggerClassName?: string;
  triggerStyle?: React.CSSProperties;
}

export function LeadDialog({
  vehicleId,
  vehicleTitle,
  storeName,
  trigger,
  triggerClassName,
  triggerStyle,
}: Props) {
  const [open, setOpen] = useState(false);
  const [themeStyle, setThemeStyle] = useState<React.CSSProperties>();

  function captureTheme(el: HTMLElement) {
    const computed = getComputedStyle(el);
    const vars: Record<string, string> = {};
    for (const name of THEME_VARS) {
      const value = computed.getPropertyValue(name).trim();
      if (value) vars[name] = value;
    }
    setThemeStyle(vars as React.CSSProperties);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={triggerClassName}
        style={triggerStyle}
        onClick={(e) => captureTheme(e.currentTarget)}
      >
        {trigger}
      </DialogTrigger>
      {/* painel sempre claro (como na v1), independente do .dark global */}
      <DialogContent
        showCloseButton={false}
        style={{ ...themeStyle, fontFamily: "var(--sf-font, inherit)" }}
        className="bottom-0 top-auto max-w-none translate-y-0 gap-0 rounded-b-none rounded-t-2xl bg-white p-6 text-slate-900 ring-slate-900/10 sm:bottom-auto sm:top-1/2 sm:max-w-md sm:-translate-y-1/2 sm:rounded-2xl"
      >
        {/* o popup desmonta ao fechar (padrão do Base UI), então o
            useActionState do form zera a cada reabertura */}
        <LeadPanel
          vehicleId={vehicleId}
          vehicleTitle={vehicleTitle}
          storeName={storeName}
        />
      </DialogContent>
    </Dialog>
  );
}

function LeadPanel({
  vehicleId,
  vehicleTitle,
  storeName,
}: {
  vehicleId: string;
  vehicleTitle: string;
  storeName?: string;
}) {
  const [state, action] = useActionState<LeadFormState, FormData>(
    submitLeadAction,
    {},
  );

  if (state.ok) {
    return (
      <div className="py-6 text-center">
        <div className="text-4xl">✅</div>
        <DialogTitle
          className="mt-3 block text-lg font-bold"
          style={{ fontFamily: "inherit" }}
        >
          Proposta enviada!
        </DialogTitle>
        <DialogDescription className="mt-1 text-sm text-slate-500">
          A loja vai entrar em contato em breve.
        </DialogDescription>
        <DialogClose className="mt-5 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white">
          Fechar
        </DialogClose>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-start justify-between">
        <DialogHeader className="gap-0 text-left">
          <DialogTitle
            className="text-lg font-bold text-slate-900"
            style={{ fontFamily: "inherit" }}
          >
            Fazer proposta
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            {vehicleTitle}
          </DialogDescription>
        </DialogHeader>
        <DialogClose
          className="text-2xl leading-none text-slate-400 hover:text-slate-600"
          aria-label="Fechar"
        >
          ×
        </DialogClose>
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
          Seus dados serão enviados {storeName ? `a ${storeName}` : "à loja"}{" "}
          para retorno do contato.{" "}
          <a
            href={PRIVACY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-500"
          >
            Política de privacidade
          </a>
        </p>
      </form>
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
