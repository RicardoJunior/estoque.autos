import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LEAD_TYPE_LABELS, type Lead } from "@/lib/types";
import {
  formatDateTime,
  formatPrice,
  vehicleTitle,
  whatsappLink,
} from "@/lib/format";
import { LeadDetailControls } from "./LeadDetailControls";

export const metadata = { title: "Lead" };

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { tenant } = await requireTenant();
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("leads")
    .select("*, vehicle:vehicles(id, brand, model, year_model, price, photos)")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .single();

  if (!data) notFound();
  const lead = data as Lead;

  const info: [string, string | null][] = [
    ["Telefone", lead.phone],
    ["E-mail", lead.email],
    ["Tipo de contato", LEAD_TYPE_LABELS[lead.type]],
    [
      "Proposta",
      lead.proposal_value != null ? formatPrice(lead.proposal_value) : null,
    ],
    ["Veículo na troca", lead.trade_vehicle],
    ["Recebido em", formatDateTime(lead.created_at)],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link
          href="/admin/leads"
          className="text-sm text-[var(--color-ink-soft)] hover:underline"
        >
          ← Leads
        </Link>
        <h1 className="mt-1 text-xl font-bold">
          {lead.name ?? "Contato sem nome"}
        </h1>
      </div>

      <div className="card space-y-4 p-5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {info
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k}>
                <div className="text-xs text-[var(--color-ink-soft)]">{k}</div>
                <div className="text-sm font-medium">{v}</div>
              </div>
            ))}
        </div>

        {lead.message && (
          <div className="rounded-[var(--radius)] bg-slate-50 p-3 text-sm">
            <div className="mb-1 text-xs text-[var(--color-ink-soft)]">
              Mensagem
            </div>
            {lead.message}
          </div>
        )}

        {lead.vehicle && (
          <Link
            href={`/admin/veiculos/${lead.vehicle.id}`}
            className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--color-border)] p-3 text-sm hover:bg-slate-50"
          >
            <span>
              Interesse em{" "}
              <span className="font-semibold">{vehicleTitle(lead.vehicle)}</span>
            </span>
            <span className="font-semibold text-[var(--color-brand)]">
              {formatPrice(lead.vehicle.price)}
            </span>
          </Link>
        )}

        {lead.phone && (
          <div className="flex gap-2">
            <a
              href={whatsappLink(
                lead.phone,
                `Olá ${lead.name ?? ""}! Sobre seu interesse no ${
                  lead.vehicle ? vehicleTitle(lead.vehicle) : "veículo"
                }...`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Responder no WhatsApp
            </a>
            <a href={`tel:${lead.phone.replace(/\D/g, "")}`} className="btn-ghost">
              Ligar
            </a>
          </div>
        )}
      </div>

      <LeadDetailControls
        leadId={lead.id}
        status={lead.status}
        notes={lead.notes ?? ""}
      />
    </div>
  );
}
