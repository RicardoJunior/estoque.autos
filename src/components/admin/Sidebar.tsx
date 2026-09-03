"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Check,
  ChevronsUpDown,
  Home,
  Car,
  Globe,
  LogOut,
  MessageSquareText,
  Plug,
  Plus,
  Settings,
  Store,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { TEAM_ROLE_LABELS, type TeamRole } from "@/lib/types";
import { setActiveTenantAction } from "@/app/admin/actions";
import { logoutAction } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

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
  {
    href: "/admin/integracoes",
    label: "Integrações",
    icon: Plug,
    staffOnly: true,
  },
  { href: "/admin/equipe", label: "Equipe", icon: Users, staffOnly: true },
  {
    href: "/admin/configuracoes",
    label: "Configurações",
    icon: Settings,
    staffOnly: true,
  },
];

export interface SidebarProps {
  storeName: string;
  slug: string;
  role: TeamRole;
  userName: string;
  userEmail: string;
  activeStoreId: string;
  stores: SidebarStore[];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

// Botão largo do topo/rodapé (visual do SidebarMenuButton size="lg").
// NÃO uso render={<SidebarMenuButton>}: Base UI conflita a composição de
// render entre Trigger e o botão (erro #31). Aqui é uma classe só.
const BIG_BUTTON =
  "flex h-12 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground";

function StoreSwitcher({
  storeName,
  slug,
  activeStoreId,
  stores,
}: Pick<SidebarProps, "storeName" | "slug" | "activeStoreId" | "stores">) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const multi = stores.length > 1;

  const inner = (
    <>
      <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Store className="size-4" />
      </div>
      <div className="grid flex-1 leading-tight">
        <span className="truncate text-sm font-semibold">{storeName}</span>
        <span className="truncate text-xs text-muted-foreground">
          estoque.autos
        </span>
      </div>
      {multi && <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-60" />}
    </>
  );

  if (!multi) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Link
            href={`/${slug}`}
            target="_blank"
            rel="noreferrer"
            className={BIG_BUTTON}
          >
            {inner}
          </Link>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger className={BIG_BUTTON}>
            {inner}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-60" align="start">
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              Minhas lojas
            </div>
            {stores.map((store) => (
              <DropdownMenuItem
                key={store.id}
                onClick={() => {
                  if (store.id === activeStoreId) return;
                  startTransition(() => setActiveTenantAction(store.id));
                }}
                className="gap-2"
              >
                <Store className="size-4 shrink-0 text-muted-foreground" />
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
            <DropdownMenuItem onClick={() => router.push("/cadastro/assinatura")}>
              <Plus className="size-4" />
              Nova loja
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function NavMenu({ role }: { role: TeamRole }) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  const isStaff = role === "owner" || role === "admin";
  const items = NAV.filter((item) => isStaff || !item.staffOnly);

  return (
    <SidebarMenu>
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <SidebarMenuItem key={item.href}>
            <Link
              href={item.href}
              onClick={() => isMobile && setOpenMobile(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-9 w-full items-center gap-2.5 rounded-md px-2 text-sm outline-hidden transition [&_svg]:size-4 [&_svg]:shrink-0",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon />
              <span className="truncate">{item.label}</span>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function UserMenu({
  userName,
  userEmail,
}: Pick<SidebarProps, "userName" | "userEmail">) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const [, startTransition] = useTransition();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger className={BIG_BUTTON}>
            <Avatar className="size-8 shrink-0 rounded-lg">
              <AvatarFallback className="rounded-lg bg-primary/15 text-xs font-semibold text-primary">
                {initials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 leading-tight">
              <span className="truncate text-sm font-medium">{userName}</span>
              <span className="truncate text-xs text-muted-foreground">
                {userEmail}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-60"
            side={isMobile ? "bottom" : "top"}
            align="end"
          >
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Avatar className="size-8 shrink-0 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary/15 text-xs font-semibold text-primary">
                  {initials(userName)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 leading-tight">
                <span className="truncate text-sm font-medium">{userName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {userEmail}
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/admin/configuracoes")}>
              <Settings className="size-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => startTransition(() => logoutAction())}
            >
              <LogOut className="size-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function Sidebar(props: SidebarProps) {
  return (
    <SidebarRoot collapsible="offcanvas">
      <SidebarHeader>
        <StoreSwitcher
          storeName={props.storeName}
          slug={props.slug}
          activeStoreId={props.activeStoreId}
          stores={props.stores}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <NavMenu role={props.role} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <UserMenu userName={props.userName} userEmail={props.userEmail} />
      </SidebarFooter>
    </SidebarRoot>
  );
}
