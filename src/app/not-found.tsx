import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12 text-center">
      <Link
        href="/"
        className="mb-8 text-xl font-bold tracking-tight text-[var(--color-ink)]"
      >
        estoque<span className="text-[var(--color-brand)]">.autos</span>
      </Link>
      <p className="font-mono text-sm text-[var(--color-ink-soft)]">404</p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--color-ink)]">
        Página não encontrada
      </h1>
      <p className="mt-2 max-w-sm text-sm text-[var(--color-ink-soft)]">
        O endereço pode estar errado ou a página foi removida.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Link href="/" className={buttonVariants()}>
          Ir para o início
        </Link>
        <Link href="/login" className={buttonVariants({ variant: "outline" })}>
          Entrar na minha conta
        </Link>
      </div>
    </div>
  );
}
