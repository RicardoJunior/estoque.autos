"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isBillingInterval, isPlanId } from "@/lib/billing";
import {
  fieldErrorsFromZod,
  loginSchema,
  signupSchema,
} from "@/lib/validation";

export interface AuthFormState {
  error?: string;
  /**
   * Código estável do erro para o tracking (GA4 `error_type`): o client
   * nunca manda a mensagem em PT nem o e-mail para o analytics.
   */
  code?: string;
  fieldErrors?: Record<string, string>;
  /**
   * Valores digitados, devolvidos junto com o erro: o React 19 reseta o
   * form depois da action e apagaria o que o usuário já preencheu.
   * Nunca inclui senha.
   */
  values?: { name?: string; email?: string; phone?: string };
}

export async function signupAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = {
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    phone: String(formData.get("phone") || ""),
  };
  const parsed = signupSchema.safeParse({
    ...values,
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { code: "validation", fieldErrors: fieldErrorsFromZod(parsed.error), values };
  }

  // plano-primeiro: plano + intervalo escolhidos na landing acompanham
  // o fluxo inteiro (signup → confirmação → checkout)
  const planoRaw = String(formData.get("plano") || "");
  const plano = isPlanId(planoRaw) ? planoRaw : "basico";
  const intervaloRaw = String(formData.get("intervalo") || "");
  const intervalo = isBillingInterval(intervaloRaw) ? intervaloRaw : "mensal";
  const checkoutPath = `/cadastro/assinatura?plano=${plano}&intervalo=${intervalo}`;

  // convidado (ex.: /convite/{token}): pós-cadastro volta ao convite,
  // sem passar pelo checkout — a loja é de quem convidou
  const nextRaw = String(formData.get("next") || "");
  const inviteNext =
    nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : null;
  const afterAuthPath = inviteNext ?? checkoutPath;

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // plano/intervalo/invite_next no metadata: /auth/confirm e o código
      // de confirmação recuperam o destino sem estado na URL do e-mail
      // phone → trigger handle_new_user grava em profiles.phone no ato
      // do cadastro (o lead fica contatável mesmo sem confirmar o e-mail)
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        plano,
        intervalo,
        ...(inviteNext ? { invite_next: inviteNext } : {}),
      },
      emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(afterAuthPath)}`,
    },
  });

  if (error) {
    console.error("signupAction:", error.code, error.status, error.message);
    if (error.code === "user_already_exists" || error.status === 422) {
      return { code: "email_exists", error: "Já existe uma conta com este e-mail.", values };
    }
    if (error.code === "over_email_send_rate_limit" || error.status === 429) {
      return {
        code: "rate_limit",
        error:
          "Muitas tentativas no momento. Aguarde alguns minutos e tente de novo.",
        values,
      };
    }
    return {
      code: "unknown",
      error: "Não foi possível criar a conta. Tente novamente.",
      values,
    };
  }

  // Trigger handle_new_user cria o profile.
  // Com confirmação de e-mail desligada (dev), a sessão já vem ativa.
  // Com confirmação ligada (prod), session é null → checar o e-mail.
  if (data.session) {
    redirect(
      inviteNext ? afterAuthPath : `${checkoutPath}&via=direto`,
    );
  }
  // enviado=1: a tela de código inicia o cooldown de reenvio e dispara
  // sign_up_submitted; plano/intervalo seguem para o evento e para o
  // link "corrigir e-mail" (volta ao cadastro com o mesmo plano)
  const confirmParams = new URLSearchParams({
    email: parsed.data.email,
    plano,
    intervalo,
    enviado: "1",
  });
  if (inviteNext) confirmParams.set("next", inviteNext);
  redirect(`/cadastro/confirme?${confirmParams.toString()}`);
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const values = { email: String(formData.get("email") || "") };
  if (!parsed.success) {
    return { code: "validation", fieldErrors: fieldErrorsFromZod(parsed.error), values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        code: "email_not_confirmed",
        error:
          "Seu e-mail ainda não foi confirmado. Procure o link de confirmação na sua caixa de entrada.",
        values,
      };
    }
    if (error.code !== "invalid_credentials") {
      console.error("loginAction:", error.code, error.status, error.message);
    }
    return {
      code: error.code === "invalid_credentials" ? "invalid_credentials" : "unknown",
      error: "E-mail ou senha incorretos.",
      values,
    };
  }

  // só caminhos internos: bloqueia open redirect (ex.: //evil.com)
  const next = String(formData.get("next") || "/admin");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
  redirect(safeNext);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordResetAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState & { sent?: boolean; email?: string }> {
  const email = String(formData.get("email") || "").trim();
  if (!email.includes("@")) {
    return { fieldErrors: { email: "E-mail inválido" } };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/redefinir-senha`,
  });

  // Sempre responde "enviado" — não revela se o e-mail existe.
  return { sent: true, email };
}

/** Estado dos fluxos por código (OTP): guarda o e-mail entre as etapas. */
export interface CodeFormState extends AuthFormState {
  sent?: boolean;
  email?: string;
}

function parseCode(formData: FormData): string {
  return String(formData.get("code") || "").replace(/\D/g, "");
}

function safeInternalPath(raw: unknown, fallback: string): string {
  const path = String(raw || fallback);
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

/**
 * Login sem senha: envia e-mail com código de 6 dígitos + magic link.
 * Sempre responde "enviado" — não revela se o e-mail existe.
 */
export async function sendLoginCodeAction(
  _prev: CodeFormState,
  formData: FormData,
): Promise<CodeFormState> {
  const email = String(formData.get("email") || "").trim();
  if (!email.includes("@")) {
    return { code: "validation", fieldErrors: { email: "E-mail inválido" } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });

  if (error) {
    if (error.code === "over_email_send_rate_limit" || error.status === 429) {
      return {
        code: "rate_limit",
        error: "Muitas tentativas. Aguarde um minuto e tente de novo.",
        email,
      };
    }
    // "otp_disabled" = e-mail sem conta (shouldCreateUser: false) — segue
    // como enviado para não revelar quais e-mails têm cadastro.
    if (error.code !== "otp_disabled") {
      console.error("sendLoginCodeAction:", error.code, error.status, error.message);
    }
  }
  return { sent: true, email };
}

/** Confirma o código de 6 dígitos do login sem senha e entra. */
export async function verifyLoginCodeAction(
  _prev: CodeFormState,
  formData: FormData,
): Promise<CodeFormState> {
  const email = String(formData.get("email") || "").trim();
  const code = parseCode(formData);
  if (code.length !== 6) {
    return {
      sent: true,
      email,
      code: "code_format",
      fieldErrors: { code: "Digite o código de 6 dígitos" },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });
  if (error) {
    return {
      sent: true,
      email,
      code: "code_invalid",
      error: "Código inválido ou expirado. Peça um novo.",
    };
  }

  redirect(safeInternalPath(formData.get("next"), "/admin"));
}

/** Confirma o cadastro digitando o código do e-mail (funciona em qualquer aparelho). */
export async function verifySignupCodeAction(
  _prev: CodeFormState,
  formData: FormData,
): Promise<CodeFormState> {
  const email = String(formData.get("email") || "").trim();
  const code = parseCode(formData);
  if (code.length !== 6) {
    return {
      sent: true,
      email,
      code: "code_format",
      fieldErrors: { code: "Digite o código de 6 dígitos" },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "signup",
  });
  if (error) {
    return {
      sent: true,
      email,
      code: "code_invalid",
      error:
        "Código inválido ou expirado. Confira se usou o código mais recente ou peça um novo abaixo.",
    };
  }

  const meta = data.user?.user_metadata ?? {};
  const inviteNext =
    typeof meta.invite_next === "string" &&
    meta.invite_next.startsWith("/") &&
    !meta.invite_next.startsWith("//")
      ? meta.invite_next
      : null;
  if (inviteNext) redirect(inviteNext);
  const plano = isPlanId(meta.plano) ? meta.plano : "basico";
  const intervalo = isBillingInterval(meta.intervalo) ? meta.intervalo : "mensal";
  // via=codigo → a página dispara sign_up (GA4) com method=codigo
  redirect(`/cadastro/assinatura?plano=${plano}&intervalo=${intervalo}&via=codigo`);
}

/** Reenvia o e-mail de confirmação de cadastro. */
export async function resendConfirmationAction(
  _prev: CodeFormState,
  formData: FormData,
): Promise<CodeFormState> {
  const email = String(formData.get("email") || "").trim();
  if (!email.includes("@")) {
    return { code: "validation", fieldErrors: { email: "E-mail inválido" } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) {
    if (error.code === "over_email_send_rate_limit" || error.status === 429) {
      return { email, code: "rate_limit", error: "Aguarde um minuto antes de reenviar." };
    }
    console.error("resendConfirmationAction:", error.code, error.status, error.message);
    // e-mail já confirmado / sem cadastro: o Supabase não reenvia. Não
    // revela qual dos dois, mas o usuário precisa de um caminho.
    return {
      email,
      code: "unknown",
      error:
        "Não foi possível reenviar. Se você já confirmou este e-mail, entre pelo login.",
    };
  }
  return { sent: true, email };
}

/** Redefinição rápida: valida o código do e-mail de recuperação e leva à troca de senha. */
export async function verifyRecoveryCodeAction(
  _prev: CodeFormState,
  formData: FormData,
): Promise<CodeFormState> {
  const email = String(formData.get("email") || "").trim();
  const code = parseCode(formData);
  if (code.length !== 6) {
    return {
      sent: true,
      email,
      code: "code_format",
      fieldErrors: { code: "Digite o código de 6 dígitos" },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "recovery",
  });
  if (error) {
    return {
      sent: true,
      email,
      code: "code_invalid",
      error: "Código inválido ou expirado. Peça um novo.",
    };
  }

  redirect("/redefinir-senha");
}

export async function updatePasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = String(formData.get("password") || "");
  if (password.length < 8) {
    return { fieldErrors: { password: "Mínimo de 8 caracteres" } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "Link expirado ou inválido. Solicite um novo." };
  }
  redirect("/admin");
}
