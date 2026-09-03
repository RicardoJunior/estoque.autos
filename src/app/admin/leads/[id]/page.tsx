import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ExternalLink, Mail, MessageCircle, Phone } from "lucide-react";
import { requireTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LEAD_SOURCE_LABELS, LEAD_TYPE_LABELS, type Lead } from "@/lib/types";
import {
  formatDateTime,
  formatPrice,
  formatRelativeTime,
  vehicleTitle,
  whatsappLink,
} from "@/lib/format";
import { LeadDetailControls } from "./LeadDetailControls";
import { LeadStatusPill } from "../LeadStatusPill";
import { PageHeader } from "@/components/admin/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata = { title: "Lead" };

/** contact_type/source cru dos portais → rótulo curto */
const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  call: "Ligação",
  telefone: "Telefone",
  question: "Pergunta",
  visit_request: "Visita",
  contact_request: "Contato",
  reservation: "Reserva",
  quotations: "Cotação",
  chat: "Chat",
  financing: "Financiamento",
  olx: "Formulário",
};

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { tenant, role } = await requireTenant();
  const isStaff = role === "owner" || role === "admin";
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
  const cover =
    Array.isArray(lead.vehicle?.photos) && lead.vehicle.photos.length > 0
      ? lead.vehicle.photos[0].url
      : null;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        title={lead.name ?? "Contato sem nome"}
        backHref="/admin/leads"
        backLabel="Leads"
      />

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
        {/* coluna principal: quem é + o que quer + como responder */}
        <div className="space-y-5">
          <Card className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <Avatar className="size-11">
                <AvatarFallback className="bg-primary/15 font-semibold text-primary">
                  {initials(lead.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">
                    {lead.name ?? "Contato sem nome"}
                  </span>
                  <Badge variant="outline" className="text-muted-foreground">
                    {LEAD_TYPE_LABELS[lead.type]}
                  </Badge>
                  {lead.source && lead.source !== "site" && (
                    <Badge className="rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300">
                      {LEAD_SOURCE_LABELS[lead.source]}
                      {lead.channel ? ` · ${CHANNEL_LABELS[lead.channel] ?? lead.channel}` : ""}
                    </Badge>
                  )}
                  <LeadStatusPill status={lead.status} />
                </div>
                <p
                  className="text-sm text-muted-foreground"
                  title={formatDateTime(lead.created_at)}
                >
                  Recebido {formatRelativeTime(lead.created_at)}
                </p>
              </div>
            </div>

            <div className="grid gap-x-4 gap-y-3 sm:grid-cols-3">
              {lead.phone && (
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="text-sm font-medium">{lead.phone}</p>
                </div>
              )}
              {lead.email && (
                <div>
                  <p className="text-xs text-muted-foreground">E-mail</p>
                  <p className="truncate text-sm font-medium">{lead.email}</p>
                </div>
              )}
              {lead.trade_vehicle && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Veículo na troca
                  </p>
                  <p className="text-sm font-medium">{lead.trade_vehicle}</p>
                </div>
              )}
            </div>

            {lead.proposal_value != null && (
              <div className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3">
                <p className="text-xs text-muted-foreground">Proposta enviada</p>
                <p className="text-xl font-bold text-primary">
                  {formatPrice(lead.proposal_value)}
                </p>
                {lead.vehicle && (
                  <p className="text-xs text-muted-foreground">
                    anunciado por {formatPrice(lead.vehicle.price)}
                  </p>
                )}
              </div>
            )}

            {lead.message && (
              <blockquote className="rounded-lg border-l-2 border-primary/50 bg-muted/60 px-4 py-3 text-sm">
                <p className="mb-1 text-xs text-muted-foreground">Mensagem</p>
                {lead.message}
              </blockquote>
            )}

            {lead.external_url && (
              <a
                href={lead.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Ver o anúncio no {LEAD_SOURCE_LABELS[lead.source] ?? "portal"}
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            )}

            {(lead.phone || lead.email) && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {lead.phone && (
                    <a
                      href={whatsappLink(
                        lead.phone,
                        `Olá ${lead.name ?? ""}! Sobre seu interesse no ${
                          lead.vehicle ? vehicleTitle(lead.vehicle) : "veículo"
                        }...`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants()}
                    >
                      <MessageCircle data-icon="inline-start" aria-hidden />
                      Responder no WhatsApp
                    </a>
                  )}
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone.replace(/\D/g, "")}`}
                      className={buttonVariants({ variant: "outline" })}
                    >
                      <Phone data-icon="inline-start" aria-hidden />
                      Ligar
                    </a>
                  )}
                  {lead.email && (
                    <a
                      href={`mailto:${lead.email}`}
                      className={buttonVariants({ variant: "outline" })}
                    >
                      <Mail data-icon="inline-start" aria-hidden />
                      E-mail
                    </a>
                  )}
                </div>
              </>
            )}
          </Card>

          <LeadDetailControls
            leadId={lead.id}
            status={lead.status}
            notes={lead.notes ?? ""}
            canDelete={isStaff}
          />
        </div>

        {/* lateral: o carro do interesse */}
        {lead.vehicle && (
          <Card className="overflow-hidden p-0">
            {cover ? (
              <div className="relative aspect-[4/3] bg-muted">
                <Image
                  src={cover}
                  alt={vehicleTitle(lead.vehicle)}
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-muted text-xs text-muted-foreground">
                sem foto
              </div>
            )}
            <div className="space-y-1 p-4">
              <p className="text-xs text-muted-foreground">Interesse em</p>
              <p className="font-semibold leading-snug">
                {vehicleTitle(lead.vehicle)}
              </p>
              <p className="text-lg font-bold text-primary">
                {formatPrice(lead.vehicle.price)}
              </p>
              <Link
                href={
                  isStaff
                    ? `/admin/veiculos/${lead.vehicle.id}`
                    : `/${tenant.slug}/carros/${lead.vehicle.id}`
                }
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "mt-2 w-full",
                })}
              >
                {isStaff ? "Abrir anúncio" : "Ver no site"}
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
