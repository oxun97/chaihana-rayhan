import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyPassword } from "@/lib/password";
import { phoneVariants } from "@/lib/phone";

// Finds the active account of `role` whose password matches, under any
// spelling of the phone number — accounts made before numbers were
// normalised may be stored as "9001234567" or "79001234567", and the same
// person can even have one of each.
export async function findUserByPhoneAndPassword({ phone, password, role }) {
  const variants = phoneVariants(phone);
  if (!variants.length || !password) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("users")
    .select("id, phone, password_hash, role, is_active, name, telegram_chat_id")
    .in("phone", variants)
    .eq("role", role);
  if (error) throw error;
  return (data || []).find((u) => u.is_active && verifyPassword(password, u.password_hash)) || null;
}

export const COURIER_COOKIE = "courier_session";
export const CLIENT_COOKIE = "client_session";
const SESSION_DAYS = 30;

async function createSession({ userId, role, userAgent }) {
  const supabase = getSupabaseAdmin();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("sessions")
    .insert({ user_id: userId, role, expires_at: expiresAt, user_agent: userAgent || null })
    .select("id, expires_at")
    .single();
  if (error) throw error;
  return data;
}

// Looks up a session by its cookie token (the sessions.id uuid itself) for
// a given role, rejecting expired sessions or accounts disabled since the
// session was issued.
async function getSession(token, role) {
  if (!token) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sessions")
    .select("id, expires_at, users(id, name, phone, role, is_active, telegram_chat_id)")
    .eq("id", token)
    .eq("role", role)
    .maybeSingle();
  if (error || !data) return null;
  if (new Date(data.expires_at) < new Date()) return null;
  if (!data.users || data.users.role !== role || !data.users.is_active) return null;
  return { sessionId: data.id, user: data.users };
}

export async function createCourierSession({ userId, userAgent }) {
  return createSession({ userId, role: "courier", userAgent });
}

export async function getCourierSession(token) {
  const session = await getSession(token, "courier");
  return session ? { sessionId: session.sessionId, courier: session.user } : null;
}

export async function createClientSession({ userId, userAgent }) {
  return createSession({ userId, role: "client", userAgent });
}

export async function getClientSession(token) {
  const session = await getSession(token, "client");
  return session ? { sessionId: session.sessionId, client: session.user } : null;
}

export async function destroySession(token) {
  if (!token) return;
  const supabase = getSupabaseAdmin();
  await supabase.from("sessions").delete().eq("id", token);
}
