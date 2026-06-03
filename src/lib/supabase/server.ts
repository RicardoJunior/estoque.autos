import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase para Server Components, Server Actions e Route Handlers.
 * Usa a sessão do usuário (cookies) — todas as queries passam pelo RLS.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado de um Server Component (sem permissão de escrever
            // cookies) — ok, o proxy.ts cuida do refresh da sessão.
          }
        },
      },
    },
  );
}

/**
 * Client anônimo sem cookies — para o site público (SSR de /{slug}).
 * Enxerga apenas o que as policies de anon permitem.
 */
export function createAnonClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );
}
