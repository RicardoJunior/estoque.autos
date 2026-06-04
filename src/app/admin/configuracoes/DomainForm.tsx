"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  saveDomainAction,
  verifyDomainAction,
  type DomainState,
} from "./actions";
import type { Tenant } from "@/lib/types";

export function DomainForm({
  tenant,
  appHost,
  cfEnabled,
}: {
  tenant: Tenant;
  appHost: string;
  cfEnabled: boolean;
}) {
  const [saveState, save] = useActionState<DomainState, FormData>(
    saveDomainAction,
    {},
  );
  const [verifyState, verify] = useActionState<DomainState, FormData>(
    verifyDomainAction,
    {},
  );

  const domain = tenant.custom_domain;
  const isActive = tenant.custom_domain_status === "active";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Domínio próprio
          {domain &&
            (isActive ? (
              <Badge variant="default">Ativo</Badge>
            ) : (
              <Badge variant="outline">Pendente</Badge>
            ))}
        </CardTitle>
        <CardDescription>
          Use o seu próprio endereço (ex.: www.minhaloja.com.br) no lugar do
          link padrão do estoque.autos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {saveState.ok && (
          <div className="rounded-lg bg-primary/10 px-3.5 py-2.5 text-sm text-primary">
            ✓ Domínio salvo. Configure o apontamento abaixo.
          </div>
        )}
        {saveState.error && (
          <div className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            {saveState.error}
          </div>
        )}

        <form action={save} className="space-y-2">
          <Label htmlFor="domain">Seu domínio</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="domain"
              name="domain"
              defaultValue={domain ?? ""}
              placeholder="www.minhaloja.com.br"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <SaveButton />
          </div>
          {saveState.fieldError && (
            <p className="text-xs text-destructive">{saveState.fieldError}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Digite sem &quot;https://&quot;. Deixe em branco e salve para
            remover o domínio.
          </p>
        </form>

        {domain && (
          <DnsInstructions
            domain={domain}
            appHost={appHost}
            cfEnabled={cfEnabled}
          />
        )}

        {domain && (
          <div className="space-y-3 border-t pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Status do apontamento</p>
                <p className="text-xs text-muted-foreground">
                  {isActive
                    ? "Domínio ativo e servindo a sua vitrine."
                    : "Aguardando o apontamento de DNS ser detectado."}
                </p>
              </div>
              <form action={verify}>
                <VerifyButton />
              </form>
            </div>
            {verifyState.verify && (
              <div
                className={
                  verifyState.verify.active
                    ? "rounded-lg bg-primary/10 px-3.5 py-2.5 text-sm text-primary"
                    : "rounded-lg bg-muted px-3.5 py-2.5 text-sm text-muted-foreground"
                }
              >
                {verifyState.verify.message}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DnsInstructions({
  domain,
  appHost,
  cfEnabled,
}: {
  domain: string;
  appHost: string;
  cfEnabled: boolean;
}) {
  // www.minhaloja.com.br → host "www", apex "minhaloja.com.br"
  const labels = domain.split(".");
  const isApex = labels.length <= 2;
  const recordName = isApex ? "@" : labels[0];

  return (
    <div className="space-y-4 rounded-lg border bg-muted/40 p-4">
      <div>
        <p className="text-sm font-medium">Como apontar o seu domínio</p>
        <p className="text-xs text-muted-foreground">
          No painel do seu provedor de domínio (Registro.br, GoDaddy, Cloudflare
          etc.), crie o registro abaixo.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[80px_1fr]">
        <CopyField label="Tipo" value="CNAME" />
        <CopyField label="Nome / Host" value={recordName} />
        <CopyField label="Valor / Aponta para" value={appHost} full />
      </div>

      {isApex && (
        <div className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <strong>Atenção:</strong> você informou o domínio raiz (sem
          &quot;www&quot;). A maioria dos provedores não aceita CNAME na raiz.
          Prefira usar <strong>www.{domain}</strong>, ou use um registro
          <strong> ALIAS/ANAME</strong> apontando para{" "}
          <span className="font-mono">{appHost}</span> se o seu provedor
          oferecer.
        </div>
      )}

      {cfEnabled ? (
        <p className="text-xs text-muted-foreground">
          O certificado HTTPS é emitido automaticamente assim que o apontamento
          for detectado. Pode levar alguns minutos.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Após criar o registro, clique em &quot;Verificar apontamento&quot;. A
          propagação de DNS pode levar de minutos a algumas horas.
        </p>
      )}
    </div>
  );
}

function CopyField({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard indisponível — o usuário pode selecionar manualmente
    }
  }

  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <p className="mb-1 text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <button
        type="button"
        onClick={copy}
        className="flex w-full items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-left font-mono text-sm transition-colors hover:bg-muted"
        title="Copiar"
      >
        <span className="truncate">{value}</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {copied ? "Copiado!" : "Copiar"}
        </span>
      </button>
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="shrink-0">
      {pending ? "Salvando…" : "Salvar"}
    </Button>
  );
}

function VerifyButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? "Verificando…" : "Verificar apontamento"}
    </Button>
  );
}
