import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isBillingInterval, isPlanId } from "@/lib/billing";

/**
 * Verifica links de e-mail no padrão token_hash ({{ .TokenHash }} nos
 * templates). Ao contrário do fluxo PKCE (/auth/callback), funciona em
 * qualquer navegador/dispositivo — o e-mail pode ser aberto no celular
 * mesmo que o cadastro tenha sido feito no desktop.
 */
const OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const typeRaw = searchParams.get("type");
  const type = OTP_TYPES.includes(typeRaw as EmailOtpType)
    ? (typeRaw as EmailOtpType)
    : null;
  const next = searchParams.get("next") ?? "";
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : null;

  if (tokenHash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/redefinir-senha`);
      }
      if (type === "signup" || type === "invite") {
        // plano/intervalo/invite_next viajam no user_metadata
        // (ver signupAction) — nada de estado na URL do e-mail.
        const meta = data.user?.user_metadata ?? {};
        if (
          typeof meta.invite_next === "string" &&
          meta.invite_next.startsWith("/") &&
          !meta.invite_next.startsWith("//")
        ) {
          return NextResponse.redirect(`${origin}${meta.invite_next}`);
        }
        const plano = isPlanId(meta.plano) ? meta.plano : "basico";
        const intervalo = isBillingInterval(meta.intervalo)
          ? meta.intervalo
          : "mensal";
        // via=link → a página dispara sign_up (GA4) com method=link
        return NextResponse.redirect(
          `${origin}/cadastro/assinatura?plano=${plano}&intervalo=${intervalo}&via=link`,
        );
      }
      return NextResponse.redirect(`${origin}${safeNext ?? "/admin"}`);
    }
    console.error("auth/confirm:", error.code, error.status, error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
