"use client";

import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Pipette } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { readableText } from "@/lib/colors";
import { cn } from "@/lib/utils";

/** Paleta de partida — tons comuns em lojas de veículos. */
const PRESETS = [
  "#0f172a", "#1d4ed8", "#2563eb", "#0ea5e9",
  "#0f766e", "#16a34a", "#65a30d", "#f59e0b",
  "#ea580c", "#dc2626", "#b91c1c", "#7c3aed",
  "#db2777", "#334155", "#737373", "#111827",
];

interface EyeDropperResult {
  sRGBHex: string;
}
type EyeDropperCtor = new () => { open(): Promise<EyeDropperResult> };

function normalizeHex(raw: string): string | null {
  let v = raw.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(v)) {
    v = v.split("").map((c) => c + c).join("");
  }
  return /^[0-9a-f]{6}$/.test(v) ? `#${v}` : null;
}

/**
 * Campo de cor do editor de marca: swatch que abre um popover com
 * seletor completo (react-colorful), entrada hex, conta-gotas
 * (quando o navegador suporta) e paleta de sugestões.
 */
export function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [hexInput, setHexInput] = useState(value);
  // o input hex acompanha mudanças vindas de fora (picker, presets) —
  // padrão "adjust state during render", sem effect
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setHexInput(value);
  }

  // o botão só aparece dentro do popover (nunca no HTML do SSR),
  // então detectar o suporte no init não causa mismatch de hidratação
  const [eyeDropper] = useState<EyeDropperCtor | null>(() => {
    if (typeof window === "undefined") return null;
    return (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper ?? null;
  });

  function commitHex(raw: string) {
    const hex = normalizeHex(raw);
    if (hex) onChange(hex);
    else setHexInput(value);
  }

  async function pickFromScreen() {
    if (!eyeDropper) return;
    try {
      const result = await new eyeDropper().open();
      const hex = normalizeHex(result.sRGBHex);
      if (hex) onChange(hex);
    } catch {
      // usuário cancelou o conta-gotas
    }
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>

      <Popover>
        <PopoverTrigger
          className="flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-input bg-input/30 px-2.5 transition hover:border-primary/40"
          aria-label={`${label}: ${value}`}
        >
          <span
            className="size-5 rounded-full ring-1 ring-inset ring-foreground/15"
            style={{ background: value }}
          />
          <span className="font-mono text-xs uppercase text-muted-foreground">
            {value}
          </span>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-64">
          <div className="brand-colorpicker">
            <HexColorPicker color={value} onChange={onChange} />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-8 flex-1 items-center rounded-lg border border-input bg-input/30 px-2">
              <span className="text-xs text-muted-foreground">#</span>
              <input
                value={hexInput.replace(/^#/, "")}
                onChange={(e) => {
                  setHexInput(e.target.value);
                  // ao vivo, só aplica hex COMPLETO (6 dígitos) — expandir
                  // "1d4" aqui travaria a digitação; abreviações valem no
                  // blur/Enter via commitHex
                  const raw = e.target.value.trim().replace(/^#/, "");
                  if (/^[0-9a-fA-F]{6}$/.test(raw)) onChange(`#${raw.toLowerCase()}`);
                }}
                onBlur={(e) => commitHex(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitHex(e.currentTarget.value);
                }}
                maxLength={6}
                spellCheck={false}
                className="w-full bg-transparent pl-1 font-mono text-xs uppercase outline-none"
                aria-label={`Código hexadecimal de ${label}`}
              />
            </div>
            {eyeDropper && (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="border border-input"
                aria-label="Capturar cor da tela"
                title="Capturar cor da tela"
                onClick={pickFromScreen}
              >
                <Pipette />
              </Button>
            )}
            <span
              className="flex h-8 w-9 items-center justify-center rounded-lg text-xs font-semibold"
              style={{ background: value, color: readableText(value) }}
              title="Como o texto fica sobre esta cor"
            >
              Aa
            </span>
          </div>

          <div className="grid grid-cols-8 gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onChange(preset)}
                aria-label={`Usar ${preset}`}
                className={cn(
                  "aspect-square cursor-pointer rounded-md ring-1 ring-inset ring-foreground/15 transition hover:scale-110",
                  value.toLowerCase() === preset &&
                    "ring-2 ring-primary ring-offset-1 ring-offset-popover",
                )}
                style={{ background: preset }}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
