import Link from "next/link";
import { requireTenant } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Sua loja está no ar" };

export default async function OnboardingDonePage() {
  const { tenant } = await requireTenant();

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-6 text-lg font-bold tracking-tight">
        estoque<span className="text-[var(--color-brand)]">.autos</span>
      </div>

      <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="text-5xl">🎉</div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          Sua loja está no ar
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Parabéns! Seu site já pode receber clientes.
        </p>

        <a
          href={`/${tenant.slug}`}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-block rounded-lg bg-muted px-4 py-2 font-mono text-sm text-foreground hover:underline"
        >
          estoque.autos/{tenant.slug} ↗
        </a>

        <div className="mt-8 grid gap-3">
          <Link
            href="/admin/veiculos/novo?primeiro=1"
            className={buttonVariants({ size: "lg", className: "w-full" })}
          >
            Cadastrar meu primeiro carro
          </Link>
          <Link
            href={`/${tenant.slug}`}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "w-full",
            })}
          >
            Ver meu site
          </Link>
          <Link
            href="/admin"
            className={buttonVariants({
              variant: "ghost",
              size: "lg",
              className: "w-full",
            })}
          >
            Ir para o painel
          </Link>
        </div>
      </div>
    </div>
  );
}
