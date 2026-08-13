import Link from "next/link";
import type { CSSProperties } from "react";
import type { PublicVehicle, Storefront } from "@/lib/public";
import { vehicleTitle } from "@/lib/format";
import { LeadDialog } from "@/components/storefront/LeadDialog";
import {
  WhatsAppButton,
  PhoneButton,
} from "@/components/storefront/ContactButtons";
import { vehicleWaMessage } from "@/components/storefront/vehicle-detail-data";

// ============================================================
// Ações de contato do detalhe (proposta + WhatsApp + telefone, ou
// CTA de demo). Lógica ÚNICA e sensível (lead/anti-spam) — os 6
// layouts de detalhe só posicionam/temam. Cores vêm do tema (--sf-*);
// `tone` ajusta as neutras do botão "Ligar" (claro/escuro).
// ============================================================

export function VehicleActions({
  store,
  vehicle,
  demo = false,
  tone = "light",
  className = "",
}: {
  store: Storefront;
  vehicle: PublicVehicle;
  demo?: boolean;
  tone?: "light" | "dark";
  className?: string;
}) {
  const title = vehicleTitle(vehicle);
  const waMessage = vehicleWaMessage(vehicle);
  const accent: CSSProperties = {
    background: "var(--sf-accent)",
    color: "var(--sf-on-accent)",
  };
  const btn =
    "flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition hover:opacity-90";
  const phoneBtn =
    tone === "dark"
      ? "flex w-full items-center justify-center gap-2 rounded-lg border border-white/25 py-3 text-sm font-bold text-white hover:bg-white/10"
      : "flex w-full items-center justify-center gap-2 rounded-lg border border-black/15 py-3 text-sm font-bold hover:bg-black/[0.03]";

  if (demo) {
    return (
      <div className={className}>
        <Link href="/cadastro" className={btn} style={accent}>
          Quero um site como este
        </Link>
        <p
          className="mt-2 text-center text-xs"
          style={{ color: "var(--sf-ink-faint, #94a3b8)" }}
        >
          Site de demonstração — no seu site, os botões de proposta, WhatsApp e
          telefone ficam ativos aqui.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <LeadDialog
        vehicleId={vehicle.id}
        vehicleTitle={title}
        storeName={store.name}
        whatsapp={store.whatsapp}
        waMessage={waMessage}
        triggerClassName={btn}
        triggerStyle={accent}
        trigger="Fazer proposta"
      />
      {store.whatsapp && (
        <WhatsAppButton
          vehicleId={vehicle.id}
          phone={store.whatsapp}
          message={waMessage}
          className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] py-3 text-sm font-bold text-white transition hover:opacity-90"
        />
      )}
      {store.phone && (
        <PhoneButton
          vehicleId={vehicle.id}
          phone={store.phone}
          className={`mt-2.5 ${phoneBtn}`}
        >
          Ligar agora
        </PhoneButton>
      )}
    </div>
  );
}
