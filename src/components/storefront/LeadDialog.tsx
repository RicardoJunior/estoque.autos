"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  CircleCheck,
  HandCoins,
  Loader2,
  MessageSquareText,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VEHICLE_COLORS } from "@/lib/optionals";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  MoneyInput,
  SuffixNumberInput,
} from "@/components/admin/masked-inputs";
import { WhatsAppButton } from "@/components/storefront/ContactButtons";
import { captureSfVars, LIGHT_ISLAND } from "@/components/storefront/theme-island";
import {
  submitLeadAction,
  type LeadFormState,
} from "@/app/[slug]/lead-actions";

// política de privacidade da plataforma (funciona também em domínio próprio)
const PRIVACY_URL = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/privacidade`;

/** Máscara BR de telefone enquanto digita: (11) 99999-9999. */
function maskPhoneBR(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

interface Props {
  vehicleId: string;
  vehicleTitle: string;
  /** nome da loja exibido na confirmação e no aviso de LGPD */
  storeName?: string;
  /** WhatsApp da loja — vira atalho na tela de sucesso */
  whatsapp?: string | null;
  /** mensagem pré-pronta do atalho de WhatsApp */
  waMessage?: string;
  /** rótulo do botão que abre o diálogo */
  trigger: React.ReactNode;
  triggerClassName?: string;
  triggerStyle?: React.CSSProperties;
}

export function LeadDialog({
  vehicleId,
  vehicleTitle,
  storeName,
  whatsapp,
  waMessage,
  trigger,
  triggerClassName,
  triggerStyle,
}: Props) {
  const [open, setOpen] = useState(false);
  const [themeStyle, setThemeStyle] = useState<React.CSSProperties>();

  // ilha shadcn CLARA + vars da loja — também vai nos popups (Select)
  // portalados pra fora do DialogContent
  const overlayStyle: React.CSSProperties = {
    ...themeStyle,
    ...LIGHT_ISLAND,
    fontFamily: "var(--sf-font, inherit)",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={triggerClassName}
        style={triggerStyle}
        onClick={(e) => setThemeStyle(captureSfVars(e.currentTarget))}
      >
        {trigger}
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        style={overlayStyle}
        className="bottom-0 top-auto max-h-[92dvh] max-w-none translate-y-0 gap-0 overflow-y-auto rounded-b-none rounded-t-2xl bg-white p-6 text-slate-900 ring-slate-900/10 sm:bottom-auto sm:top-1/2 sm:max-w-md sm:-translate-y-1/2 sm:rounded-2xl"
      >
        {/* o popup desmonta ao fechar (padrão do Base UI), então o
            useActionState do form zera a cada reabertura */}
        <LeadPanel
          vehicleId={vehicleId}
          vehicleTitle={vehicleTitle}
          storeName={storeName}
          whatsapp={whatsapp}
          waMessage={waMessage}
          overlayStyle={overlayStyle}
        />
      </DialogContent>
    </Dialog>
  );
}

type Mode = "proposal" | "message";

function LeadPanel({
  vehicleId,
  vehicleTitle,
  storeName,
  whatsapp,
  waMessage,
  overlayStyle,
}: {
  vehicleId: string;
  vehicleTitle: string;
  storeName?: string;
  whatsapp?: string | null;
  waMessage?: string;
  overlayStyle: React.CSSProperties;
}) {
  const [state, action] = useActionState<LeadFormState, FormData>(
    submitLeadAction,
    {},
  );
  const [mode, setMode] = useState<Mode>("proposal");
  const [phone, setPhone] = useState("");
  const [hasTrade, setHasTrade] = useState(false);

  if (state.ok) {
    return (
      <SuccessPanel
        mode={mode}
        storeName={storeName}
        vehicleId={vehicleId}
        whatsapp={whatsapp}
        waMessage={waMessage}
      />
    );
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <DialogHeader className="gap-0.5 text-left">
          <DialogTitle
            className="text-lg font-bold text-slate-900"
            style={{ fontFamily: "inherit" }}
          >
            Fale com a loja
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            {vehicleTitle}
          </DialogDescription>
        </DialogHeader>
        <DialogClose
          aria-label="Fechar"
          className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="size-5" />
        </DialogClose>
      </div>

      {/* tipo de contato — proposta com valor ou só uma mensagem */}
      <div
        role="radiogroup"
        aria-label="Tipo de contato"
        className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1"
      >
        <ModeButton
          active={mode === "proposal"}
          onClick={() => setMode("proposal")}
          icon={<HandCoins className="size-4" />}
          label="Fazer proposta"
        />
        <ModeButton
          active={mode === "message"}
          onClick={() => setMode("message")}
          icon={<MessageSquareText className="size-4" />}
          label="Enviar mensagem"
        />
      </div>

      <form action={action} className="mt-4 space-y-3.5">
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
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
          >
            {state.error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <LeadField
            label="Seu nome"
            required
            htmlFor="lead-name"
            error={state.fieldErrors?.name}
          >
            <Input
              id="lead-name"
              name="name"
              required
              autoComplete="name"
              placeholder="Maria Silva"
            />
          </LeadField>
          <LeadField
            label="Telefone / WhatsApp"
            required
            htmlFor="lead-phone"
            error={state.fieldErrors?.phone}
          >
            <Input
              id="lead-phone"
              name="phone"
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(maskPhoneBR(e.target.value))}
            />
          </LeadField>
        </div>

        <LeadField
          label="E-mail"
          optional
          htmlFor="lead-email"
          error={state.fieldErrors?.email}
        >
          <Input
            id="lead-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="voce@email.com.br"
          />
        </LeadField>

        {mode === "proposal" && (
          <>
            <LeadField label="Sua proposta" optional htmlFor="lead-proposal">
              <MoneyInput
                id="lead-proposal"
                name="proposal_value"
                placeholder="45.000"
              />
            </LeadField>

            {/* carro na troca: switch abre os campos estruturados — o
                server compõe o texto de trade_vehicle a partir deles */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
              <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                <Switch checked={hasTrade} onCheckedChange={setHasTrade} />
                Tenho um carro para dar na troca
              </label>
              {hasTrade && (
                <div className="mt-3.5 grid gap-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <LeadField label="Marca" htmlFor="lead-trade-brand">
                      <Input
                        id="lead-trade-brand"
                        name="trade_brand"
                        placeholder="Fiat"
                      />
                    </LeadField>
                    <LeadField label="Modelo" htmlFor="lead-trade-model">
                      <Input
                        id="lead-trade-model"
                        name="trade_model"
                        placeholder="Argo Drive 1.0"
                      />
                    </LeadField>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <LeadField label="Ano" htmlFor="lead-trade-year">
                      <Input
                        id="lead-trade-year"
                        name="trade_year"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="2019"
                      />
                    </LeadField>
                    <LeadField label="Cor" htmlFor="lead-trade-color">
                      <Select name="trade_color">
                        <SelectTrigger
                          id="lead-trade-color"
                          className="w-full"
                        >
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false} align="start" style={overlayStyle}>
                          {VEHICLE_COLORS.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </LeadField>
                    <LeadField label="Km" htmlFor="lead-trade-km">
                      <SuffixNumberInput
                        id="lead-trade-km"
                        name="trade_km"
                        suffix="km"
                        placeholder="45.000"
                      />
                    </LeadField>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <LeadField
          label="Mensagem"
          optional={mode === "proposal"}
          htmlFor="lead-message"
        >
          <Textarea
            id="lead-message"
            name="message"
            required={mode === "message"}
            className="min-h-20"
            placeholder={
              mode === "proposal"
                ? "Alguma condição ou observação?"
                : "Escreva sua dúvida sobre o veículo…"
            }
          />
        </LeadField>

        <LeadSubmit mode={mode} />
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

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-semibold transition",
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-700",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function LeadField({
  label,
  htmlFor,
  required,
  optional,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid content-start gap-1.5">
      <Label htmlFor={htmlFor} className="text-slate-700">
        {label}
        {required && (
          <span aria-hidden className="text-red-500">
            *
          </span>
        )}
        {optional && (
          <span className="font-normal text-slate-400">(opcional)</span>
        )}
      </Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function LeadSubmit({ mode }: { mode: Mode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />
          Enviando…
        </>
      ) : mode === "proposal" ? (
        "Enviar proposta"
      ) : (
        "Enviar mensagem"
      )}
    </Button>
  );
}

function SuccessPanel({
  mode,
  storeName,
  vehicleId,
  whatsapp,
  waMessage,
}: {
  mode: Mode;
  storeName?: string;
  vehicleId: string;
  whatsapp?: string | null;
  waMessage?: string;
}) {
  return (
    <div className="py-4 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100">
        <CircleCheck className="size-8 text-emerald-600" aria-hidden />
      </div>
      <DialogTitle
        className="mt-4 block text-lg font-bold text-slate-900"
        style={{ fontFamily: "inherit" }}
      >
        {mode === "proposal" ? "Proposta enviada!" : "Mensagem enviada!"}
      </DialogTitle>
      <DialogDescription className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
        {storeName ?? "A loja"} recebeu seus dados e retorna em breve pelo
        telefone informado.
      </DialogDescription>

      <div className="mt-6 space-y-2.5">
        {whatsapp && (
          <WhatsAppButton
            vehicleId={vehicleId}
            phone={whatsapp}
            message={waMessage ?? "Olá! Acabei de enviar uma proposta pelo site."}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] py-3 text-sm font-bold text-white transition hover:opacity-90"
          >
            Adiantar pelo WhatsApp
          </WhatsAppButton>
        )}
        <DialogClose
          className="flex w-full items-center justify-center rounded-lg border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Fechar
        </DialogClose>
      </div>
    </div>
  );
}
