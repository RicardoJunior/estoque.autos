"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Check,
  ChevronsUpDown,
  Home,
  Car,
  Globe,
  MessageSquareText,
  Menu,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { TEAM_ROLE_LABELS, type TeamRole } from "@/lib/types";
import { setActiveTenantAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

/** Loja do usuário no seletor (subset serializável de TenantMembership). */
export interface SidebarStore {
  id: string;
  name: string;
  role: TeamRole;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  /** visível só para owner/admin (vendedor não vê) */
  staffOnly?: boolean;
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Início", icon: Home, exact: true },
  // vendedor VÊ o estoque (read-only; RLS permite leitura por membro)
  { href: "/admin/veiculos", label: "Estoque", icon: Car },
  { href: "/admin/leads", label: "Leads", icon: MessageSquareText },
  { href: "/admin/site", label: "Meu site", icon: Globe, staffOnly: true },
  { href: "/admin/equipe", label: "Equipe", icon: Users, staffOnly: true },
  {
    href: "/admin/configuracoes",
    label: "Configurações",
    icon: Settings,
    staffOnly: true,
  },
];

interface SidebarProps {
  storeName: string;
  slug: string;
  role: TeamRole;
  activeStoreId: string;
  stores: SidebarStore[];
}

function StoreSwitcher({
  storeName,
  activeStoreId,
  stores,
}: Pick<SidebarProps, "storeName" | "activeStoreId" | "stores">) {
  const [, startTransition] = useTransition();

  if (stores.length <= 1) {
    return <div className="mt-2 truncate text-sm font-semibold">{storeName}</div>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="mt-2 flex w-full items-center justify-between gap-2 rounded-lg border border-border px-2.5 py-1.5 text-left text-sm font-semibold transition hover:bg-muted">
        <span className="truncate">{storeName}</span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Minhas lojas</DropdownMenuLabel>
        {stores.map((store) => (
          <DropdownMenuItem
            key={store.id}
            onClick={() => {
              if (store.id === activeStoreId) return;
              startTransition(() => setActiveTenantAction(store.id));
            }}
          >
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{store.name}</div>
              <div className="text-xs text-muted-foreground">
                {TEAM_ROLE_LABELS[store.role]}
              </div>
            </div>
            {store.id === activeStoreId && (
              <Check className="size-4 shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/cadastro/assinatura" />}>
          <Plus className="size-4" />
          Nova loja
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Brand({
  storeName,
  slug,
  activeStoreId,
  stores,
}: Omit<SidebarProps, "role">) {
  return (
    <div className="border-b border-border px-5 py-4">
      <div className="text-sm font-bold tracking-tight">
        estoque<span className="text-primary">.autos</span>
      </div>
      <StoreSwitcher
        storeName={storeName}
        activeStoreId={activeStoreId}
        stores={stores}
      />
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

function NavLinks({
  role,
  onNavigate,
}: {
  role: TeamRole;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isStaff = role === "owner" || role === "admin";
  const items = NAV.filter((item) => isStaff || !item.staffOnly);

  return (
    <nav className="flex-1 space-y-0.5 p-3">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-primary/10 text-primary"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({
  storeName,
  slug,
  role,
  activeStoreId,
  stores,
}: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
        <Brand
          storeName={storeName}
          slug={slug}
          activeStoreId={activeStoreId}
          stores={stores}
        />
        <NavLinks role={role} />
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
          <Brand
            storeName={storeName}
            slug={slug}
            activeStoreId={activeStoreId}
            stores={stores}
          />
          <NavLinks role={role} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
