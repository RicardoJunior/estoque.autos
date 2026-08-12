"use client";

import { useState } from "react";
import { ChartColumn } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { RevenuePoint } from "@/lib/metrics";
import {
  barPath,
  ChartEmpty,
  ChartTooltip,
  CHROME,
  labelWidth,
  moneyCompact,
  moneyFull,
  monthFull,
  monthShort,
  niceTicks,
  SERIES,
  SrTable,
  useMeasure,
} from "./core";

const H = 200; // altura do SVG (plot + banda do eixo x)
const M = { top: 22, right: 4, bottom: 20 };

/** Colunas mensais de faturamento (12 meses) — série única no slot 1. */
export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const { ref, width } = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const total = data.reduce((s, p) => s + p.total, 0);
  const count = data.reduce((s, p) => s + p.count, 0);

  return (
    <Card className="gap-3 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold">Faturamento</div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Vendas por mês · últimos 12 meses
          </p>
        </div>
        {count > 0 && (
          <div className="text-right">
            <div className="text-xl font-bold">{moneyCompact(total)}</div>
            <div className="text-xs text-muted-foreground">
              {count} {count === 1 ? "venda" : "vendas"}
            </div>
          </div>
        )}
      </div>

      {count === 0 ? (
        <ChartEmpty
          icon={<ChartColumn className="size-8 text-muted-foreground" aria-hidden />}
        >
          Nenhuma venda nos últimos 12 meses. Marque um carro como vendido e o
          faturamento aparece aqui.
        </ChartEmpty>
      ) : (
        <div
          ref={ref}
          // altura fixa: sem salto de layout enquanto o ResizeObserver mede
          style={{ height: H }}
          className="relative rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          tabIndex={0}
          role="application"
          aria-label="Gráfico de faturamento mensal. Use as setas para percorrer os meses."
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              setHover((h) => Math.min((h ?? -1) + 1, data.length - 1));
            } else if (e.key === "ArrowLeft") {
              setHover((h) => Math.max((h ?? data.length) - 1, 0));
            } else if (e.key === "Escape") {
              setHover(null);
            }
          }}
          onPointerLeave={() => setHover(null)}
          onBlur={() => setHover(null)}
        >
          {width > 0 && (
            <Plot data={data} width={width} hover={hover} setHover={setHover} />
          )}
          {width > 0 && hover != null && (
            <Tip data={data} width={width} hover={hover} />
          )}
        </div>
      )}

      <SrTable
        caption="Faturamento por mês, últimos 12 meses"
        head={["Mês", "Faturamento", "Vendas"]}
        rows={data.map((p) => [monthFull(p.month), moneyFull(p.total), p.count])}
      />
    </Card>
  );
}

function geometry(data: RevenuePoint[], width: number) {
  const max = Math.max(...data.map((p) => p.total));
  const ticks = niceTicks(max);
  const tickMax = ticks[ticks.length - 1];
  const gutter =
    Math.max(...ticks.map((t) => labelWidth(moneyCompact(t)))) + 6;
  const plotW = Math.max(0, width - gutter - M.right);
  const plotH = H - M.top - M.bottom;
  const band = plotW / data.length;
  const barW = Math.min(24, band * 0.62);
  const y = (v: number) => M.top + plotH - (v / tickMax) * plotH;
  const xCenter = (i: number) => gutter + i * band + band / 2;
  return { ticks, tickMax, gutter, plotW, plotH, band, barW, y, xCenter };
}

function Plot({
  data,
  width,
  hover,
  setHover,
}: {
  data: RevenuePoint[];
  width: number;
  hover: number | null;
  setHover: (i: number | null) => void;
}) {
  const g = geometry(data, width);
  const baselineY = M.top + g.plotH;
  const labelEvery = g.band < 26 ? 2 : 1;
  // rótulo direto seletivo: só o mês atual (o extremo fica p/ tooltip/tabela)
  const lastIdx = data.length - 1;

  return (
    <svg width={width} height={H} className="block">
      {g.ticks.slice(1).map((t) => (
        <g key={t}>
          <line
            x1={g.gutter}
            x2={width - M.right}
            y1={g.y(t)}
            y2={g.y(t)}
            stroke={CHROME.grid}
            strokeWidth={1}
          />
          <text
            x={g.gutter - 6}
            y={g.y(t) + 3}
            textAnchor="end"
            fontSize={10}
            fill={CHROME.muted}
            className="tabular-nums"
          >
            {moneyCompact(t)}
          </text>
        </g>
      ))}
      <line
        x1={g.gutter}
        x2={width - M.right}
        y1={baselineY}
        y2={baselineY}
        stroke={CHROME.baseline}
        strokeWidth={1}
      />

      {data.map((p, i) => {
        const h = (p.total / g.tickMax) * g.plotH;
        const x = g.xCenter(i) - g.barW / 2;
        return (
          <path
            key={p.month}
            d={barPath(x, baselineY - h, g.barW, h)}
            fill={SERIES.amber}
            style={hover === i ? { filter: "brightness(1.18)" } : undefined}
          />
        );
      })}

      {data[lastIdx].total > 0 && (
        <text
          x={Math.min(g.xCenter(lastIdx), width - M.right - 2)}
          y={g.y(data[lastIdx].total) - 6}
          textAnchor={g.xCenter(lastIdx) > width - 40 ? "end" : "middle"}
          fontSize={10.5}
          fontWeight={600}
          fill={CHROME.ink}
          className="tabular-nums"
        >
          {moneyCompact(data[lastIdx].total)}
        </text>
      )}

      {data.map((p, i) => {
        const [, mm] = p.month.split("-");
        const showLabel =
          i % labelEvery === 0 &&
          !(labelEvery > 1 && i === data.length - 1 && (data.length - 1) % labelEvery !== 0);
        return (
          <g key={p.month}>
            {showLabel && (
              <text
                x={g.xCenter(i)}
                y={H - 6}
                textAnchor="middle"
                fontSize={10}
                fill={CHROME.muted}
              >
                {monthShort(p.month, mm === "01" || i === 0)}
              </text>
            )}
            {/* alvo de toque: a banda inteira, não só a coluna */}
            <rect
              x={g.gutter + i * g.band}
              y={M.top}
              width={g.band}
              height={g.plotH}
              fill="transparent"
              onPointerEnter={() => setHover(i)}
              onPointerMove={() => setHover(i)}
            />
          </g>
        );
      })}
    </svg>
  );
}

function Tip({
  data,
  width,
  hover,
}: {
  data: RevenuePoint[];
  width: number;
  hover: number;
}) {
  const g = geometry(data, width);
  const p = data[hover];
  return (
    <ChartTooltip
      x={g.xCenter(hover)}
      y={Math.max(0, g.y(p.total) - 8)}
      width={width}
      title={monthFull(p.month)}
      rows={[
        {
          label: "Faturamento",
          value: moneyFull(p.total),
          swatch: SERIES.amber,
        },
        { label: "Vendas", value: String(p.count) },
      ]}
    />
  );
}
