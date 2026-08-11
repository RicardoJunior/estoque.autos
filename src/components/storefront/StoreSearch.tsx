"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Busca + ordenação que atualiza a URL (SSR re-filtra no servidor). */
export function StoreSearch({ tone = "light" }: { tone?: "light" | "dark" }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const dark = tone === "dark";

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  useEffect(() => {
    const current = params.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => update("q", q), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // cores via tokens do tema (placeholder/focus exigem classe, não style
  // inline) — fallbacks reproduzem o visual atual de cada tom
  const inputCls = dark
    ? "w-full rounded-lg border border-[color:var(--sf-border,rgba(255,255,255,0.15))] bg-[color:var(--sf-surface,rgba(255,255,255,0.1))] px-4 py-2.5 text-sm text-[color:var(--sf-ink,#ffffff)] placeholder:text-[color:var(--sf-ink-faint,rgba(255,255,255,0.5))] outline-none focus:border-[color:var(--sf-ink-faint,rgba(255,255,255,0.4))]"
    : "w-full rounded-lg border border-[color:var(--sf-border,#cbd5e1)] bg-[color:var(--sf-surface,#ffffff)] px-4 py-2.5 text-sm outline-none focus:border-[color:var(--sf-ink,#0f172a)]";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        className={`${inputCls} max-w-sm flex-1`}
        placeholder="Buscar marca ou modelo…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <select
        className={`${inputCls} w-auto`}
        value={params.get("sort") ?? "recent"}
        onChange={(e) => update("sort", e.target.value)}
      >
        <option value="recent">Mais recentes</option>
        <option value="price_asc">Menor preço</option>
        <option value="price_desc">Maior preço</option>
        <option value="km_asc">Menor km</option>
      </select>
    </div>
  );
}
