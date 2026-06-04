import Link from "next/link";
import { requireTenant } from "@/lib/auth";
import { VehicleForm } from "../VehicleForm";
import { createVehicleAction } from "../actions";

export const metadata = { title: "Cadastrar carro" };

export default async function NewVehiclePage({
  searchParams,
}: {
  searchParams: Promise<{ primeiro?: string }>;
}) {
  await requireTenant();
  const { primeiro } = await searchParams;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {primeiro === "1" && (
        <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
          <p className="font-semibold">Bem-vindo! 👋</p>
          <p className="mt-0.5 text-muted-foreground">
            Cadastre seu primeiro carro — busque pela tabela FIPE que os campos
            se preenchem sozinhos.
          </p>
        </div>
      )}
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
