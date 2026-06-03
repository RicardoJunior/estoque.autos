"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Início", exact: true },
  { href: "/admin/veiculos", label: "Estoque" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/site", label: "Meu site" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export function Sidebar({ storeName, slug }: { storeName: string; slug: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-white">
      <div className="border-b border-[var(--color-border)] px-5 py-4">
        <div className="text-sm font-bold tracking-tight">
          estoque<span className="text-[var(--color-brand)]">.autos</span>
        </div>
        <div className="mt-2 truncate text-sm font-semibold">{storeName}</div>
        <a
          href={`/${slug}`}
          target="_blank"
          rel="noreferrer"
          className="truncate text-xs text-[var(--color-brand)] hover:underline"
        >
          estoque.autos/{slug} ↗
        </a>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-[var(--color-brand)]/10 text-[var(--color-brand-ink)]"
                  : "text-[var(--color-ink)] hover:bg-slate-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
