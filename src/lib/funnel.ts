// ============================================================
// Eventos de funil da PLATAFORMA (client-only): dispara o mesmo
// evento no GA4 (gtag) e no Pixel da Meta (fbq). Usado só nas rotas
// da plataforma — nunca nas vitrines dos lojistas (LGPD: o lojista é
// o controlador dos dados dos visitantes dele).
//
// Nomes GA4 padrão → evento padrão da Meta:
//   sign_up        → CompleteRegistration (conta confirmada)
//   begin_checkout → InitiateCheckout     (clicou "Continuar p/ pagamento")
//   purchase       → Purchase             (assinatura paga)
// ============================================================

export type FunnelEvent = "sign_up" | "begin_checkout" | "purchase";

export interface FunnelParams {
  /** valor em BRL (ex.: 24.9) */
  value?: number;
  plan?: string;
  interval?: string;
  transaction_id?: string;
}

const META_EVENT: Record<FunnelEvent, string> = {
  sign_up: "CompleteRegistration",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
};

type W = Window & {
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
};

function fire(name: FunnelEvent, params: FunnelParams): boolean {
  const w = window as W;
  const gaOk = typeof w.gtag === "function";
  const fbOk = typeof w.fbq === "function";
  if (!gaOk && !fbOk) return false;

  if (gaOk) {
    w.gtag!("event", name, {
      currency: "BRL",
      ...params,
      ...(name === "purchase" || name === "begin_checkout"
        ? {
            items: [
              {
                item_id: `${params.plan ?? "plano"}_${params.interval ?? ""}`,
                item_name: `estoque.autos ${params.plan ?? ""} ${params.interval ?? ""}`.trim(),
                price: params.value,
                quantity: 1,
              },
            ],
          }
        : {}),
    });
  }
  if (fbOk) {
    w.fbq!("track", META_EVENT[name], {
      currency: "BRL",
      value: params.value,
      content_name: params.plan
        ? `${params.plan}_${params.interval ?? ""}`
        : undefined,
      content_type: "product",
    });
  }
  return true;
}

/**
 * Dispara o evento; se os scripts ainda não carregaram (afterInteractive),
 * tenta de novo por alguns segundos. `dedupeKey` garante 1 disparo por
 * sessão do navegador (recarregar a página não conta de novo).
 */
export function trackFunnel(
  name: FunnelEvent,
  params: FunnelParams = {},
  dedupeKey?: string,
): void {
  if (typeof window === "undefined") return;
  const key = dedupeKey ? `funnel:${name}:${dedupeKey}` : null;
  try {
    if (key && sessionStorage.getItem(key)) return;
  } catch {
    /* storage bloqueado — segue sem dedupe */
  }
  const mark = () => {
    if (!key) return;
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
  };

  if (fire(name, params)) return mark();
  let tries = 0;
  const timer = window.setInterval(() => {
    tries += 1;
    if (fire(name, params) || tries >= 20) {
      window.clearInterval(timer);
      if (tries < 20) mark();
    }
  }, 250);
}
