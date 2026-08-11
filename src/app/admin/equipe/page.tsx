import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Invite, TeamMember } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createBillingPortalAction } from "../configuracoes/actions";
import { InviteForm } from "./InviteForm";
import { MembersList } from "./MembersList";
import { PendingInvites } from "./PendingInvites";

export const metadata = { title: "Equipe" };

export default async function TeamPage() {
  const { tenant, role, userId } = await requireStaff();

  if (tenant.plan !== "pro") {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <PageHeader />
        <TeamUpgradeCard />
      </div>
    );
  }

  const supabase = await createClient();
  const [membersRes, invitesRes] = await Promise.all([
    supabase.rpc("team_members", { p_tenant: tenant.id }),
    supabase
      .from("invites")
      .select("*")
      .eq("tenant_id", tenant.id)
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
  ]);
  const members = (membersRes.data ?? []) as TeamMember[];
  const now = new Date();
  const invites = ((invitesRes.data ?? []) as Invite[]).map((i) => ({
    ...i,
    expired: new Date(i.expires_at) < now,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader />
      <MembersList
        members={members}
        isOwner={role === "owner"}
        currentUserId={userId}
        storeName={tenant.name}
      />
      {invites.length > 0 && <PendingInvites invites={invites} />}
      <InviteForm />
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-xl font-bold">Equipe</h1>
      <p className="text-sm text-[var(--color-ink-soft)]">
        Convide colaboradores para gerenciar o estoque e atender os leads da
        sua loja.
      </p>
    </div>
  );
}

function TeamUpgradeCard() {
  return (
    <Card className="gap-3 px-5 py-5">
      <CardHeader className="px-0">
        <CardTitle className="text-sm font-semibold">
          Equipe da loja
        </CardTitle>
        <CardDescription>
          Convide vendedores e administradores para trabalhar com você no
          painel — cada um com o próprio acesso e permissões. Disponível no
          plano Pro.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <form action={createBillingPortalAction}>
          <Button type="submit" variant="outline">
            Fazer upgrade para o Pro
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
