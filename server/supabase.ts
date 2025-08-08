// server/supabase.ts
import { createClient } from "@supabase/supabase-js";

// Narrow the env accessor so TS knows we return a string
const need = (k: keyof NodeJS.ProcessEnv): string => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env ${k}`);
  return v;
};

export const supabaseAdmin = createClient(
  need("SUPABASE_URL"),
  need("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);

// Client scoped to a user access token (never use service role here)
export function supabaseFromToken(accessToken: string) {
  return createClient(
    need("SUPABASE_URL"),
    need("SUPABASE_ANON_KEY"), // <- use anon key here
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    }
  );
}
