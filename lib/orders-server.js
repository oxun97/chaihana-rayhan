import { getSupabaseAdmin } from "@/lib/supabase-admin";

const ORDER_STATUSES = [
  "new",
  "confirmed",
  "preparing",
  "ready",
  "on_delivery",
  "delivered",
  "cancelled",
];

// Creates an order + its line items atomically via the create_order()
// Postgres function, which re-prices every line from the live `dishes`
// table — client-submitted prices are never trusted.
export async function createOrder({ customerName, customerPhone, method, address, comment, lang, items }) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("create_order", {
    p_customer_name: customerName,
    p_customer_phone: customerPhone,
    p_method: method,
    p_address: address || null,
    p_comment: comment || null,
    p_lang: lang,
    p_items: items.map((it) => ({ dish_id: it.id, qty: it.qty })),
  });
  if (error) throw error;
  return data; // { id, order_number, subtotal, delivery_fee, total }
}

export async function listOrders({ status, courierId } = {}) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (courierId) query = query.eq("courier_id", courierId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// A courier's board: orders ready for pickup that nobody has claimed yet,
// plus whatever this courier currently has out for delivery.
export async function listCourierOrders(courierId) {
  const supabase = getSupabaseAdmin();
  const [{ data: available, error: availErr }, { data: mine, error: mineErr }] = await Promise.all([
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("status", "ready")
      .is("courier_id", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("courier_id", courierId)
      .eq("status", "on_delivery")
      .order("created_at", { ascending: true }),
  ]);
  if (availErr) throw availErr;
  if (mineErr) throw mineErr;
  return { available, mine };
}

export async function getOrder(id) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

// Which statuses a given role may move an order into, keyed by current
// status. Mirrors the kitchen -> courier handoff: admin runs the kitchen
// pipeline (new..ready) and can cancel at any point; couriers only pick up
// a ready order and mark it delivered.
const ADMIN_TRANSITIONS = {
  new: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["cancelled"],
  on_delivery: ["cancelled"],
};
const COURIER_TRANSITIONS = {
  ready: ["on_delivery"],
  on_delivery: ["delivered"],
};

export async function updateOrderStatus({ id, status, role, courierId }) {
  if (!ORDER_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }
  const supabase = getSupabaseAdmin();
  const current = await getOrder(id);

  const allowed = role === "courier" ? COURIER_TRANSITIONS : ADMIN_TRANSITIONS;
  const next = allowed[current.status] || [];
  if (!next.includes(status)) {
    throw new Error(`Cannot move order from "${current.status}" to "${status}"`);
  }

  const patch = { status, updated_at: new Date().toISOString() };
  if (role === "courier") {
    if (current.status === "ready" && status === "on_delivery") {
      // Claiming an unassigned order, or re-confirming one's own claim.
      if (current.courier_id && current.courier_id !== courierId) {
        throw new Error("This order is already taken by another courier");
      }
      patch.courier_id = courierId;
    } else if (current.courier_id !== courierId) {
      throw new Error("This order is not assigned to you");
    }
  }

  const { data, error } = await supabase.from("orders").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function assignCourier({ id, courierId }) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .update({ courier_id: courierId, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export { ORDER_STATUSES };
