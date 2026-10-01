import { getSupabaseAdmin } from "@/lib/supabase-admin";

export function clientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Records an attempt against `key` and says whether it may proceed (see
// rl_hit() in Postgres). Fails open: if the limiter itself is unreachable,
// guests can still log in — it is a brake on guessing, not a gate.
export async function allowAttempt(key, max, windowSeconds) {
  const { data, error } = await getSupabaseAdmin().rpc("rl_hit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("Rate limiter unavailable:", error);
    return true;
  }
  return data !== false;
}

export const TOO_MANY_ATTEMPTS = "Слишком много попыток. Попробуйте через 15 минут.";
