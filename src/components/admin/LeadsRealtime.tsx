"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Toast {
  id: string;
  name: string;
}

/**
 * Assina INSERTs na tabela leads do tenant (Supabase Realtime — a
 * publication foi habilitada na migration) e mostra um toast. Na v1 o
 * realtime nunca funcionou porque a publication não existia.
 */
export function LeadsRealtime({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("leads-notify")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leads",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const row = payload.new as { id: string; name: string | null };
          setToasts((t) => [
            { id: row.id, name: row.name ?? "Novo contato" },
            ...t,
          ]);
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, router]);

  function dismiss(id: string) {
    setToasts((t) => t.filter((x) => x.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex w-72 flex-col gap-2">
      {toasts.slice(0, 4).map((t) => (
        <Link
          key={t.id}
          href={`/admin/leads/${t.id}`}
          onClick={() => dismiss(t.id)}
          className="card flex items-center gap-3 p-3 shadow-lg ring-1 ring-[var(--color-brand)]/20"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)]/10 text-lg">
            🔔
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold">Novo lead!</div>
            <div className="truncate text-xs text-[var(--color-ink-soft)]">
              {t.name} — clique para ver
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
