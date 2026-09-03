import { portalsAllowed } from "@/lib/billing";
import { createAdminClient } from "@/lib/supabase/admin";
import { listListings, publishingConnections } from "@/lib/integrations/listings";
import { PORTAL_META } from "@/lib/integrations/registry";
import { publishRequirements } from "@/lib/integrations/requirements";
import type { ListingRow } from "@/lib/integrations/types";
import type { PlanId, PortalId, Tenant, Vehicle } from "@/lib/types";

// ============================================================
// Dados de portais para as telas de veículo (Server Components).
// NÃO é "use server": lê com o admin client depois de requireStaff()
// e nunca vira endpoint chamável pelo browser.
// ============================================================

export interface FormPortal {
  portal: PortalId;
  label: string;
  checked: boolean;
  /** o que falta no cadastro para este portal aceitar o anúncio */
  missing: string[];
  /** conexão com pendência (sem plano, erro) */
  attention: string | null;
}

export async function portalsForVehicleForm(
  tenant: Tenant,
  vehicle: Vehicle | null,
): Promise<{ portals: FormPortal[]; listings: ListingRow[] }> {
  if (!portalsAllowed(tenant.plan as PlanId | null) || tenant.slug === "demo") {
    return { portals: [], listings: [] };
  }
  try {
    const admin = createAdminClient();
    const conns = await publishingConnections(admin, tenant.id);
    if (conns.length === 0) return { portals: [], listings: [] };
    const listings = vehicle
      ? await listListings(admin, { tenantId: tenant.id, vehicleId: vehicle.id })
      : [];
    const byPortal = new Map(listings.map((l) => [l.portal, l]));
    const portals = conns.map((c) => {
      const listing = byPortal.get(c.portal);
      const checked = listing ? listing.desired : c.settings.auto_publish !== false;
      return {
        portal: c.portal,
        label: PORTAL_META[c.portal].label,
        checked,
        missing: vehicle ? publishRequirements(c.portal, vehicle, tenant) : [],
        attention:
          c.status === "needs_plan"
            ? PORTAL_META[c.portal].needsPlanHint
            : c.status === "error"
              ? "Conexão com erro — reconecte em Integrações."
              : null,
      };
    });
    return { portals, listings };
  } catch (err) {
    console.error("portalsForVehicleForm:", err);
    return { portals: [], listings: [] };
  }
}
