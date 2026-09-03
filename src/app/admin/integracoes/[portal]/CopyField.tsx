"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";

export function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard bloqueado: o campo é selecionável
    }
  }
  return (
    <div className="flex items-center gap-2">
      <InputGroup className="flex-1">
        <InputGroupInput readOnly value={value} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
      </InputGroup>
      <Button type="button" variant="outline" size="sm" onClick={copy}>
        {copied ? <Check data-icon="inline-start" aria-hidden /> : <Copy data-icon="inline-start" aria-hidden />}
        {copied ? "Copiado" : "Copiar"}
      </Button>
    </div>
  );
}
