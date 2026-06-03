import Link from "next/link";
import { requireTenant } from "@/lib/auth";
import { VehicleForm } from "../VehicleForm";
import { createVehicleAction } from "../actions";

export const metadata = { title: "Cadastrar carro" };

export default async function NewVehiclePage() {
  await requireTenant();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link
          href="/admin/veiculos"
          className="text-sm text-[var(--color-ink-soft)] hover:underline"
        >
          ← Estoque
        </Link>
        <h1 className="mt-1 text-xl font-bold">Cadastrar carro</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Preencha os dados. Em seguida você adiciona as fotos.
        </p>
      </div>
      <VehicleForm action={createVehicleAction} submitLabel="Salvar e adicionar fotos →" />
    </div>
  );
}
