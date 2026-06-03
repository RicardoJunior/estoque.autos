import type { Storefront, PublicVehicle } from "@/lib/public";

/** Props que TODO template de vitrine recebe. */
export interface TemplateProps {
  store: Storefront;
  vehicles: PublicVehicle[];
}

export type { Storefront, PublicVehicle };
