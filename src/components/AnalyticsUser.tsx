"use client";

import { useEffect } from "react";
import { setFunnelUser } from "@/lib/funnel";

/**
 * Identifica o usuário logado no GA4 (User-ID). Renderize em páginas
 * server que já têm sessão: `<AnalyticsUser id={session.userId} />`.
 */
export function AnalyticsUser({ id }: { id: string }) {
  useEffect(() => {
    setFunnelUser(id);
  }, [id]);
  return null;
}
