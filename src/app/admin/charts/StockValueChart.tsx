"use client";

import { useState } from "react";
import { ChartLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { StockValuePoint } from "@/lib/metrics";
import {
  ChartEmpty,
  ChartLegend,
  ChartTooltip,
  CHROME,
  labelWidth,
  moneyCompact,
  moneyFull,
  monthFull,
  monthShort,
  niceRangeTicks,
  SERIES,
  signedPct,
  SrTable,
  useMeasure,
} from "./core";

const H = 240;
const M = { top: 14, bottom: 20 };

const LINES = [
  { key: "listed", label: "Anúncios", color: SERIES.amber },
  { key: "fipe", label: "Tabela FIPE", color: SERIES.blue },
] as const;

/**
 * Valor consolidado do estoque, mês a mês, pelos preços anunciados e pela
 * FIPE vigente — apenas veículos com FIPE vinculada entram nas DUAS somas,
 * então o vão entre as linhas é ágio/deságio real.
 */
export function StockValueChart({
  data,
  coverage,
}: {
  data: StockValuePoint[];
  coverage: { covered: number; total: number };
}) {
  const { ref, width } = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const withValue = data.filter((p) => p.listed != null);
  const last = withValue[withValue.length - 1];
  const first = withValue[0];

  const notes: string[] = [];
  if (last?.listed != null && last.fipe) {
    const agio = (last.listed - last.fipe) / last.fipe;
    notes.push(
      agio >= 0
        ? `anúncios ${signedPct(agio)} sobre a FIPE`
        : `anúncios ${signedPct(agio)} vs. FIPE`,
    );
  }
  if (coverage.total > 0 && coverage.covered < coverage.total) {
    notes.push(
      `FIPE vinculada em ${coverage.covered} de ${coverage.total} veículos — os demais ficam fora do gráfico`,
    );
  }

  return (
    <Card className="gap-3 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold">Valorização do estoque</div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Preço atual dos anúncios vs. FIPE vigente em cada mês
            {notes.length > 0 && <> · {notes.join(" · ")}</>}
          </p>
        </div>
        {last?.listed != null && (
          <div className="text-right">
            <div className="text-xl font-bold">{moneyCompact(last.listed)}</div>
            {first !== last && first.listed ? (
              <div className="text-xs text-muted-foreground">
                {signedPct((last.listed - first.listed) / first.listed)} desde{" "}
                {monthShort(first.month, true)}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">em anúncios</div>
            )}
          </div>
        )}
      </div>

      {withValue.length < 2 ? (
        <ChartEmpty
          icon={<ChartLine className="size-8 text-muted-foreground" aria-hidden />}
          height={H}
        >
          O histórico aparece a partir do segundo mês com estoque. Vincule a
          FIPE aos seus veículos para acompanhar a valorização.
        </ChartEmpty>
      ) : (
        <>
          <div
            ref={ref}
            style={{ height: H }}
            className="relative rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            tabIndex={0}
            role="application"
            aria-label="Gráfico de valorização do estoque. Use as setas para percorrer os meses."
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
          <ChartLegend
            items={LINES.map((l) => ({
              label: l.label,
              color: l.color,
              kind: "line" as const,
            }))}
          />
        </>
      )}

      <SrTable
        caption="Valor do estoque por mês: preços anunciados e tabela FIPE"
        head={["Mês", "Anúncios", "Tabela FIPE", "Veículos"]}
        rows={data.map((p) => [
          monthFull(p.month),
          p.listed != null ? moneyFull(p.listed) : "sem dados",
          p.fipe != null ? moneyFull(p.fipe) : "sem dados",
          p.vehicles,
        ])}
      />
    </Card>
  );
}

function geometry(data: StockValuePoint[], width: number) {
  const values = data
    .flatMap((p) => [p.listed, p.fipe])
    .filter((v): v is number => v != null);
  const ticks = niceRangeTicks(Math.min(...values), Math.max(...values));
  const lo = ticks[0];
  const hi = ticks[ticks.length - 1];

  const gutter =
    Math.max(...ticks.map((t) => labelWidth(moneyCompact(t)))) + 6;
  // margem direita reservada aos rótulos de ponta das duas linhas
  const endLabels = LINES.map((l) => {
    const lastVal = [...data].reverse().find((p) => p[l.key] != null)?.[l.key];
    return lastVal != null ? labelWidth(moneyCompact(lastVal), 10.5) : 0;
  });
  const right = Math.max(...endLabels) + 12;

  const plotW = Math.max(0, width - gutter - right);
  const plotH = H - M.top - M.bottom;
  const x = (i: number) =>
    gutter + (data.length === 1 ? 0 : (i / (data.length - 1)) * plotW);
  const y = (v: number) => M.top + plotH - ((v - lo) / (hi - lo)) * plotH;
  return { ticks, gutter, right, plotW, plotH, x, y };
}

/** Segmentos contíguos não nulos de uma série (lacuna quebra a linha). */
function runs(data: StockValuePoint[], key: "listed" | "fipe") {
  const out: { i: number; v: number }[][] = [];
  let cur: { i: number; v: number }[] = [];
  data.forEach((p, i) => {
    const v = p[key];
    if (v == null) {
      if (cur.length) out.push(cur);
      cur = [];
    } else {
      cur.push({ i, v });
    }
  });
  if (cur.length) out.push(cur);
  return out;
}

function Plot({
  data,
  width,
  hover,
  setHover,
}: {
  data: StockValuePoint[];
  width: number;
  hover: number | null;
  setHover: (i: number | null) => void;
}) {
  const g = geometry(data, width);
  const baselineY = M.top + g.plotH;

  // rótulos de ponta: empurra um para longe do outro se colidirem
  const ends = LINES.map((l) => {
    for (let i = data.length - 1; i >= 0; i--) {
      const v = data[i][l.key];
      if (v != null) return { ...l, i, v, y: g.y(v) };
    }
    return null;
  }).filter((e): e is NonNullable<typeof e> => e != null);
  if (ends.length === 2 && Math.abs(ends[0].y - ends[1].y) < 14) {
    const mid = (ends[0].y + ends[1].y) / 2;
    const [a, b] = ends[0].y <= ends[1].y ? [ends[0], ends[1]] : [ends[1], ends[0]];
    a.y = mid - 7;
    b.y = mid + 7;
  }

  const labelEvery = data.length > 1 && g.plotW / (data.length - 1) < 30 ? 2 : 1;

  return (
    <svg width={width} height={H} className="block">
      {g.ticks.map((t) => (
        <g key={t}>
          <line
            x1={g.gutter}
            x2={g.gutter + g.plotW}
            y1={g.y(t)}
            y2={g.y(t)}
            stroke={t === g.ticks[0] ? CHROME.baseline : CHROME.grid}
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

      {hover != null && (
        <line
          x1={g.x(hover)}
          x2={g.x(hover)}
          y1={M.top}
          y2={baselineY}
          stroke={CHROME.baseline}
          strokeWidth={1}
        />
      )}

      {LINES.map((l) => (
        <g key={l.key}>
          {runs(data, l.key).map((run, ri) =>
            run.length === 1 ? (
              // ponto isolado (mês cercado de lacunas): marcador cheio com
              // anel de superfície — as duas séries podem cair no mesmo y
              <circle
                key={ri}
                cx={g.x(run[0].i)}
                cy={g.y(run[0].v)}
                r={4}
                fill={l.color}
                stroke={CHROME.surface}
                strokeWidth={2}
              />
            ) : (
              <path
                key={ri}
                d={run
                  .map(
                    (pt, j) =>
                      `${j === 0 ? "M" : "L"}${g.x(pt.i)},${g.y(pt.v)}`,
                  )
                  .join(" ")}
                fill="none"
                stroke={l.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ),
          )}
        </g>
      ))}

      {/* marcadores: ponta de cada linha + ponto sob o cursor */}
      {ends.map((e) => (
        <circle
          key={e.key}
          cx={g.x(e.i)}
          cy={g.y(e.v)}
          r={4}
          fill={e.color}
          stroke={CHROME.surface}
          strokeWidth={2}
        />
      ))}
      {hover != null &&
        LINES.map((l) => {
          const v = data[hover][l.key];
          return v != null ? (
            <circle
              key={l.key}
              cx={g.x(hover)}
              cy={g.y(v)}
              r={4}
              fill={l.color}
              stroke={CHROME.surface}
              strokeWidth={2}
            />
          ) : null;
        })}

      {ends.map((e) => (
        <text
          key={e.key}
          x={g.gutter + g.plotW + 8}
          y={e.y + 3.5}
          fontSize={10.5}
          fontWeight={600}
          fill={CHROME.ink}
          className="tabular-nums"
        >
          {moneyCompact(e.v)}
        </text>
      ))}

      {data.map(
        (p, i) =>
          i % labelEvery === 0 && (
            <text
              key={p.month}
              x={g.x(i)}
              y={H - 6}
              textAnchor="middle"
              fontSize={10}
              fill={CHROME.muted}
            >
              {monthShort(p.month, p.month.endsWith("-01") || i === 0)}
            </text>
          ),
      )}

      {/* overlay: o crosshair encontra o mês mais próximo do ponteiro */}
      <rect
        x={g.gutter}
        y={M.top}
        width={g.plotW + g.right}
        height={g.plotH}
        fill="transparent"
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = e.clientX - rect.left;
          const step = g.plotW / (data.length - 1);
          if (!(step > 0)) return; // contêiner estreito demais: plotW 0 → NaN
          setHover(
            Math.max(0, Math.min(data.length - 1, Math.round(px / step))),
          );
        }}
      />
    </svg>
  );
}

function Tip({
  data,
  width,
  hover,
}: {
  data: StockValuePoint[];
  width: number;
  hover: number;
}) {
  const g = geometry(data, width);
  const p = data[hover];
  const ys = [p.listed, p.fipe]
    .filter((v): v is number => v != null)
    .map((v) => g.y(v));
  // 0 e null são estados diferentes: estoque zerado vs. lacuna de cobertura
  const footer =
    p.listed == null || p.fipe == null
      ? "sem FIPE resolvível neste mês"
      : p.stocked === 0
        ? "estoque zerado neste mês"
        : p.fipe > 0
          ? `${p.vehicles} ${p.vehicles === 1 ? "veículo" : "veículos"} · ${signedPct((p.listed - p.fipe) / p.fipe)} vs. FIPE`
          : undefined;
  return (
    <ChartTooltip
      x={g.x(hover)}
      y={Math.max(0, Math.min(...(ys.length ? ys : [M.top])) - 8)}
      width={width}
      title={monthFull(p.month)}
      rows={LINES.map((l) => ({
        label: l.label,
        value: p[l.key] != null ? moneyFull(p[l.key]!) : "—",
        swatch: l.color,
        kind: "line" as const,
      }))}
      footer={footer}
    />
  );
}
