// ============================================================
// FIPE — tipos. Espelham as tabelas fipe_* e a API do parallelum.
// Portado de legacy/crawler/src/types/vehicle.ts.
// ============================================================

import type { VehicleCategory } from "../types";

/** Tipos aceitos pela API parallelum (utilitário compra como carro). */
export const FIPE_VEHICLE_TYPES = ["carros", "motos", "caminhoes"] as const;
export type FipeVehicleType = (typeof FIPE_VEHICLE_TYPES)[number];

export function fipeTypeForCategory(category: VehicleCategory): FipeVehicleType {
  if (category === "moto") return "motos";
  if (category === "caminhao") return "caminhoes";
  return "carros"; // carro e utilitario
}

export interface FipeBrand {
  vehicle_type: FipeVehicleType;
  id: string;
  name: string;
}

export interface FipeModel {
  vehicle_type: FipeVehicleType;
  brand_id: string;
  id: string;
  name: string;
}

export interface FipeYear {
  vehicle_type: FipeVehicleType;
  brand_id: string;
  model_id: string;
  /** yearCode do parallelum, ex.: "2014-3" */
  id: string;
  /** ex.: "2014 Diesel" */
  name: string;
}

export interface FipePrice {
  vehicle_type: FipeVehicleType;
  brand_id: string;
  model_id: string;
  year_id: string;
  fipe_code: string;
  price: number;
  brand_name: string | null;
  model_name: string | null;
  year_model: number | null;
  fuel: string | null;
  /** MesReferencia, ex.: "junho de 2026" */
  reference: string;
  fetched_at?: string;
}
