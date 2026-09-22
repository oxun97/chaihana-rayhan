import { NextResponse } from "next/server";
import {
  listPromosForAdmin,
  savePromos,
  listPromoCodes,
  upsertPromoCode,
  deletePromoCode,
} from "@/lib/promos-server";

// Gated by middleware.js (Basic Auth on /api/admin/:path*).
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [promos, codes] = await Promise.all([listPromosForAdmin(), listPromoCodes()]);
    return NextResponse.json({ promos, codes });
  } catch (e) {
    console.error("Failed to load promos:", e);
    return NextResponse.json({ error: "Не удалось загрузить акции." }, { status: 500 });
  }
}

export async function PUT(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный формат данных." }, { status: 400 });
  }
  if (!Array.isArray(body?.promos)) {
    return NextResponse.json({ error: "Ожидался список акций." }, { status: 400 });
  }
  for (const p of body.promos) {
    if (!p?.id?.trim()) return NextResponse.json({ error: "У акции пустой id." }, { status: 400 });
    if (!p?.title_ru?.trim()) {
      return NextResponse.json({ error: "У акции пустой заголовок." }, { status: 400 });
    }
  }

  try {
    await savePromos(body.promos);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Failed to save promos:", e);
    return NextResponse.json({ error: "Не удалось сохранить акции." }, { status: 500 });
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный формат данных." }, { status: 400 });
  }

  const code = String(body?.code || "").trim();
  if (!code) return NextResponse.json({ error: "Укажите промокод." }, { status: 400 });
  if (!["percent", "fixed"].includes(body?.kind)) {
    return NextResponse.json({ error: "Выберите тип скидки." }, { status: 400 });
  }
  const value = Number(body?.value);
  if (!Number.isFinite(value) || value <= 0) {
    return NextResponse.json({ error: "Размер скидки должен быть больше нуля." }, { status: 400 });
  }
  if (body.kind === "percent" && value > 100) {
    return NextResponse.json({ error: "Процент не может превышать 100." }, { status: 400 });
  }

  try {
    const saved = await upsertPromoCode({
      code,
      kind: body.kind,
      value,
      minSubtotal: Number(body?.minSubtotal) || 0,
      maxUses: Number(body?.maxUses) || null,
      expiresAt: body?.expiresAt || null,
      isActive: body?.isActive !== false,
    });
    return NextResponse.json({ ok: true, code: saved });
  } catch (e) {
    console.error("Failed to save a promo code:", e);
    return NextResponse.json({ error: "Не удалось сохранить промокод." }, { status: 500 });
  }
}

export async function DELETE(request) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Не указан промокод." }, { status: 400 });
  try {
    await deletePromoCode(code);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Не удалось удалить промокод." }, { status: 500 });
  }
}
