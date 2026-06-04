import Link from "next/link";
import { requireTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  LEAD_STATUS_LABELS,
  LEAD_TYPE_LABELS,
  type Lead,
  type LeadStatus,
} from "@/lib/types";
import { formatDateTime, vehicleTitle } from "@/lib/format";
import { LeadStatusPill } from "./LeadStatusPill";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Leads" };

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "", label: "Todos" },
  { key: "new", label: "Novos" },
  { key: "in_progress", label: "Em atendimento" },
  { key: "won", label: "Convertidos" },
  { key: "lost", label: "Perdidos" },
];

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { tenant } = await requireTenant();
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select("*, vehicle:vehicles(id, brand, model, year_model, price, photos)")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status as LeadStatus);

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

      <div className="flex flex-wrap gap-1.5">
        {STATUS_TABS.map((t) => {
          const active = (status ?? "") === t.key;
          return (
            <Link
              key={t.key}
              href={t.key ? `/admin/leads?status=${t.key}` : "/admin/leads"}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground ring-1 ring-border hover:bg-muted"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {leads.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          Nenhum lead {status ? "com esse status" : "ainda"}. Compartilhe o link
          da sua loja para começar a receber contatos.
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

export function statusLabel(s: LeadStatus) {
  return LEAD_STATUS_LABELS[s];
}
