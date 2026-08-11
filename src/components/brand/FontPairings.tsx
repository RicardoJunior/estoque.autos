"use client";

import { useEffect } from "react";
import { FONT_PAIRINGS, type FontPairing } from "@/lib/fonts";
import { specimenHref } from "@/lib/google-fonts";
import { injectFontCss } from "@/lib/font-css";
import { cn } from "@/lib/utils";

/**
 * Combinações de fonte sugeridas — atalho de bom gosto para quem não
 * quer garimpar o catálogo. Cada card renderiza as próprias famílias.
 */
export function FontPairings({
  head,
  body,
  onSelect,
}: {
  head: string;
  body: string;
  onSelect: (pairing: FontPairing) => void;
}) {
  useEffect(() => {
    for (const p of FONT_PAIRINGS) {
      injectFontCss(specimenHref(p.head));
      injectFontCss(specimenHref(p.body));
    }
  }, []);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {FONT_PAIRINGS.map((p) => {
        const active = head === p.head && body === p.body;
        return (
          <button
            key={p.label}
            type="button"
            onClick={() => onSelect(p)}
            aria-pressed={active}
            className={cn(
              "cursor-pointer rounded-lg border p-2.5 text-left transition",
              active
                ? "border-primary bg-primary/5 ring-2 ring-primary"
                : "border-border hover:border-primary/40 hover:bg-muted/50",
            )}
          >
            <div
              className="truncate text-[15px] leading-tight text-foreground"
              style={{ fontFamily: `"${p.head}"` }}
            >
              {p.head}
            </div>
            <div
              className="mt-0.5 truncate text-xs text-muted-foreground"
              style={{ fontFamily: `"${p.body}"` }}
            >
              {p.body}
            </div>
            <div className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
              {p.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
