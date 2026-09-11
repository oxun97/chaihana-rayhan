import { createClient } from "@supabase/supabase-js";

// Shared server-only Supabase client using the service_role key. Used by
// menu-server.js, orders-server.js and the admin upload route — never
// import this from a client component or expose the key to the browser.
let supabaseAdmin = null;

export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
      );
    }
    supabaseAdmin = createClient(url, key, { auth: { persistSession: false } });
  }
  return supabaseAdmin;
}
