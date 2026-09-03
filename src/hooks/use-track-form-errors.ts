import { useEffect } from "react";
import { trackFunnel, type FunnelEvent, type FunnelParams } from "@/lib/funnel";

interface TrackableState {
  error?: string;
  /** código estável do erro (ver AuthFormState.code) */
  code?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Dispara `name` no GA4 sempre que uma server action (useActionState)
 * devolve erro. `error_type` vem do código da action (nunca da
 * mensagem em PT); `fields` lista os campos inválidos.
 */
export function useTrackFormErrors(
  state: TrackableState,
  name: FunnelEvent,
  params: FunnelParams = {},
): void {
  useEffect(() => {
    if (!state.error && !state.fieldErrors) return;
    trackFunnel(name, {
      ...params,
      error_type: state.code ?? (state.fieldErrors ? "validation" : "unknown"),
      fields: state.fieldErrors
        ? Object.keys(state.fieldErrors).sort().join(",")
        : undefined,
    });
    // cada resultado da action é um objeto novo → 1 disparo por tentativa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}
