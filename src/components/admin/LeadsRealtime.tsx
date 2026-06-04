"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/**
 * Assina INSERTs na tabela leads do tenant (Supabase Realtime — a
 * publication foi habilitada na migration) e mostra um toast. Na v1 o
 * realtime nunca funcionou porque a publication não existia.
 */
export function LeadsRealtime({ tenantId }: { tenantId: string }) {
  const router = useRouter();

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
          toast("Novo lead! 🔔", {
            description: `${row.name ?? "Novo contato"} — clique para ver`,
            action: {
              label: "Ver",
              onClick: () => router.push(`/admin/leads/${row.id}`),
            },
          });
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, router]);

  return null;
}
