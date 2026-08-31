// ============================================================
// E-mail transacional via API REST do Resend — sem SDK: o Worker
// só precisa de fetch. A chave é lida em runtime dentro da função
// (mesmo padrão do webhook Stripe), nunca no escopo de módulo.
// Falha de envio NUNCA propaga: quem chama não pode quebrar por
// causa de notificação.
// ============================================================

import { formatPlanPrice, PLANS, type BillingInterval } from "./billing";
import { TEAM_ROLE_LABELS, type PlanId, type TeamRole } from "./types";

const FROM = "estoque.autos <noreply@estoque.autos>";

export interface LeadNotification {
  to: string;
  storeName: string;
  lead: {
    name: string;
    phone?: string | null;
    email?: string | null;
    message?: string | null;
    vehicleTitle?: string | null;
  };
  leadId: string;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Linha rótulo + valor no padrão visual dos e-mails de auth. */
function fieldRow(label: string, valueHtml: string): string {
  return `<tr>
    <td style="padding:0 40px 16px 40px;">
      <p style="margin:0 0 2px 0;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#7c828c;">${label}</p>
      <p style="margin:0;font-size:15px;line-height:1.6;color:#e6e8ec;">${valueHtml}</p>
    </td>
  </tr>`;
}

function leadEmailHtml({ storeName, lead, leadId }: Omit<LeadNotification, "to">): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.estoque.autos";
  const panelUrl = `${appUrl}/admin/leads/${leadId}`;
  const name = escapeHtml(lead.name);
  const phone = lead.phone?.trim();
  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;

  const rows: string[] = [];
  if (phone && telHref) {
    rows.push(
      fieldRow(
        "Telefone",
        `<a href="${telHref}" style="color:#ff9a4d;font-weight:700;text-decoration:none;">${escapeHtml(phone)}</a>`,
      ),
    );
  }
  if (lead.email) {
    rows.push(
      fieldRow(
        "E-mail",
        `<a href="mailto:${escapeHtml(lead.email)}" style="color:#ff9a4d;text-decoration:none;">${escapeHtml(lead.email)}</a>`,
      ),
    );
  }
  if (lead.vehicleTitle) {
    rows.push(fieldRow("Veículo de interesse", escapeHtml(lead.vehicleTitle)));
  }
  if (lead.message) {
    rows.push(
      fieldRow("Mensagem", escapeHtml(lead.message).replace(/\r?\n/g, "<br />")),
    );
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>Novo interessado — estoque.autos</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0a0b0d;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#0a0b0d;">
      ${name}${phone ? ` — ${escapeHtml(phone)}` : ""}. Veja os detalhes no painel.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0b0d;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="width:480px;max-width:100%;background-color:#101216;border:1px solid #1d2026;border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,system-ui,sans-serif;">
            <tr>
              <td style="padding:32px 40px 8px 40px;">
                <span style="display:inline-block;vertical-align:middle;width:28px;height:28px;background-color:#ff7a1a;border-radius:7px;text-align:center;line-height:28px;color:#160a02;font-weight:800;font-size:15px;">&#187;</span>
                <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:18px;font-weight:800;letter-spacing:-0.03em;color:#ffffff;">estoque<span style="color:#ff7a1a;">.autos</span></span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 0 40px;">
                <h1 style="margin:0 0 12px 0;font-size:24px;line-height:1.25;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">Novo interessado</h1>
                <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#a8adb7;">Chegou um contato pela vitrine da ${escapeHtml(storeName)}. Responda rápido — lead atendido na primeira hora converte muito mais.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 20px 40px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="background-color:#17130d;border:1px solid #3a2a17;border-radius:12px;padding:16px 20px;">
                      <span style="font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">${name}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${rows.join("\n")}
            <tr>
              <td style="padding:8px 40px 8px 40px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" bgcolor="#ff7a1a" style="border-radius:10px;">
                      <a href="${panelUrl}" target="_blank" style="display:block;padding:14px 24px;font-size:15px;font-weight:700;color:#160a02;text-decoration:none;border-radius:10px;">Ver no painel</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 40px 0 40px;">
                <hr style="border:0;border-top:1px solid #1d2026;margin:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px 32px 40px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7079;">Você recebeu este e-mail porque um visitante enviou uma proposta no site da ${escapeHtml(storeName)} no estoque.autos.</p>
                <p style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:#4f545d;">© estoque.autos · Plataforma de vitrines para revendas de veículos.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Notifica o lojista sobre um lead novo. Nunca lança: sem
 * RESEND_API_KEY ou com erro da API, apenas loga — a criação do
 * lead jamais pode falhar por causa do e-mail.
 */
export async function sendLeadNotificationEmail(
  input: LeadNotification,
): Promise<void> {
  try {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.error("RESEND_API_KEY ausente — e-mail de lead não enviado");
      return;
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: input.to,
        subject: `Novo interessado: ${input.lead.name}`,
        html: leadEmailHtml(input),
      }),
    });
    if (!res.ok) {
      console.error(`Resend ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.error("Falha ao enviar e-mail de lead:", err);
  }
}

// ============================================================
// Convite de equipe (multi-loja: owner/admin convida colaborador)
// ============================================================

export interface InviteEmail {
  to: string;
  /** nome da loja que está convidando */
  storeName: string;
  /** papel oferecido no convite */
  role: Exclude<TeamRole, "owner">;
  /** token do convite (monta o link /convite/{token}) */
  token: string;
}

function inviteEmailHtml({ storeName, role, token }: Omit<InviteEmail, "to">): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.estoque.autos";
  const inviteUrl = `${appUrl}/convite/${token}`;
  const store = escapeHtml(storeName);
  const roleLabel = escapeHtml(TEAM_ROLE_LABELS[role]);

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>Convite para a equipe — estoque.autos</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0a0b0d;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#0a0b0d;">
      Convite para fazer parte da equipe da ${store} no estoque.autos.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0b0d;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="width:480px;max-width:100%;background-color:#101216;border:1px solid #1d2026;border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,system-ui,sans-serif;">
            <tr>
              <td style="padding:32px 40px 8px 40px;">
                <span style="display:inline-block;vertical-align:middle;width:28px;height:28px;background-color:#ff7a1a;border-radius:7px;text-align:center;line-height:28px;color:#160a02;font-weight:800;font-size:15px;">&#187;</span>
                <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:18px;font-weight:800;letter-spacing:-0.03em;color:#ffffff;">estoque<span style="color:#ff7a1a;">.autos</span></span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 0 40px;">
                <h1 style="margin:0 0 12px 0;font-size:24px;line-height:1.25;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">Você foi convidado</h1>
                <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#a8adb7;">Você recebeu um convite para fazer parte da equipe da ${store} no estoque.autos. Aceite o convite para acessar o painel da loja.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 20px 40px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="background-color:#17130d;border:1px solid #3a2a17;border-radius:12px;padding:16px 20px;">
                      <span style="font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">${store}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${fieldRow("Seu papel na equipe", roleLabel)}
            <tr>
              <td style="padding:8px 40px 8px 40px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" bgcolor="#ff7a1a" style="border-radius:10px;">
                      <a href="${inviteUrl}" target="_blank" style="display:block;padding:14px 24px;font-size:15px;font-weight:700;color:#160a02;text-decoration:none;border-radius:10px;">Aceitar convite</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 40px 0 40px;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#7c828c;text-align:center;">Este convite é válido por 7 dias.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 40px 0 40px;">
                <hr style="border:0;border-top:1px solid #1d2026;margin:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px 32px 40px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7079;">Você recebeu este e-mail porque a ${store} convidou este endereço para a equipe dela no estoque.autos. Se você não esperava este convite, pode ignorar esta mensagem.</p>
                <p style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:#4f545d;">© estoque.autos · Plataforma de vitrines para revendas de veículos.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Envia o convite de equipe. Nunca lança: sem RESEND_API_KEY ou com
 * erro da API, apenas loga — o convite continua válido e o link pode
 * ser reenviado/copiado depois.
 */
export async function sendInviteEmail(input: InviteEmail): Promise<void> {
  try {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.error("RESEND_API_KEY ausente — e-mail de convite não enviado");
      return;
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: input.to,
        subject: `Você foi convidado para ${input.storeName}`,
        html: inviteEmailHtml(input),
      }),
    });
    if (!res.ok) {
      console.error(`Resend ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.error("Falha ao enviar e-mail de convite:", err);
  }
}

// ============================================================
// Recuperação de cadastro — quem começou a se cadastrar e parou
// no meio do funil (signup → confirmação → assinatura → loja).
//
// Um e-mail por ESTÁGIO, uma vez só na vida do usuário (a trava
// é a tabela signup_recovery_emails). Disparado em lote pelo
// scripts/recuperacao-cadastro.ts, nunca por um caminho com
// sessão de usuário.
// ============================================================

export const SIGNUP_RECOVERY_STAGES = [
  /** criou a conta e nunca confirmou o e-mail */
  "nao_confirmou",
  /** confirmou o e-mail e não assinou */
  "sem_assinatura",
  /** assinatura ativa e loja nunca criada (o mais grave: já paga) */
  "sem_loja",
] as const;

export type SignupRecoveryStage = (typeof SIGNUP_RECOVERY_STAGES)[number];

export function isSignupRecoveryStage(v: string): v is SignupRecoveryStage {
  return (SIGNUP_RECOVERY_STAGES as readonly string[]).includes(v);
}

export interface SignupRecoveryEmail {
  to: string;
  stage: SignupRecoveryStage;
  /** primeiro nome, se o cadastro trouxe (metadata/profile) */
  name?: string | null;
  /** plano/intervalo escolhidos na landing — o link do checkout os preserva */
  plan?: PlanId;
  interval?: BillingInterval;
  /**
   * Cupom de retomada. Por padrão só aparece nos estágios ANTES do
   * pagamento — oferecer desconto de primeira mensalidade a quem já
   * assinou (sem_loja) seria erro de leitura do funil. `force` ignora
   * essa regra (usado em envio manual/teste).
   */
  coupon?: { code: string; label: string; force?: boolean };
}

interface RecoveryCopy {
  subject: string;
  preheader: string;
  title: string;
  lead: string;
  /** destaque opcional dentro do card laranja */
  highlight?: string;
  cta: string;
  path: string;
  /** linha pequena logo abaixo do botão */
  note?: string;
}

/** O cupom vale para quem ainda não pagou. */
export function couponAppliesTo(stage: SignupRecoveryStage): boolean {
  return stage !== "sem_loja";
}

function recoveryCopy({
  stage,
  to,
  plan = "basico",
  interval = "mensal",
  coupon,
}: SignupRecoveryEmail): RecoveryCopy {
  const utm = `utm_source=email&utm_medium=recuperacao&utm_campaign=cadastro_${stage}`;
  const comCupom = coupon && (coupon.force || couponAppliesTo(stage));

  switch (stage) {
    case "nao_confirmou":
      return {
        subject: comCupom
          ? "Confirme seu e-mail e ganhe 50% no primeiro mês"
          : "Falta confirmar seu e-mail para ativar a conta",
        preheader: "Um clique e você continua de onde parou.",
        title: "Falta confirmar seu e-mail",
        lead: "Você começou a criar sua conta no estoque.autos e parou na confirmação — sem ela nada avança. Confirme o e-mail e você retoma exatamente de onde parou: escolher o plano, criar a loja e publicar os carros.",
        cta: "Confirmar meu e-mail",
        path: `/cadastro/confirme?email=${encodeURIComponent(to)}&${utm}`,
        note: "O link abre a página onde dá para reenviar o código, caso o primeiro e-mail já tenha expirado.",
      };

    case "sem_assinatura": {
      const info = PLANS[plan];
      return {
        subject: comCupom
          ? `${coupon!.code}: 50% no primeiro mês da sua loja`
          : "Sua loja está a um passo de ficar no ar",
        preheader: comCupom
          ? "Conta confirmada. Use o cupom e coloque a loja no ar."
          : "Conta confirmada. Falta escolher o plano.",
        title: "Sua loja está a um passo",
        lead: "Sua conta já está confirmada, mas a assinatura ficou pela metade. Escolhendo o plano, em poucos minutos sua revenda tem site próprio: vitrine com fotos, busca por marca e modelo, e botão de WhatsApp em cada carro.",
        highlight: `${info.name} — ${formatPlanPrice(info, interval)}`,
        cta: "Escolher meu plano",
        path: `/cadastro/assinatura?plano=${plan}&intervalo=${interval}&${utm}`,
        note: "Você continua com o plano que escolheu no site. Dá para trocar antes de pagar.",
      };
    }

    case "sem_loja":
      return {
        subject: "Sua assinatura está ativa — falta criar a loja",
        preheader: "Sua loja ainda não está no ar. São 3 passos.",
        title: "Falta criar sua loja",
        lead: "Sua assinatura está ativa, mas a loja nunca chegou a ser criada — ou seja, você já está pagando e ainda não tem nada no ar. São 3 passos: o endereço do seu site, as cores e a logo. Depois é só cadastrar os carros.",
        highlight: "Leva menos de 5 minutos",
        cta: "Criar minha loja",
        path: `/onboarding?${utm}`,
        note: "Travou em algum passo? Responda este e-mail que a gente resolve com você.",
      };
  }
}

function signupRecoveryEmailHtml(input: SignupRecoveryEmail): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://estoque.autos";
  const copy = recoveryCopy(input);
  const url = `${appUrl}${copy.path}`;
  const coupon =
    input.coupon && (input.coupon.force || couponAppliesTo(input.stage))
      ? input.coupon
      : null;
  const firstName = (input.name ?? "").trim().split(/\s+/)[0];
  const hello = firstName ? `${escapeHtml(firstName)}, ` : "";
  const lead = hello
    ? `${hello}${copy.lead.charAt(0).toLowerCase()}${copy.lead.slice(1)}`
    : copy.lead;

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>${escapeHtml(copy.title)} — estoque.autos</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0a0b0d;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#0a0b0d;">
      ${escapeHtml(copy.preheader)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0b0d;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="width:480px;max-width:100%;background-color:#101216;border:1px solid #1d2026;border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,system-ui,sans-serif;">
            <tr>
              <td style="padding:32px 40px 8px 40px;">
                <span style="display:inline-block;vertical-align:middle;width:28px;height:28px;background-color:#ff7a1a;border-radius:7px;text-align:center;line-height:28px;color:#160a02;font-weight:800;font-size:15px;">&#187;</span>
                <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:18px;font-weight:800;letter-spacing:-0.03em;color:#ffffff;">estoque<span style="color:#ff7a1a;">.autos</span></span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 0 40px;">
                <h1 style="margin:0 0 12px 0;font-size:24px;line-height:1.25;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">${escapeHtml(copy.title)}</h1>
                <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#a8adb7;">${escapeHtml(lead)}</p>
              </td>
            </tr>
            ${
              copy.highlight
                ? `<tr>
              <td style="padding:0 40px 20px 40px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="background-color:#17130d;border:1px solid #3a2a17;border-radius:12px;padding:16px 20px;">
                      <span style="font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">${escapeHtml(copy.highlight)}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`
                : ""
            }
            ${
              coupon
                ? `<tr>
              <td style="padding:0 40px 20px 40px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="border:1px dashed #ff7a1a;border-radius:12px;padding:18px 20px;background-color:#140d06;">
                      <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#7c828c;">Seu cupom</p>
                      <p style="margin:0 0 6px 0;font-size:26px;font-weight:800;letter-spacing:0.06em;color:#ff9a4d;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">${escapeHtml(coupon.code)}</p>
                      <p style="margin:0;font-size:14px;line-height:1.5;color:#e6e8ec;">${escapeHtml(coupon.label)}</p>
                      <p style="margin:8px 0 0 0;font-size:12px;line-height:1.5;color:#7c828c;">Digite o código no campo de cupom da tela de pagamento.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding:8px 40px 8px 40px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" bgcolor="#ff7a1a" style="border-radius:10px;">
                      <a href="${escapeHtml(url)}" target="_blank" style="display:block;padding:14px 24px;font-size:15px;font-weight:700;color:#160a02;text-decoration:none;border-radius:10px;">${escapeHtml(copy.cta)}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${
              copy.note
                ? `<tr>
              <td style="padding:16px 40px 0 40px;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#7c828c;text-align:center;">${escapeHtml(copy.note)}</p>
              </td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding:28px 40px 0 40px;">
                <hr style="border:0;border-top:1px solid #1d2026;margin:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px 32px 40px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7079;">Você recebeu este e-mail porque criou uma conta no estoque.autos com este endereço e o cadastro ficou pela metade. É um aviso único — se não quiser continuar, basta ignorar que não mandamos de novo.</p>
                <p style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:#4f545d;">© estoque.autos · Plataforma de vitrines para revendas de veículos.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Só monta o HTML — usado pelo `--preview` do script de recuperação. */
export function previewSignupRecoveryEmail(input: SignupRecoveryEmail): {
  subject: string;
  html: string;
} {
  return {
    subject: recoveryCopy(input).subject,
    html: signupRecoveryEmailHtml(input),
  };
}

/**
 * Envia o e-mail de recuperação de cadastro. Diferente dos envios
 * transacionais acima, DEVOLVE o resultado: quem chama roda em lote e
 * precisa saber o que gravar na trava (só grava o que o Resend aceitou)
 * e o que reportar como falha. Continua sem lançar — uma recusa de um
 * endereço não pode derrubar a rodada inteira.
 */
export async function sendSignupRecoveryEmail(
  input: SignupRecoveryEmail,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY ausente" };

  const { subject, html } = previewSignupRecoveryEmail(input);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        reply_to: "contato@estoque.autos",
        to: input.to,
        subject,
        html,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
    };
    if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${body.message ?? ""}` };
    return { ok: true, id: body.id };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
