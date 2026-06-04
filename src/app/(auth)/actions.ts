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
  fieldErrors?: Record<string, string>;
}

export async function signupAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  // plano-primeiro: plano + intervalo escolhidos na landing acompanham
  // o fluxo inteiro (signup → confirmação → checkout)
  const planoRaw = String(formData.get("plano") || "");
  const plano = isPlanId(planoRaw) ? planoRaw : "basico";
  const intervaloRaw = String(formData.get("intervalo") || "");
  const intervalo = isBillingInterval(intervaloRaw) ? intervaloRaw : "mensal";
  const checkoutPath = `/cadastro/assinatura?plano=${plano}&intervalo=${intervalo}`;

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { name: parsed.data.name },
      emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(checkoutPath)}`,
    },
  });

  if (error) {
    if (error.code === "user_already_exists" || error.status === 422) {
      return { error: "Já existe uma conta com este e-mail." };
    }
    return { error: "Não foi possível criar a conta. Tente novamente." };
  }

  // Trigger handle_new_user cria o profile.
  // Com confirmação de e-mail desligada (dev), a sessão já vem ativa.
  // Com confirmação ligada (prod), session é null → checar o e-mail.
  if (data.session) {
    redirect(checkoutPath);
  }
  redirect("/cadastro/confirme?email=" + encodeURIComponent(parsed.data.email));
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "E-mail ou senha incorretos." };
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
): Promise<AuthFormState & { sent?: boolean }> {
  const email = String(formData.get("email") || "");
  if (!email.includes("@")) {
    return { fieldErrors: { email: "E-mail inválido" } };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/redefinir-senha`,
  });

  // Sempre responde "enviado" — não revela se o e-mail existe.
  return { sent: true };
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
