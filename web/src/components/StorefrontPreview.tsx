"use client";

import Image from "next/image";
import type { TemplateId } from "@/lib/types";
import { readableText, withAlpha, mix } from "@/lib/colors";

interface Props {
  template: TemplateId;
  name: string;
  primary: string;
  accent: string;
  logoUrl?: string | null;
}

const SAMPLE = [
  { model: "Civic EXL", year: "2022", price: "R$ 132.900" },
  { model: "Corolla XEi", year: "2021", price: "R$ 124.500" },
  { model: "HR-V Touring", year: "2023", price: "R$ 158.000" },
  { model: "Compass Limited", year: "2022", price: "R$ 149.900" },
];

/**
 * Prévia compacta e fiel da vitrine. Varia o layout por template para
 * dar a sensação real de diferença entre os 6 estilos.
 */
export function StorefrontPreview({
  template,
  name,
  primary,
  accent,
  logoUrl,
}: Props) {
  const dark = template === "premium" || template === "esportivo";
  const onPrimary = readableText(primary);
  const onAccent = readableText(accent);
  const pageBg = dark ? "#0b1120" : "#ffffff";
  const cardBg = dark ? "#131c2e" : "#ffffff";
  const ink = dark ? "#e2e8f0" : "#0f172a";
  const inkSoft = dark ? "#94a3b8" : "#64748b";
  const border = dark ? "#1e293b" : "#e5e7eb";

  const Logo = (
    <div className="flex items-center gap-2">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          width={28}
          height={28}
          unoptimized
          className="h-7 w-7 rounded object-contain"
        />
      ) : (
        <span
          className="flex h-7 w-7 items-center justify-center rounded text-xs font-bold"
          style={{ background: primary, color: onPrimary }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="text-sm font-bold" style={{ color: template === "moderno" ? onPrimary : ink }}>
        {name}
      </span>
    </div>
  );

  const card = (c: (typeof SAMPLE)[number], i: number) => (
    <div
      key={i}
      className="overflow-hidden rounded-lg border"
      style={{ background: cardBg, borderColor: border }}
    >
      <div
        className="flex h-16 items-center justify-center text-[10px]"
        style={{ background: mix(primary, dark ? "#000" : "#fff", dark ? 0.7 : 0.88), color: inkSoft }}
      >
        foto
      </div>
      <div className="p-2">
        <div className="text-[11px] font-semibold" style={{ color: ink }}>
          {c.model}
        </div>
        <div className="text-[9px]" style={{ color: inkSoft }}>
          {c.year} · 32.000 km
        </div>
        <div className="mt-1 text-[11px] font-bold" style={{ color: primary }}>
          {c.price}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="aspect-[4/5] w-full overflow-hidden rounded-[calc(var(--radius)+0.4rem)] border border-[var(--color-border)] shadow-sm"
      style={{ background: pageBg }}
    >
      {/* header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: template === "moderno" ? primary : dark ? "#0b1120" : "#fff",
          borderBottom: `1px solid ${border}`,
        }}
      >
        {Logo}
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
          style={{ background: accent, color: onAccent }}
        >
          Contato
        </span>
      </div>

      {/* hero — varia por template */}
      {template === "classico" && (
        <div className="px-4 py-3" style={{ color: ink }}>
          <div className="text-sm font-bold">Nosso estoque</div>
          <div className="text-[10px]" style={{ color: inkSoft }}>
            Encontre seu próximo carro
          </div>
        </div>
      )}
      {template === "moderno" && (
        <div
          className="px-4 py-5"
          style={{ background: withAlpha(primary, 0.08) }}
        >
          <div className="text-base font-extrabold" style={{ color: ink }}>
            Seu próximo carro está aqui
          </div>
          <div
            className="mt-2 inline-block rounded-md px-3 py-1.5 text-[10px] font-semibold"
            style={{ background: accent, color: onAccent }}
          >
            Buscar veículos
          </div>
        </div>
      )}
      {template === "premium" && (
        <div className="px-4 py-6 text-center">
          <div
            className="text-base font-bold tracking-wide"
            style={{ color: primary }}
          >
            COLEÇÃO EXCLUSIVA
          </div>
          <div className="text-[10px]" style={{ color: inkSoft }}>
            Veículos selecionados
          </div>
        </div>
      )}
      {template === "esportivo" && (
        <div
          className="px-4 py-5"
          style={{
            background: `linear-gradient(120deg, ${primary}, ${withAlpha(accent, 0.4)})`,
          }}
        >
          <div className="text-base font-black italic" style={{ color: onPrimary }}>
            POTÊNCIA NA GARAGEM
          </div>
        </div>
      )}
      {template === "minimal" && (
        <div className="px-4 py-6">
          <div className="text-lg font-light tracking-tight" style={{ color: ink }}>
            Estoque
          </div>
          <div className="h-0.5 w-8" style={{ background: accent }} />
        </div>
      )}
      {template === "vitrine" && (
        <div
          className="flex h-20 items-end px-4 py-3"
          style={{ background: mix(primary, "#000", 0.2) }}
        >
          <div className="text-sm font-bold" style={{ color: "#fff" }}>
            Destaque da semana
          </div>
        </div>
      )}

      {/* grid de cards */}
      <div
        className={`grid gap-2 px-4 pb-4 ${
          template === "vitrine" ? "grid-cols-3" : "grid-cols-2"
        } pt-3`}
      >
        {SAMPLE.slice(0, template === "vitrine" ? 3 : 4).map(card)}
      </div>
    </div>
  );
}
