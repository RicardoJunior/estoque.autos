"use client";

import { useActionState, useState } from "react";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { updateContactAction, type ContactState } from "./actions";
import type { Tenant } from "@/lib/types";

export function ContactForm({ tenant }: { tenant: Tenant }) {
  const [state, action] = useActionState<ContactState, FormData>(
    updateContactAction,
    {},
  );
  const addr = tenant.address ?? {};
  const [street, setStreet] = useState(addr.street ?? "");
  const [neighborhood, setNeighborhood] = useState(addr.neighborhood ?? "");
  const [city, setCity] = useState(addr.city ?? "");
  const [uf, setUf] = useState(addr.state ?? "");
  const [cepLoading, setCepLoading] = useState(false);

  async function lookupCep(cep: string) {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setStreet(data.logradouro ?? "");
        setNeighborhood(data.bairro ?? "");
        setCity(data.localidade ?? "");
        setUf(data.uf ?? "");
      }
    } catch {
      // silencioso — preenchimento manual continua possível
    } finally {
      setCepLoading(false);
    }
  }

  return (
    <form action={action} className="space-y-6">
      {state.ok && (
        <div className="rounded-[var(--radius)] bg-green-50 px-3.5 py-2.5 text-sm text-[var(--color-success)]">
          ✓ Dados salvos.
        </div>
      )}
      {state.error && (
        <div className="rounded-[var(--radius)] bg-red-50 px-3.5 py-2.5 text-sm text-[var(--color-danger)]">
          {state.error}
        </div>
      )}

      <fieldset className="card space-y-4 p-5">
        <legend className="px-1 text-sm font-semibold">Dados da loja</legend>
        <Field label="Nome da loja" name="name" defaultValue={tenant.name} error={state.fieldErrors?.name} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefone" name="phone" defaultValue={tenant.phone ?? ""} placeholder="(11) 3333-4444" />
          <Field label="WhatsApp" name="whatsapp" defaultValue={tenant.whatsapp ?? ""} placeholder="(11) 99999-9999" />
        </div>
        <Field label="E-mail" name="email" type="email" defaultValue={tenant.email ?? ""} error={state.fieldErrors?.email} />
      </fieldset>

      <fieldset className="card space-y-4 p-5">
        <legend className="px-1 text-sm font-semibold">Endereço</legend>
        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <Field
            label="CEP"
            name="cep"
            defaultValue={addr.cep ?? ""}
            placeholder="00000-000"
            onBlur={(ev) => lookupCep(ev.currentTarget.value)}
            hint={cepLoading ? "Buscando…" : undefined}
          />
          <Field label="Rua" name="street" value={street} onChange={(e) => setStreet(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Número" name="number" defaultValue={addr.number ?? ""} />
          <Field label="Complemento" name="complement" defaultValue={addr.complement ?? ""} />
          <Field label="Bairro" name="neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <Field label="Cidade" name="city" value={city} onChange={(e) => setCity(e.target.value)} />
          <Field label="UF" name="state" value={uf} maxLength={2} onChange={(e) => setUf(e.target.value.toUpperCase())} />
        </div>
      </fieldset>

      <div className="flex justify-end">
        <SubmitButton className="btn-primary" pendingLabel="Salvando…">
          Salvar
        </SubmitButton>
      </div>
    </form>
  );
}
