import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminEnv } from "@/lib/supabase/env";

export function createSupabaseAdminClient(): SupabaseClient {
  const env = getAdminEnv();

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}

/** Si `SUPABASE_SECRET_KEY` / `APP_URL` manquent (ex. dev), retourne null. */
export function tryCreateSupabaseAdminClient(): SupabaseClient | null {
  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}