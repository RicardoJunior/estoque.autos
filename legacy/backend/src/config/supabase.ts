import { createClient } from '@supabase/supabase-js';
import { config } from './index';

// Client for admin operations (bypasses RLS)
export const supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Factory function to create client with user JWT (respects RLS)
export const createSupabaseClient = (accessToken: string) => {
  return createClient(config.supabase.url, config.supabase.anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};
