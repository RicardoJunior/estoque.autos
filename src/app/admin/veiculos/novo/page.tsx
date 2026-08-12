import { requireStaff } from "@/lib/auth";
import { PageHeader } from "@/components/admin/PageHeader";
import { VehicleForm } from "../VehicleForm";
import { createVehicleAction } from "../actions";

export const metadata = { title: "Cadastrar carro" };

export default async function NewVehiclePage({
  searchParams,
}: {
  searchParams: Promise<{ primeiro?: string }>;
}) {
  await requireStaff();
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
      <PageHeader
        title="Cadastrar carro"
        description="Busque na FIPE, confira os dados e suba as fotos — tudo numa tela só."
        backHref="/admin/veiculos"
        backLabel="Estoque"
      />
      <VehicleForm
        action={createVehicleAction}
        submitLabel="Publicar anúncio"
        withPhotoStage
      />
    </div>
  );
}
