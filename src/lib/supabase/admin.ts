import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client com service role — IGNORA RLS. Exceção documentada ao
 * princípio "app nunca usa service role" (ver migration billing):
 * usado APENAS onde não existe usuário logado e a autenticação é
 * outra (webhook Stripe = assinatura HMAC; scripts de seed/cron =
 * ambiente confiável). Nunca importe em caminho com sessão de
 * usuário — lá o RLS é a fronteira.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY ausente no ambiente");
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
