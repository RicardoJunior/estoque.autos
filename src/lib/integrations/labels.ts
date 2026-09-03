import type { ConnectionStatus, ListingStatus } from "./types";

// Rótulos puros (sem dependência de servidor) — seguros em client components.

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  queued: "Na fila",
  publishing: "Publicando",
  active: "No ar",
  paused: "Pausado",
  error: "Com erro",
  removed: "Removido",
  rejected: "Recusado",
};

export const CONNECTION_STATUS_LABELS: Record<ConnectionStatus, string> = {
  pending: "Pendente",
  active: "Ativo",
  needs_plan: "Aguardando plano no portal",
  error: "Precisa de atenção",
  disconnected: "Desconectado",
};
