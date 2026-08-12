import Link from "next/link";
import Image from "next/image";
import { Inbox } from "lucide-react";
import { requireTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LEAD_TYPE_LABELS, type Lead, type LeadStatus } from "@/lib/types";
import { formatRelativeTime, vehicleTitle } from "@/lib/format";
import { LeadStatusPill } from "./LeadStatusPill";
import { LeadFilters } from "./LeadFilters";
import { PageHeader } from "@/components/admin/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Leads" };

function coverUrl(lead: Lead): string | null {
  const photos = lead.vehicle?.photos;
  return Array.isArray(photos) && photos.length > 0 ? photos[0].url : null;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { tenant } = await requireTenant();
  const { status, q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select("*, vehicle:vehicles(id, brand, model, year_model, price, photos)")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status as LeadStatus);
  if (q) {
    const term = q.replace(/[%,()]/g, " ").trim();
    if (term) query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%`);
  }

  const { data } = await query;
  const leads = (data ?? []) as Lead[];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader title="Leads" description="Contatos recebidos pelo seu site." />

      <LeadFilters count={leads.length} />

      {leads.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Inbox className="size-8 text-muted-foreground" aria-hidden />
          <div>
            <p className="font-medium">
              {status || q
                ? "Nenhum lead encontrado com esses filtros."
                : "Nenhum lead ainda."}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {status || q
                ? "Ajuste os filtros ou limpe a busca."
                : "Compartilhe o link da sua loja para começar a receber contatos."}
            </p>
          </div>
          {!status && !q && (
            <a
              href={`/${tenant.slug}`}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Ver meu site
            </a>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Contato</TableHead>
                <TableHead className="hidden md:table-cell">Interesse</TableHead>
                <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                <TableHead className="hidden sm:table-cell">Recebido</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => {
                const cover = coverUrl(lead);
                return (
                  <TableRow key={lead.id} className="relative">
                    <TableCell className="max-w-48">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="font-medium after:absolute after:inset-0"
                      >
                        {lead.name ?? "Contato sem nome"}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {lead.phone ?? lead.email ?? "sem contato informado"}
                      </p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2.5">
                        {cover ? (
                          <Image
                            src={cover}
                            alt=""
                            width={44}
                            height={33}
                            className="h-8 w-11 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <div className="h-8 w-11 shrink-0 rounded bg-muted" />
                        )}
                        <span className="max-w-56 truncate text-sm text-muted-foreground">
                          {lead.vehicle
                            ? vehicleTitle(lead.vehicle)
                            : "Contato geral"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="text-muted-foreground">
                        {LEAD_TYPE_LABELS[lead.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                      {formatRelativeTime(lead.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <LeadStatusPill status={lead.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
