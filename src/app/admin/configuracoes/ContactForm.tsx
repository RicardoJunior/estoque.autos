"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      const data = (await res.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
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
        <div className="rounded-lg bg-primary/10 px-3.5 py-2.5 text-sm text-primary">
          ✓ Dados salvos.
        </div>
      )}
      {state.error && (
        <div className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dados da loja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da loja</Label>
            <Input id="name" name="name" defaultValue={tenant.name} required />
            {state.fieldErrors?.name && (
              <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={tenant.phone ?? ""}
                placeholder="(11) 3333-4444"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                defaultValue={tenant.whatsapp ?? ""}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={tenant.email ?? ""}
            />
            {state.fieldErrors?.email && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.email}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <div className="grid gap-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                name="cep"
                defaultValue={addr.cep ?? ""}
                placeholder="00000-000"
                onBlur={(ev) => lookupCep(ev.currentTarget.value)}
              />
              {cepLoading && (
                <p className="text-xs text-muted-foreground">Buscando…</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="street">Rua</Label>
              <Input
                id="street"
                name="street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="number">Número</Label>
              <Input id="number" name="number" defaultValue={addr.number ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                name="complement"
                defaultValue={addr.complement ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                name="neighborhood"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <div className="grid gap-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                name="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="state">UF</Label>
              <Input
                id="state"
                name="state"
                value={uf}
                maxLength={2}
                onChange={(e) => setUf(e.target.value.toUpperCase())}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SaveButton />
      </div>
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando…" : "Salvar"}
    </Button>
  );
}
