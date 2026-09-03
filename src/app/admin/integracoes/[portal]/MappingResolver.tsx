"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import type { MappingPending } from "@/lib/integrations/types";
import type { PortalId } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { resolveMappingAction, searchTaxonomyAction, type TaxonomyOption } from "../actions";

const KIND_LABEL: Record<string, string> = {
  brand: "marca",
  model: "modelo",
  version: "versão",
  color: "cor",
};

/** Uma pendência: busca no catálogo do portal e grava a escolha. */
export function MappingResolver({
  portal,
  vehicleId,
  vehicleLabel,
  pending,
}: {
  portal: PortalId;
  vehicleId: string;
  vehicleLabel: string;
  pending: MappingPending;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(pending.name);
  const [options, setOptions] = useState<TaxonomyOption[]>(
    (pending.candidates ?? []).map((c) => ({ external_id: c.external_id, name: c.name, score: c.score })),
  );
  const [searching, startSearch] = useTransition();
  const [saving, startSave] = useTransition();

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const t = setTimeout(() => {
      startSearch(async () => {
        setOptions(await searchTaxonomyAction(portal, pending.kind, q, pending.parent));
      });
    }, 300);
    return () => clearTimeout(t);
  }, [query, portal, pending.kind, pending.parent]);

  function choose(opt: TaxonomyOption) {
    startSave(async () => {
      const res = await resolveMappingAction({
        portal,
        kind: pending.kind,
        localKey: pending.localKey,
        externalId: opt.external_id,
        vehicleId,
      });
      if (res.error) toast.error(res.error);
      else {
        toast.success(`"${pending.name}" → ${opt.name}. Reenviando…`);
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-sm">
        <span className="font-medium">{vehicleLabel}</span>
        <span className="text-muted-foreground">
          {" "}
          — {KIND_LABEL[pending.kind] ?? pending.kind} <strong>“{pending.name}”</strong> não encontrada no catálogo.
        </span>
      </p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
        <InputGroup className="sm:w-72">
          <InputGroupAddon>
            {searching ? <Loader2Icon className="animate-spin" aria-hidden /> : <SearchIcon aria-hidden />}
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar ${KIND_LABEL[pending.kind] ?? "valor"} no portal…`}
            aria-label="Buscar no catálogo do portal"
          />
        </InputGroup>
        <div className="flex flex-wrap gap-1.5">
          {options.length === 0 && !searching && (
            <span className="text-xs text-muted-foreground">Nenhum resultado. Refine a busca.</span>
          )}
          {options.map((o) => (
            <Button
              key={o.external_id}
              type="button"
              size="sm"
              variant="outline"
              disabled={saving}
              onClick={() => choose(o)}
              title={`id ${o.external_id}`}
            >
              {o.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
