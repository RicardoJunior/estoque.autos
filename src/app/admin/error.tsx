"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({
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
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-xl bg-card p-8 text-center text-card-foreground ring-1 ring-foreground/10">
        <h2 className="text-lg font-bold">
          Não foi possível carregar esta tela
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Falha inesperada ao buscar os dados. Tente de novo — seu estoque e
          seus leads continuam salvos.
        </p>
        <Button className="mt-6" onClick={() => unstable_retry()}>
          Tentar de novo
        </Button>
        {error.digest && (
          <p className="mt-4 font-mono text-xs text-muted-foreground/70">
            código: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
