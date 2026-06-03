import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (ex-middleware no Next <16): mantém a sessão Supabase viva
 * (refresh de token via cookies) e protege as rotas do admin.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: não remover — getClaims() valida/renova a sessão.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const { pathname } = request.nextUrl;
  const isAdminRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/onboarding");
  const isAuthRoute = pathname === "/login" || pathname === "/cadastro";

  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Tudo exceto assets estáticos e otimização de imagem
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3)$).*)",
  ],
};
