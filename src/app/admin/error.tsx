"use client";

import { useEffect } from "react";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
      <Card className="w-full max-w-md items-center gap-0 p-8 text-center">
        <h2 className="text-lg font-bold">
          Não foi possível carregar esta tela
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Falha inesperada ao buscar os dados. Tente de novo — seu estoque e
          seus leads continuam salvos.
        </p>
        <Button className="mt-6" onClick={() => unstable_retry()}>
          <RotateCw data-icon="inline-start" aria-hidden />
          Tentar de novo
        </Button>
        {error.digest && (
          <p className="mt-4 font-mono text-xs text-muted-foreground/70">
            código: {error.digest}
          </p>
        )}
      </Card>
    </div>
  );
}
