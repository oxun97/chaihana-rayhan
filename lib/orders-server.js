import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { notifyNewOrder, notifyOrderStatus } from "@/lib/telegram";

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
export async function createOrder({
  customerName,
  customerPhone,
  method,
  address,
  comment,
  lang,
  items,
  clientId,
  promoCode,
  paymentMethod,
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("create_order", {
    p_customer_name: customerName,
    p_customer_phone: customerPhone,
    p_method: method,
    p_address: address || null,
    p_comment: comment || null,
    p_lang: lang,
    p_items: items.map((it) => ({ dish_id: it.id, qty: it.qty })),
    p_client_id: clientId || null,
    p_promo_code: promoCode || null,
    p_payment_method: paymentMethod || 'cash',
  });
  if (error) throw error;

  // Best-effort: a Telegram outage must never fail the checkout itself.
  try {
    const full = await getOrder(data.id);
    await notifyNewOrder(full, full.order_items);
  } catch (e) {
    console.error("Failed to send Telegram order notification:", e);
  }

  return data; // { id, order_number, subtotal, delivery_fee, discount, promo_code, total }
}

export async function listOrders({ status, courierId, clientId } = {}) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (courierId) query = query.eq("courier_id", courierId);
  if (clientId) query = query.eq("client_id", clientId);
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

  // Best-effort: the kitchen must never be blocked from advancing an order
  // because Telegram is down or the customer blocked the bot.
  try {
    await notifyOrderStatus(data);
  } catch (e) {
    console.error("Failed to notify the customer about the status change:", e);
  }

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

// Aggregate stats for the admin dashboard. Pulls orders (+ line items)
// from the last 30 days once and derives every metric from that single
// pass in JS — cheap enough at restaurant order volumes and avoids
// maintaining several near-duplicate SQL aggregate queries.
export async function getDashboardStats() {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, status, total, created_at, order_items(name_snapshot, qty)")
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: false });
  if (error) throw error;

  let ordersToday = 0;
  let revenueToday = 0;
  let ordersWeek = 0;
  let revenueWeek = 0;
  let nonCancelledWeek = 0;
  const activeStatusCounts = {};
  const dishQty = {};

  for (const o of orders) {
    const isCancelled = o.status === "cancelled";

    if (o.created_at >= startOfToday) {
      ordersToday += 1;
      if (!isCancelled) revenueToday += o.total;
    }
    if (o.created_at >= sevenDaysAgo) {
      ordersWeek += 1;
      if (!isCancelled) {
        revenueWeek += o.total;
        nonCancelledWeek += 1;
      }
    }
    if (o.status !== "delivered" && o.status !== "cancelled") {
      activeStatusCounts[o.status] = (activeStatusCounts[o.status] || 0) + 1;
    }
    for (const item of o.order_items || []) {
      dishQty[item.name_snapshot] = (dishQty[item.name_snapshot] || 0) + item.qty;
    }
  }

  const topDishes = Object.entries(dishQty)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => ({ name, qty }));

  return {
    ordersToday,
    revenueToday,
    ordersWeek,
    revenueWeek,
    avgOrderValue: nonCancelledWeek > 0 ? Math.round(revenueWeek / nonCancelledWeek) : 0,
    activeStatusCounts,
    topDishes,
  };
}

export { ORDER_STATUSES };
