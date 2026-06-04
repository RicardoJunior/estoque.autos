"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

const NAV = [
  { href: "/admin", label: "Início", exact: true },
  { href: "/admin/veiculos", label: "Estoque" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/site", label: "Meu site" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

function Brand({ storeName, slug }: { storeName: string; slug: string }) {
  return (
    <div className="border-b border-border px-5 py-4">
      <div className="text-sm font-bold tracking-tight">
        estoque<span className="text-primary">.autos</span>
      </div>
      <div className="mt-2 truncate text-sm font-semibold">{storeName}</div>
      <a
        href={`/${slug}`}
        target="_blank"
        rel="noreferrer"
        className="truncate text-xs text-primary hover:underline"
      >
        estoque.autos/{slug} ↗
      </a>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-0.5 p-3">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-primary/10 text-primary"
                : "text-foreground hover:bg-muted"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ storeName, slug }: { storeName: string; slug: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
        <Brand storeName={storeName} slug={slug} />
        <NavLinks />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="fixed left-3 top-3 z-40 md:hidden"
            />
          }
        >
          <Menu />
          <span className="sr-only">Abrir menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Brand storeName={storeName} slug={slug} />
          <NavLinks onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
