import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getFipeBrands,
  getFipeModels,
  getFipePrice,
  getFipeYears,
} from "@/lib/fipe/cache";
import { FIPE_VEHICLE_TYPES, type FipeVehicleType } from "@/lib/fipe/types";

// ============================================================
// /api/fipe/{brands|models|years|price} — proxy com cache para o
// cadastro de veículos (cascata marca → modelo → ano → valor).
// Autenticado: alimenta o admin; o parallelum fica protegido do
// público pelo login + cache no banco.
// ============================================================

function isVehicleType(v: string | null): v is FipeVehicleType {
  return !!v && (FIPE_VEHICLE_TYPES as readonly string[]).includes(v);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ resource: string }> },
) {
  const session = await getSession();
  if (!session) return new Response("não autenticado", { status: 401 });

  const { resource } = await params;
  const q = req.nextUrl.searchParams;
  const type = q.get("type");
  if (!isVehicleType(type)) {
    return new Response("type inválido", { status: 400 });
  }
  const brand = q.get("brand");
  const model = q.get("model");
  const year = q.get("year");

  try {
    switch (resource) {
      case "brands":
        return Response.json(await getFipeBrands(type));
      case "models":
        if (!brand) return new Response("brand obrigatório", { status: 400 });
        return Response.json(await getFipeModels(type, brand));
      case "years":
        if (!brand || !model)
          return new Response("brand e model obrigatórios", { status: 400 });
        return Response.json(await getFipeYears(type, brand, model));
      case "price":
        if (!brand || !model || !year)
          return new Response("brand, model e year obrigatórios", {
            status: 400,
          });
        return Response.json(await getFipePrice(type, brand, model, year));
      default:
        return new Response("recurso desconhecido", { status: 404 });
    }
  } catch (err) {
    console.error(`api/fipe/${resource}:`, err);
    return new Response("erro ao consultar FIPE", { status: 502 });
  }
}
