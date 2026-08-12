"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { LeadsDayPoint } from "@/lib/metrics";
import { LEAD_TYPE_LABELS } from "@/lib/types";
import {
  barPath,
  ChartEmpty,
  ChartLegend,
  ChartTooltip,
  CHROME,
  dayFull,
  dayShort,
  labelWidth,
  niceTicks,
  SERIES,
  signedPct,
  SrTable,
  useMeasure,
} from "./core";

const H = 200;
const M = { top: 12, right: 4, bottom: 20 };

/** Ordem da pilha (base → topo) = ordem dos slots validados da paleta. */
const STACK = [
  { key: "proposal", color: SERIES.amber },
  { key: "phone", color: SERIES.blue },
  { key: "whatsapp", color: SERIES.green },
] as const;

export function LeadsChart({
  data,
  prev30d,
}: {
  data: LeadsDayPoint[];
  prev30d: number;
}) {
  const { ref, width } = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const total = data.reduce((s, p) => s + dayTotal(p), 0);
  const delta =
    prev30d > 0 ? (
      <span
        style={{
          color:
            total > prev30d
              ? "var(--success)"
              : total < prev30d
                ? "var(--destructive)"
                : undefined,
        }}
      >
        {signedPct((total - prev30d) / prev30d)}
      </span>
    ) : null;

  return (
    <Card className="gap-3 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold">Leads por dia</div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Contatos recebidos · últimos 30 dias
          </p>
        </div>
        {total > 0 && (
          <div className="text-right">
            <div className="text-xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground">
              {delta ? <>{delta} vs. 30 dias anteriores</> : "no período"}
            </div>
          </div>
        )}
      </div>

      {total === 0 ? (
        <ChartEmpty
          icon={
            <MessageCircle className="size-8 text-muted-foreground" aria-hidden />
          }
        >
          Nenhum lead nos últimos 30 dias. Divulgue o link da sua loja para
          começar a receber contatos.
        </ChartEmpty>
      ) : (
        <>
          <div
            ref={ref}
            style={{ height: H }}
            className="relative rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            tabIndex={0}
            role="application"
            aria-label="Gráfico de leads por dia. Use as setas para percorrer os dias."
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
          {/* legenda na ordem visual da pilha (topo primeiro) */}
          <ChartLegend
            items={[...STACK]
              .reverse()
              .map((s) => ({ label: LEAD_TYPE_LABELS[s.key], color: s.color }))}
          />
        </>
      )}

      <SrTable
        caption="Leads por dia e por tipo, últimos 30 dias"
        head={["Dia", ...STACK.map((s) => LEAD_TYPE_LABELS[s.key]), "Total"]}
        rows={data.map((p) => [
          dayFull(p.day),
          ...STACK.map((s) => p[s.key]),
          dayTotal(p),
        ])}
      />
    </Card>
  );
}

function dayTotal(p: LeadsDayPoint): number {
  return p.proposal + p.whatsapp + p.phone;
}

function geometry(data: LeadsDayPoint[], width: number) {
  const max = Math.max(...data.map(dayTotal));
  const ticks = niceTicks(max, 3, true); // eixo de contagem: passos inteiros
  const tickMax = ticks[ticks.length - 1];
  const gutter =
    Math.max(...ticks.map((t) => labelWidth(String(t)))) + 6;
  const plotW = Math.max(0, width - gutter - M.right);
  const plotH = H - M.top - M.bottom;
  const band = plotW / data.length;
  const barW = Math.min(24, Math.max(3, band * 0.62));
  const xCenter = (i: number) => gutter + i * band + band / 2;
  const y = (v: number) => M.top + plotH - (v / tickMax) * plotH;
  return { ticks, tickMax, gutter, plotW, plotH, band, barW, y, xCenter };
}

function Plot({
  data,
  width,
  hover,
  setHover,
}: {
  data: LeadsDayPoint[];
  width: number;
  hover: number | null;
  setHover: (i: number | null) => void;
}) {
  const g = geometry(data, width);
  const baselineY = M.top + g.plotH;

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
            {t}
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
        const x = g.xCenter(i) - g.barW / 2;
        const segments: { color: string; h: number }[] = [];
        for (const s of STACK) {
          const h = (p[s.key] / g.tickMax) * g.plotH;
          if (h > 0) segments.push({ color: s.color, h });
        }
        let cursor = baselineY;
        const rects = segments.map((seg, j) => {
          const isTop = j === segments.length - 1;
          const yTop = cursor - seg.h;
          const el = isTop ? (
            <path
              key={j}
              d={barPath(x, yTop, g.barW, seg.h)}
              fill={seg.color}
            />
          ) : (
            <rect key={j} x={x} y={yTop} width={g.barW} height={seg.h} fill={seg.color} />
          );
          cursor = yTop;
          return el;
        });
        // gaps de superfície (2px) entre segmentos que se tocam
        let boundary = baselineY;
        const gaps = segments.slice(0, -1).map((seg, j) => {
          boundary -= seg.h;
          return (
            <line
              key={j}
              x1={x}
              x2={x + g.barW}
              y1={boundary}
              y2={boundary}
              stroke={CHROME.surface}
              strokeWidth={2}
            />
          );
        });
        return (
          <g key={p.day}>
            {/* o brilho de hover não alcança os separadores cor-de-superfície */}
            <g style={hover === i ? { filter: "brightness(1.18)" } : undefined}>
              {rects}
            </g>
            {gaps}
          </g>
        );
      })}

      {data.map((p, i) => (
        <g key={p.day}>
          {i % 7 === 0 && (
            <text
              x={g.xCenter(i)}
              y={H - 6}
              textAnchor="middle"
              fontSize={10}
              fill={CHROME.muted}
              className="tabular-nums"
            >
              {dayShort(p.day)}
            </text>
          )}
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
      ))}
    </svg>
  );
}

function Tip({
  data,
  width,
  hover,
}: {
  data: LeadsDayPoint[];
  width: number;
  hover: number;
}) {
  const g = geometry(data, width);
  const p = data[hover];
  return (
    <ChartTooltip
      x={g.xCenter(hover)}
      y={Math.max(0, g.y(dayTotal(p)) - 8)}
      width={width}
      title={dayFull(p.day)}
      rows={[...STACK].reverse().map((s) => ({
        label: LEAD_TYPE_LABELS[s.key],
        value: String(p[s.key]),
        swatch: s.color,
      }))}
      footer={`Total: ${dayTotal(p)}`}
    />
  );
}
