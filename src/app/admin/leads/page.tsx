import Link from "next/link";
import { requireTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  LEAD_TYPE_LABELS,
  type Lead,
  type LeadStatus,
} from "@/lib/types";
import { formatDateTime, vehicleTitle } from "@/lib/format";
import { LeadStatusPill } from "./LeadStatusPill";
import { LeadFilters } from "./LeadFilters";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Leads" };

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
      <div>
        <h1 className="text-xl font-bold">Leads</h1>
        <p className="text-sm text-muted-foreground">
          Contatos recebidos pelo seu site.
        </p>
      </div>

      <LeadFilters count={leads.length} />

      {leads.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          {status || q
            ? "Nenhum lead encontrado com esses filtros."
            : "Nenhum lead ainda. Compartilhe o link da sua loja para começar a receber contatos."}
        </Card>
      ) : (
        <Card className="divide-y divide-border p-0">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/admin/leads/${lead.id}`}
              className="flex items-center gap-4 px-4 py-3 transition hover:bg-muted"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold">
                    {lead.name ?? "Contato sem nome"}
                  </span>
                  <Badge variant="secondary" className="text-muted-foreground">
                    {LEAD_TYPE_LABELS[lead.type]}
                  </Badge>
                </div>
                <div className="mt-0.5 truncate text-sm text-muted-foreground">
                  {lead.vehicle ? vehicleTitle(lead.vehicle) : "veículo removido"}
                  {lead.phone ? ` · ${lead.phone}` : ""}
                </div>
              </div>
              <div className="hidden text-right text-xs text-muted-foreground sm:block">
                {formatDateTime(lead.created_at)}
              </div>
              <LeadStatusPill status={lead.status} />
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
