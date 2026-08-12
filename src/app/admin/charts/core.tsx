"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Primitivas compartilhadas dos gráficos do dashboard (SVG próprio, sem lib).
 * Regras que valem para todos: marcas finas, grade hairline recessiva, texto
 * sempre em tokens de texto (nunca na cor da série), e o tooltip nunca é o
 * único caminho até um valor — cada gráfico tem uma tabela sr-only gêmea.
 */

/** Slots categóricos validados (ver comentário da paleta em globals.css). */
export const SERIES = {
  amber: "var(--chart-1)",
  blue: "var(--chart-2)",
  green: "var(--chart-3)",
} as const;

export const CHROME = {
  grid: "var(--border)", // hairline um passo acima da superfície
  baseline: "var(--input)", // eixo/base levemente mais forte que a grade
  surface: "var(--card)", // cor dos gaps de superfície entre marcas
  ink: "var(--foreground)",
  muted: "var(--muted-foreground)",
} as const;

/** Largura real do contêiner via ResizeObserver — SVG desenhado em px exatos. */
export function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0]?.contentRect.width ?? 0);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

// ------------------------------------------------------------
// Rótulos de período (chaves vêm prontas do servidor: "2026-08"/"2026-08-11")
// ------------------------------------------------------------

const MONTHS_SHORT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];
const MONTHS_FULL = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function monthShort(key: string, withYear = false): string {
  const [y, m] = key.split("-");
  const name = MONTHS_SHORT[Number(m) - 1] ?? key;
  return withYear ? `${name}/${y.slice(2)}` : name;
}

export function monthFull(key: string): string {
  const [y, m] = key.split("-");
  return `${MONTHS_FULL[Number(m) - 1] ?? key} de ${y}`;
}

export function dayShort(key: string): string {
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
}

export function dayFull(key: string): string {
  const [y, m, d] = key.split("-");
  return `${Number(d)} de ${MONTHS_FULL[Number(m) - 1] ?? m} de ${y}`;
}

// ------------------------------------------------------------
// Números
// ------------------------------------------------------------

const compactBRL = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 1,
});

/** "R$ 42 mil" · "R$ 1,2 mi" */
export function moneyCompact(value: number): string {
  return compactBRL.format(value);
}

const fullBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function moneyFull(value: number): string {
  return fullBRL.format(value);
}

export function signedPct(ratio: number): string {
  const pct = ratio * 100;
  const s = pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  return pct > 0 ? `+${s}%` : `${s}%`;
}

function tickStep(span: number, target: number, integer = false): number {
  const rough = span / target;
  const pow = 10 ** Math.floor(Math.log10(rough));
  // escala de contagem: sem passo 2,5 (filtrar ticks fracionários DEPOIS
  // quebraria a garantia de cobertura — ex.: max 7 → [0, 2.5, 5, 7.5])
  const multipliers = integer ? [1, 2, 5, 10] : [1, 2, 2.5, 5, 10];
  const step = multipliers.map((m) => m * pow).find((s) => s >= rough)!;
  return integer ? Math.max(1, step) : step;
}

/** Do primeiro tick até o PRIMEIRO ≥ max — o domínio sempre cobre os dados. */
function ticksFrom(start: number, step: number, max: number): number[] {
  const ticks: number[] = [];
  for (let i = 0; ; i++) {
    const v = start + i * step;
    ticks.push(v);
    if (v >= max - 1e-9) return ticks;
  }
}

/** Ticks redondos de 0 até ≥ max. `integer` restringe a passos inteiros
 *  (eixos de contagem). */
export function niceTicks(max: number, target = 3, integer = false): number[] {
  if (max <= 0) return [0, 1];
  return ticksFrom(0, tickStep(max, target, integer), max);
}

/** Ticks redondos cobrindo [min, max] — para linhas que não partem do zero. */
export function niceRangeTicks(min: number, max: number, target = 3): number[] {
  if (min === max) {
    const pad = Math.max(1, Math.abs(max) * 0.05);
    min -= pad;
    max += pad;
  }
  const step = tickStep(max - min, target);
  return ticksFrom(Math.floor(min / step) * step, step, max);
}

/** Estimativa de largura de rótulo (px) p/ dimensionar a calha do eixo. */
export function labelWidth(text: string, fontSize = 10): number {
  return text.length * fontSize * 0.62 + 4;
}

/** Coluna com topo arredondado (4px) e base reta — a marca padrão de barra. */
export function barPath(
  x: number,
  yTop: number,
  w: number,
  h: number,
  r = 4,
): string {
  if (h <= 0 || w <= 0) return "";
  const radius = Math.min(r, w / 2, h);
  const yBottom = yTop + h;
  return [
    `M${x},${yBottom}`,
    `L${x},${yTop + radius}`,
    `Q${x},${yTop} ${x + radius},${yTop}`,
    `L${x + w - radius},${yTop}`,
    `Q${x + w},${yTop} ${x + w},${yTop + radius}`,
    `L${x + w},${yBottom}`,
    "Z",
  ].join(" ");
}

// ------------------------------------------------------------
// Peças de DOM
// ------------------------------------------------------------

export type TooltipRow = {
  label: string;
  value: string;
  swatch?: string;
  kind?: "line" | "rect";
};

/** Tooltip único por gráfico: lista TODAS as séries no X apontado. */
export function ChartTooltip({
  x,
  y,
  width,
  title,
  rows,
  footer,
}: {
  x: number;
  y: number;
  width: number;
  title: string;
  rows: TooltipRow[];
  footer?: string;
}) {
  const flip = x > width * 0.55;
  return (
    <div
      className="pointer-events-none absolute z-10 min-w-36 rounded-lg bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg ring-1 ring-foreground/10"
      style={{
        top: Math.max(0, y),
        ...(flip ? { right: width - x + 10 } : { left: x + 10 }),
      }}
    >
      <div className="font-medium text-muted-foreground">{title}</div>
      <div className="mt-1.5 space-y-1">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {r.swatch &&
                (r.kind === "line" ? (
                  <span
                    aria-hidden
                    className="h-0.5 w-3 rounded-full"
                    style={{ background: r.swatch }}
                  />
                ) : (
                  <span
                    aria-hidden
                    className="size-2.5 rounded-[3px]"
                    style={{ background: r.swatch }}
                  />
                ))}
              {r.label}
            </span>
            <span className="font-semibold text-foreground tabular-nums">
              {r.value}
            </span>
          </div>
        ))}
      </div>
      {footer && (
        <div className="mt-1.5 border-t border-border pt-1.5 text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  );
}

/** Legenda: obrigatória com 2+ séries; o marcador espelha a marca. */
export function ChartLegend({
  items,
}: {
  items: { label: string; color: string; kind?: "line" | "rect" }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          {i.kind === "line" ? (
            <span
              aria-hidden
              className="h-0.5 w-4 rounded-full"
              style={{ background: i.color }}
            />
          ) : (
            <span
              aria-hidden
              className="size-2.5 rounded-[3px]"
              style={{ background: i.color }}
            />
          )}
          {i.label}
        </span>
      ))}
    </div>
  );
}

/** Tabela gêmea acessível — todo valor do gráfico existe fora do tooltip. */
export function SrTable({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: string[];
  rows: (string | number)[][];
}) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h} scope="col">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Estado vazio compacto, no padrão dos cards do admin. */
export function ChartEmpty({
  icon,
  height = 190,
  children,
}: {
  icon: React.ReactNode;
  height?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 text-center"
      style={{ height }}
    >
      {icon}
      <p className="max-w-sm text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
