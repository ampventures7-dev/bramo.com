import { createClient } from "@supabase/supabase-js";

/**
 * Server-Side Supabase Client (Service Role)
 *
 * IMPORTANT SECURITY RULES:
 * 1. This file must ONLY be imported in Server Components, API Route Handlers (/app/api/*), or Server Actions.
 * 2. It uses SUPABASE_SERVICE_ROLE_KEY which bypasses Row Level Security (RLS).
 * 3. NEVER prefix SUPABASE_SERVICE_ROLE_KEY with NEXT_PUBLIC_.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project-id.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const isServerSupabaseConfigured =
  Boolean(supabaseUrl && serviceRoleKey) &&
  supabaseUrl !== "https://your-project-id.supabase.co" &&
  serviceRoleKey !== "your-supabase-service-role-key";

export function createServerSupabaseClient() {
  if (typeof window !== "undefined") {
    throw new Error("CRITICAL SECURITY ERROR: createServerSupabaseClient must NEVER be called on the client side!");
  }

  return createClient(supabaseUrl, serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
