import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getBrowserEnv } from "@/lib/supabase/env";

export function createSupabaseBrowserClient(): SupabaseClient {
  const env = getBrowserEnv();
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

