"use client";

import { useEffect } from "react";
import { trackFunnel, type FunnelEvent as Name, type FunnelParams } from "@/lib/funnel";

/**
 * Dispara um evento de funil (GA4 + Meta) ao montar. Renderize em
 * páginas server: `<FunnelEvent name="sign_up" dedupeKey={userId} />`.
 */
export function FunnelEvent({
  name,
  params,
  dedupeKey,
}: {
  name: Name;
  params?: FunnelParams;
  dedupeKey?: string;
}) {
  useEffect(() => {
    trackFunnel(name, params, dedupeKey);
    // params é objeto novo a cada render; o dedupe cobre repetições
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, dedupeKey]);
  return null;
}
