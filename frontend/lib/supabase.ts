import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project-id.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key-placeholder";

// Check if credentials have been updated from defaults
export const isSupabaseConfigured =
  supabaseUrl !== "https://your-project-id.supabase.co" &&
  supabaseAnonKey !== "your-anon-key-placeholder" &&
  Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Official Supabase Client
 * Used for free-tier Postgres database queries, Supabase Auth, and Supabase Image Storage.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
