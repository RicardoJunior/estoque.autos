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

  const inputCls = dark
    ? "w-full rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/50 outline-none focus:border-white/40"
    : "w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-900";

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
