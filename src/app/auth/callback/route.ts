import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Troca o `code` (links de confirmação de e-mail e de redefinição de
 * senha — fluxo PKCE do @supabase/ssr) por uma sessão e segue para `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/admin";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
