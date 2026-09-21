import { localized } from "@/lib/menu";

// Restaurant's public WhatsApp/contact number (already published on the original site).
export const RESTAURANT_PHONE_DISPLAY = "+7 (901) 516-57-89";
export const RESTAURANT_PHONE_WA = "79015165789";
export const RESTAURANT_PHONE_TEL = "+79015165789";

const LABELS = {
  ru: {
    header: "Новый заказ — Чайхана Райхан",
    orderNumber: "Заказ №",
    name: "Имя",
    phone: "Телефон",
    method: "Способ получения",
    delivery: "Доставка",
    pickup: "Самовывоз",
    address: "Адрес",
    comment: "Комментарий",
    items: "Состав заказа",
    subtotal: "Сумма",
    deliveryFee: "Доставка",
    total: "Итого",
    free: "бесплатно",
  },
  uz: {
    header: "Yangi buyurtma — Choyxona Rayhon",
    orderNumber: "Buyurtma №",
    name: "Ism",
    phone: "Telefon",
    method: "Olish usuli",
    delivery: "Yetkazib berish",
    pickup: "Olib ketish",
    address: "Manzil",
    comment: "Izoh",
    items: "Buyurtma tarkibi",
    subtotal: "Summa",
    deliveryFee: "Yetkazib berish",
    total: "Jami",
    free: "bepul",
  },
};

/**
 * Build a WhatsApp deep link (wa.me) pre-filled with the order summary.
 */
export function buildWhatsAppOrderUrl({
  lang,
  customer,
  items,
  subtotal,
  deliveryFee,
  total,
  orderNumber,
}) {
  const L = LABELS[lang] || LABELS.ru;
  const lines = [];

  lines.push(`*${L.header}*`);
  if (orderNumber) {
    lines.push(`${L.orderNumber}${orderNumber}`);
  }
  lines.push("");
  lines.push(`${L.name}: ${customer.name}`);
  lines.push(`${L.phone}: ${customer.phone}`);
  lines.push(`${L.method}: ${customer.method === "pickup" ? L.pickup : L.delivery}`);
  if (customer.method !== "pickup" && customer.address) {
    lines.push(`${L.address}: ${customer.address}`);
  }
  if (customer.comment) {
    lines.push(`${L.comment}: ${customer.comment}`);
  }
  lines.push("");
  lines.push(`*${L.items}:*`);
  items.forEach((it) => {
    const name = localized(it.name, lang);
    lines.push(`• ${name} x${it.qty} — ${it.price * it.qty} ₽`);
  });
  lines.push("");
  lines.push(`${L.subtotal}: ${subtotal} ₽`);
  lines.push(`${L.deliveryFee}: ${deliveryFee === 0 ? L.free : deliveryFee + " ₽"}`);
  lines.push(`*${L.total}: ${total} ₽*`);

  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${RESTAURANT_PHONE_WA}?text=${text}`;
}
