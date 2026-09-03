// ============================================================
// Eventos de funil da PLATAFORMA (client-only): dispara no GA4 (gtag),
// no Microsoft Clarity (clarity — filtra gravações por evento) e, para os
// marcos comerciais, também no Pixel da Meta (fbq). Usado
// só nas rotas da plataforma — nunca nas vitrines dos lojistas (LGPD:
// o lojista é o controlador dos dados dos visitantes dele).
//
// Cada etapa do funil tem evento de INTENÇÃO (submit), de FALHA
// (error, com `error_type` estável — nunca a mensagem em PT) e de
// SUCESSO. Assim o GA4 mostra ONDE o cadastro trava, não só quantos
// chegam ao fim. page_view continua vindo do PlatformAnalytics.
//
// Funil principal (landing → loja no ar):
//   select_plan            clicou num plano na landing
//   sign_up_submit         enviou o form de cadastro
//   sign_up_error          cadastro falhou (validation|email_exists|rate_limit|unknown)
//   sign_up_submitted      conta criada, e-mail de confirmação enviado  → Meta Lead
//   confirm_code_submit    digitou o código
//   confirm_code_error     código inválido/expirado/incompleto
//   confirm_code_not_received  abriu "não recebi o código"
//   confirm_code_resend / _resent / _resend_error
//   sign_up                e-mail confirmado (method: codigo|link)     → Meta CompleteRegistration
//   begin_checkout         clicou "Continuar para o pagamento"        → Meta InitiateCheckout
//   purchase_pending       voltou do Stripe sem confirmação ainda
//   purchase               assinatura paga                            → Meta Purchase
//   onboarding_step        viu um passo do wizard (step, step_name)
//   onboarding_submit      clicou "Publicar meu site"
//   onboarding_error       publicação falhou
//   onboarding_complete    loja no ar (ativação real)
//
// Login (para separar "não consegue entrar" de "não converteu"):
//   login_submit / login_error (method: password|link)
//   login_code_request / login_code_sent / login_code_request_error
//   login_code_submit / login_code_error
//   login_code_not_received / login_code_resend / _resent / _resend_error
//
// Parâmetros custom que valem registrar como dimensões de evento no
// GA4 (Admin → Definições personalizadas): plan, interval, method,
// error_type, fields, step_name, invited, has_phone.
// ============================================================

export const GA_ID = "G-486H5Q09DP";

export type FunnelEvent =
  // landing
  | "select_plan"
  // cadastro
  | "sign_up_submit"
  | "sign_up_error"
  | "sign_up_submitted"
  // confirmação por código
  | "confirm_code_submit"
  | "confirm_code_error"
  | "confirm_code_not_received"
  | "confirm_code_resend"
  | "confirm_code_resent"
  | "confirm_code_resend_error"
  | "sign_up"
  // checkout
  | "begin_checkout"
  | "purchase_pending"
  | "purchase"
  // onboarding
  | "onboarding_step"
  | "onboarding_submit"
  | "onboarding_error"
  | "onboarding_complete"
  // login
  | "login_submit"
  | "login_error"
  | "login_code_request"
  | "login_code_sent"
  | "login_code_request_error"
  | "login_code_submit"
  | "login_code_error"
  | "login_code_not_received"
  | "login_code_resend"
  | "login_code_resent"
  | "login_code_resend_error";

export interface FunnelParams {
  /** valor em BRL (ex.: 24.9) */
  value?: number;
  plan?: string;
  interval?: string;
  transaction_id?: string;
  /** como chegou: codigo | link | password | direto */
  method?: string;
  /** código estável do erro (nunca a mensagem em PT, nunca e-mail) */
  error_type?: string;
  /** campos com erro de validação, separados por vírgula */
  fields?: string;
  step?: number;
  step_name?: string;
  invited?: boolean;
  has_phone?: boolean;
}

/** Eventos que também vão para a Meta (só os marcos comerciais). */
const META_EVENT: Partial<Record<FunnelEvent, string>> = {
  sign_up_submitted: "Lead",
  sign_up: "CompleteRegistration",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
};

/** Eventos com item (plano) — alimentam os relatórios de e-commerce do GA4. */
const WITH_ITEMS = new Set<FunnelEvent>([
  "select_plan",
  "begin_checkout",
  "purchase",
]);

type W = Window & {
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
  clarity?: (...args: unknown[]) => void;
};

/** `sessionStorage.setItem("ga_debug","1")` → eventos aparecem no DebugView. */
function debugMode(): boolean {
  try {
    return sessionStorage.getItem("ga_debug") === "1";
  } catch {
    return false;
  }
}

function fire(name: FunnelEvent, params: FunnelParams): boolean {
  const w = window as W;
  const gaOk = typeof w.gtag === "function";
  const fbOk = typeof w.fbq === "function";
  if (!gaOk && !fbOk) return false;

  if (gaOk) {
    w.gtag!("event", name, {
      ...(params.value != null ? { currency: "BRL" } : {}),
      ...params,
      ...(WITH_ITEMS.has(name)
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
      ...(debugMode() ? { debug_mode: true } : {}),
    });
  }
  // Clarity: evento custom + tag com o tipo de erro → "gravações em que
  // o cadastro falhou por rate_limit". A fila do snippet aceita chamadas
  // antes do script carregar, então não precisa do retry.
  if (typeof w.clarity === "function") {
    w.clarity("event", name);
    if (params.error_type) w.clarity("set", "error_type", params.error_type);
  }
  const meta = META_EVENT[name];
  if (fbOk && meta) {
    w.fbq!("track", meta, {
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
 * Executa `fn` quando os scripts (afterInteractive) estiverem prontos;
 * tenta por alguns segundos. Retorna se conseguiu de primeira.
 */
function whenReady(fn: () => boolean, onDone?: () => void): void {
  if (fn()) return onDone?.();
  let tries = 0;
  const timer = window.setInterval(() => {
    tries += 1;
    if (fn() || tries >= 20) {
      window.clearInterval(timer);
      if (tries < 20) onDone?.();
    }
  }, 250);
}

/**
 * Dispara o evento. `dedupeKey` garante 1 disparo por sessão do
 * navegador (recarregar a página não conta de novo) — use em eventos
 * de "chegou nesta etapa"; cliques e erros não precisam.
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
  whenReady(() => fire(name, params), mark);
}

/**
 * Identifica o usuário logado no GA4 (User-ID = uuid do Supabase, não
 * é PII). Costura desktop ↔ celular: quem cadastra no computador e
 * confirma o e-mail no celular vira UM usuário no funil, não dois.
 */
export function setFunnelUser(userId: string): void {
  if (typeof window === "undefined") return;
  whenReady(() => {
    const w = window as W;
    if (typeof w.gtag !== "function") return false;
    // send_page_view:false — o config inicial já mandou a page_view
    w.gtag("config", GA_ID, { user_id: userId, send_page_view: false });
    // Clarity faz hash do id no client; liga a gravação ao mesmo usuário
    if (typeof w.clarity === "function") w.clarity("identify", userId);
    return true;
  });
}
