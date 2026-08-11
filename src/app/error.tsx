"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12 text-center">
      <Link
        href="/"
        className="mb-8 text-xl font-bold tracking-tight text-[var(--color-ink)]"
      >
        estoque<span className="text-[var(--color-brand)]">.autos</span>
      </Link>
      <h1 className="text-2xl font-bold text-[var(--color-ink)]">
        Algo deu errado
      </h1>
      <p className="mt-2 max-w-sm text-sm text-[var(--color-ink-soft)]">
        Tivemos uma falha inesperada ao carregar esta página. Tente de novo em
        instantes.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Button onClick={() => unstable_retry()}>Tentar de novo</Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Ir para o início
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 font-mono text-xs text-[var(--color-ink-soft)]/70">
          código: {error.digest}
        </p>
      )}
    </div>
  );
}
