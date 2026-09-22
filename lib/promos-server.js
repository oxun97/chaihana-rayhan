import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Promo tiles for the storefront, shaped like the rest of the menu data
// (localised objects) so components stay language-agnostic.
export async function readPromos() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("promos")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;

  return data.map((p) => ({
    id: p.id,
    tone: p.tone,
    title: { ru: p.title_ru, uz: p.title_uz },
    body: { ru: p.body_ru, uz: p.body_uz },
    action: p.action_ru ? { ru: p.action_ru, uz: p.action_uz || p.action_ru } : null,
    target: p.target,
  }));
}

export async function listPromosForAdmin() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("promos")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data;
}

export async function savePromos(promos) {
  const supabase = getSupabaseAdmin();

  const rows = promos.map((p, i) => ({
    id: p.id,
    tone: p.tone || "red",
    title_ru: p.title_ru || "",
    title_uz: p.title_uz || "",
    body_ru: p.body_ru || "",
    body_uz: p.body_uz || "",
    action_ru: p.action_ru || null,
    action_uz: p.action_uz || null,
    target: p.target || null,
    sort_order: i,
    is_active: p.is_active !== false,
  }));

  const { data: existing, error: exErr } = await supabase.from("promos").select("id");
  if (exErr) throw exErr;

  const keep = new Set(rows.map((r) => r.id));
  const removed = existing.map((r) => r.id).filter((id) => !keep.has(id));
  if (removed.length) {
    const { error } = await supabase.from("promos").delete().in("id", removed);
    if (error) throw error;
  }
  if (rows.length) {
    const { error } = await supabase.from("promos").upsert(rows, { onConflict: "id" });
    if (error) throw error;
  }
}

export async function listPromoCodes() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function upsertPromoCode({
  code,
  kind,
  value,
  minSubtotal,
  maxUses,
  expiresAt,
  isActive,
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("promo_codes")
    .upsert(
      {
        code: String(code || "").trim().toUpperCase(),
        kind,
        value: Math.round(value),
        min_subtotal: Math.max(0, Math.round(minSubtotal || 0)),
        max_uses: maxUses ? Math.round(maxUses) : null,
        expires_at: expiresAt || null,
        is_active: isActive !== false,
      },
      { onConflict: "code" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePromoCode(code) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("promo_codes").delete().eq("code", code);
  if (error) throw error;
}

// Delegates to the promo_discount() Postgres function — the same one
// create_order() calls — so the checkout preview and the stored order can
// never price a code differently.
export async function validatePromoCode({ code, subtotal }) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("promo_discount", {
    p_code: code,
    p_subtotal: Math.max(0, Math.round(subtotal || 0)),
  });
  if (error) throw error;
  return data;
}
