import type { TemplateId } from "@/lib/types";
import type { PublicVehicle, Storefront, TemplateProps } from "./types";
import { Classico } from "./templates/Classico";
import { Moderno } from "./templates/Moderno";
import { Premium } from "./templates/Premium";
import { Minimal } from "./templates/Minimal";
import { Esportivo } from "./templates/Esportivo";
import { Vitrine } from "./templates/Vitrine";
import { ClassicoDetail } from "./templates/ClassicoDetail";
import { ModernoDetail } from "./templates/ModernoDetail";
import { PremiumDetail } from "./templates/PremiumDetail";
import { MinimalDetail } from "./templates/MinimalDetail";
import { EsportivoDetail } from "./templates/EsportivoDetail";
import { VitrineDetail } from "./templates/VitrineDetail";

/** Tom (claro/escuro) de cada template — referência para outras telas. */
export const TEMPLATE_TONE: Record<TemplateId, "light" | "dark"> = {
  classico: "light",
  moderno: "light",
  premium: "dark",
  minimal: "light",
  esportivo: "dark",
  vitrine: "light",
};

/** Renderiza o template da loja. Switch direto (evita componente dinâmico). */
export function StorefrontView({ store, vehicles }: TemplateProps) {
  switch (store.template_id) {
    case "moderno":
      return <Moderno store={store} vehicles={vehicles} />;
    case "premium":
      return <Premium store={store} vehicles={vehicles} />;
    case "minimal":
      return <Minimal store={store} vehicles={vehicles} />;
    case "esportivo":
      return <Esportivo store={store} vehicles={vehicles} />;
    case "vitrine":
      return <Vitrine store={store} vehicles={vehicles} />;
    case "classico":
    default:
      return <Classico store={store} vehicles={vehicles} />;
  }
}

/** Detalhe de veículo no template da loja (mesmo switch da vitrine). */
export function VehicleDetailView({
  store,
  vehicle,
  slug,
  demo = false,
}: {
  store: Storefront;
  vehicle: PublicVehicle;
  slug: string;
  demo?: boolean;
}) {
  const props = { store, vehicle, slug, demo };
  switch (store.template_id) {
    case "moderno":
      return <ModernoDetail {...props} />;
    case "premium":
      return <PremiumDetail {...props} />;
    case "minimal":
      return <MinimalDetail {...props} />;
    case "esportivo":
      return <EsportivoDetail {...props} />;
    case "vitrine":
      return <VitrineDetail {...props} />;
    case "classico":
    default:
      return <ClassicoDetail {...props} />;
  }
}
