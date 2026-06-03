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
        <p className="text-sm text-[var(--color-ink-soft)]">
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
                  ? "bg-[var(--color-brand)] text-white"
                  : "bg-white text-[var(--color-ink)] ring-1 ring-[var(--color-border)] hover:bg-slate-50"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {leads.length === 0 ? (
        <div className="card p-12 text-center text-[var(--color-ink-soft)]">
          Nenhum lead {status ? "com esse status" : "ainda"}. Compartilhe o link
          da sua loja para começar a receber contatos.
        </div>
      ) : (
        <div className="card divide-y divide-[var(--color-border)]">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/admin/leads/${lead.id}`}
              className="flex items-center gap-4 px-4 py-3 transition hover:bg-slate-50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold">
                    {lead.name ?? "Contato sem nome"}
                  </span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                    {LEAD_TYPE_LABELS[lead.type]}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-sm text-[var(--color-ink-soft)]">
                  {lead.vehicle ? vehicleTitle(lead.vehicle) : "veículo removido"}
                  {lead.phone ? ` · ${lead.phone}` : ""}
                </div>
              </div>
              <div className="hidden text-right text-xs text-[var(--color-ink-soft)] sm:block">
                {formatDateTime(lead.created_at)}
              </div>
              <LeadStatusPill status={lead.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function statusLabel(s: LeadStatus) {
  return LEAD_STATUS_LABELS[s];
}
