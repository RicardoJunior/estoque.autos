"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

const grouper = new Intl.NumberFormat("pt-BR");

function digitsOnly(v: string): string {
  return v.replace(/\D/g, "");
}

function formatGrouped(digits: string): string {
  if (!digits) return "";
  return grouper.format(Number(digits));
}

/**
 * Input numérico com separador de milhar pt-BR enquanto digita.
 * O valor CRU (só dígitos) vai no hidden `name` — o server continua
 * recebendo "132900", o lojista vê "132.900".
 */
export function MoneyInput({
  name,
  id,
  defaultValue,
  value,
  onValueChange,
  required,
  placeholder = "0",
}: {
  name: string;
  id?: string;
  defaultValue?: string | number | null;
  /** modo controlado (ex.: botão "usar preço FIPE" preenche) */
  value?: string;
  onValueChange?: (raw: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  const [inner, setInner] = useState(
    defaultValue != null ? String(defaultValue) : "",
  );
  const raw = value !== undefined ? value : inner;
  const set = onValueChange ?? setInner;

  return (
    <InputGroup>
      <InputGroupAddon>R$</InputGroupAddon>
      <InputGroupInput
        id={id}
        inputMode="numeric"
        autoComplete="off"
        required={required}
        placeholder={placeholder}
        value={formatGrouped(raw)}
        onChange={(ev) => set(digitsOnly(ev.target.value))}
      />
      <input type="hidden" name={name} value={raw} />
    </InputGroup>
  );
}

function formatPhoneBR(digits: string): string {
  const d = digits.slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Telefone/WhatsApp BR: (11) 98765-4321. Valor cru só-dígitos no submit. */
export function PhoneInput({
  name,
  id,
  defaultValue,
  placeholder = "(11) 98765-4321",
  autoComplete = "tel",
  required,
}: {
  name: string;
  id?: string;
  defaultValue?: string | null;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const [digits, setDigits] = useState(
    defaultValue ? defaultValue.replace(/\D/g, "").slice(0, 11) : "",
  );
  return (
    <>
      <Input
        id={id}
        inputMode="tel"
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        value={formatPhoneBR(digits)}
        onChange={(ev) => setDigits(ev.target.value.replace(/\D/g, "").slice(0, 11))}
      />
      <input type="hidden" name={name} value={digits} />
    </>
  );
}

function formatCep(digits: string): string {
  const d = digits.slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** CEP: 01310-100. Chama onComplete quando tem 8 dígitos (autofill ViaCEP). */
export function CepInput({
  name,
  id,
  defaultValue,
  onComplete,
  placeholder = "01310-100",
}: {
  name: string;
  id?: string;
  defaultValue?: string | null;
  onComplete?: (cep: string) => void;
  placeholder?: string;
}) {
  const [digits, setDigits] = useState(
    defaultValue ? defaultValue.replace(/\D/g, "").slice(0, 8) : "",
  );
  return (
    <Input
      id={id}
      name={name}
      inputMode="numeric"
      autoComplete="postal-code"
      placeholder={placeholder}
      value={formatCep(digits)}
      onChange={(ev) => {
        const next = ev.target.value.replace(/\D/g, "").slice(0, 8);
        setDigits(next);
        if (next.length === 8) onComplete?.(next);
      }}
    />
  );
}

function formatCnpj(digits: string): string {
  const d = digits.slice(0, 14);
  let out = d.slice(0, 2);
  if (d.length > 2) out += `.${d.slice(2, 5)}`;
  if (d.length > 5) out += `.${d.slice(5, 8)}`;
  if (d.length > 8) out += `/${d.slice(8, 12)}`;
  if (d.length > 12) out += `-${d.slice(12)}`;
  return out;
}

/** CNPJ: 12.345.678/0001-90. Só dígitos no submit. */
export function CnpjInput({
  name,
  id,
  defaultValue,
  placeholder = "12.345.678/0001-90",
}: {
  name: string;
  id?: string;
  defaultValue?: string | null;
  placeholder?: string;
}) {
  const [digits, setDigits] = useState(
    defaultValue ? defaultValue.replace(/\D/g, "").slice(0, 14) : "",
  );
  return (
    <>
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={formatCnpj(digits)}
        onChange={(ev) => setDigits(ev.target.value.replace(/\D/g, "").slice(0, 14))}
      />
      <input type="hidden" name={name} value={digits} />
    </>
  );
}

/** Idem, com sufixo (ex.: km). */
export function SuffixNumberInput({
  name,
  id,
  suffix,
  defaultValue,
  placeholder = "0",
}: {
  name: string;
  id?: string;
  suffix: string;
  defaultValue?: string | number | null;
  placeholder?: string;
}) {
  const [raw, setRaw] = useState(
    defaultValue != null ? String(defaultValue) : "",
  );
  return (
    <InputGroup>
      <InputGroupInput
        id={id}
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={formatGrouped(raw)}
        onChange={(ev) => setRaw(digitsOnly(ev.target.value))}
      />
      <InputGroupAddon align="inline-end">{suffix}</InputGroupAddon>
      <input type="hidden" name={name} value={raw} />
    </InputGroup>
  );
}
