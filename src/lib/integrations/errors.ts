import type { PortalErrorKind } from "./types";

/**
 * Erro classificado de portal. O worker decide pelo `kind`:
 *  - needs_plan → conexão vira 'needs_plan', job encerra (sem retry)
 *  - auth       → conexão vira 'error' (reconectar), job encerra
 *  - validation → anúncio 'rejected' com mensagem legível, sem retry
 *  - mapping    → anúncio 'error' "mapeamento pendente", sem retry
 *  - not_found  → anúncio 'removed' no portal (sem retry)
 *  - rate_limit / transient → retry com backoff
 */
export class PortalError extends Error {
  readonly kind: PortalErrorKind;
  readonly details?: unknown;

  constructor(kind: PortalErrorKind, message: string, details?: unknown) {
    super(message);
    this.name = "PortalError";
    this.kind = kind;
    this.details = details;
  }
}

export function isRetryable(kind: PortalErrorKind): boolean {
  return kind === "rate_limit" || kind === "transient";
}

/** Erro genérico (rede, JSON, bug) tratado como transiente. */
export function toPortalError(err: unknown): PortalError {
  if (err instanceof PortalError) return err;
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "erro desconhecido";
  return new PortalError("transient", message, err);
}

/** Mensagem curta e legível para o lojista (last_error). */
export function humanMessage(err: PortalError): string {
  switch (err.kind) {
    case "needs_plan":
      return `Sem plano/pacote no portal: ${err.message}`;
    case "auth":
      return `Conexão expirou ou foi revogada — reconecte. (${err.message})`;
    case "mapping":
      return `mapeamento pendente: ${err.message}`;
    case "validation":
      return `Rejeitado pelo portal: ${err.message}`;
    case "rate_limit":
      return `Limite de requisições do portal — nova tentativa em breve.`;
    case "not_found":
      return `Anúncio não existe mais no portal (${err.message}).`;
    default:
      return err.message.slice(0, 500);
  }
}
