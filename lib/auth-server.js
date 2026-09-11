import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const COURIER_COOKIE = "courier_session";
const SESSION_DAYS = 30;

export async function createCourierSession({ userId, userAgent }) {
  const supabase = getSupabaseAdmin();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("sessions")
    .insert({ user_id: userId, role: "courier", expires_at: expiresAt, user_agent: userAgent || null })
    .select("id, expires_at")
    .single();
  if (error) throw error;
  return data;
}

// Looks up a courier session by its cookie token (the sessions.id uuid
// itself), rejecting expired sessions or accounts that were disabled after
// the session was issued.
export async function getCourierSession(token) {
  if (!token) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sessions")
    .select("id, expires_at, users(id, name, phone, role, is_active)")
    .eq("id", token)
    .eq("role", "courier")
    .maybeSingle();
  if (error || !data) return null;
  if (new Date(data.expires_at) < new Date()) return null;
  if (!data.users || data.users.role !== "courier" || !data.users.is_active) return null;
  return { sessionId: data.id, courier: data.users };
}

export async function destroySession(token) {
  if (!token) return;
  const supabase = getSupabaseAdmin();
  await supabase.from("sessions").delete().eq("id", token);
}
