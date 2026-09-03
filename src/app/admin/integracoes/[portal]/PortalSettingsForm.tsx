"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ConnectionSettings } from "@/lib/integrations/types";
import type { PortalId } from "@/lib/types";
import { FormBanner } from "@/components/admin/FormBanner";
import { PhoneInput } from "@/components/admin/masked-inputs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { savePortalSettingsAction, type PortalActionState } from "../actions";

const LISTING_TYPES = [
  { value: "silver", label: "Pacote (padrão)" },
  { value: "gold", label: "Destaque (gold)" },
  { value: "gold_premium", label: "Destaque premium (gold premium)" },
];

export function PortalSettingsForm({
  portal,
  settings,
}: {
  portal: PortalId;
  settings: ConnectionSettings;
}) {
  const [state, action] = useActionState<PortalActionState, FormData>(
    savePortalSettingsAction.bind(null, portal),
    {},
  );
  return (
    <form action={action} className="space-y-4">
      {state.ok && <FormBanner variant="success">Opções salvas.</FormBanner>}
      {state.error && <FormBanner variant="error">{state.error}</FormBanner>}

      <label className="flex items-start gap-3 text-sm">
        <Switch name="auto_publish" defaultChecked={settings.auto_publish !== false} />
        <span>
          <span className="font-medium">Publicar carros novos automaticamente</span>
          <span className="block text-xs text-muted-foreground">
            Todo carro cadastrado já nasce marcado para este portal.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3 text-sm">
        <Switch name="unpublish_on_reserved" defaultChecked={settings.unpublish_on_reserved === true} />
        <span>
          <span className="font-medium">Tirar do portal quando marcar como reservado</span>
          <span className="block text-xs text-muted-foreground">
            Desligado: o anúncio continua no ar enquanto reservado. Vendido e desativado sempre saem.
          </span>
        </span>
      </label>

      {portal === "mercadolivre" && (
        <div className="grid gap-2">
          <Label htmlFor="listing_type">Tipo de anúncio</Label>
          <Select name="listing_type" defaultValue={settings.listing_type ?? "silver"}>
            <SelectTrigger id="listing_type" className="w-full sm:max-w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="start">
              {LISTING_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Destaques consomem cotas do seu pacote no Mercado Livre.
          </p>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="phone_override">Telefone de contato nos anúncios</Label>
        <div className="sm:max-w-72">
          <PhoneInput id="phone_override" name="phone_override" defaultValue={settings.phone_override ?? ""} />
        </div>
        <p className="text-xs text-muted-foreground">
          Vazio = usa o telefone/WhatsApp da loja (Configurações).
        </p>
        {state.fieldErrors?.phone_override && (
          <p className="text-xs text-destructive">{state.fieldErrors.phone_override}</p>
        )}
      </div>

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
      {pending ? "Salvando…" : "Salvar opções"}
    </Button>
  );
}
