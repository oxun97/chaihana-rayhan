import { NextResponse } from "next/server";
import { readMenuCategories, writeMenuCategories } from "@/lib/menu-server";

// Never cache: this endpoint always reflects the current contents of
// data/menu.json, which the admin panel edits directly on disk.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = readMenuCategories();
    return NextResponse.json({ categories });
  } catch (e) {
    return NextResponse.json({ error: "Не удалось прочитать меню." }, { status: 500 });
  }
}

function validateCategories(categories) {
  if (!Array.isArray(categories)) return "Меню должно быть списком категорий.";

  const seenCatIds = new Set();
  for (const cat of categories) {
    if (!cat || typeof cat !== "object") return "Некорректная категория.";
    if (!cat.id || typeof cat.id !== "string") return "У категории отсутствует id.";
    if (seenCatIds.has(cat.id)) return `Повторяющийся id категории: "${cat.id}".`;
    seenCatIds.add(cat.id);
    if (!cat.title || typeof cat.title.ru !== "string" || !cat.title.ru.trim()) {
      return `У категории "${cat.id}" не заполнено название (ru).`;
    }
    if (!Array.isArray(cat.items)) return `У категории "${cat.id}" некорректный список блюд.`;

    const seenItemIds = new Set();
    for (const item of cat.items) {
      if (!item || typeof item !== "object") return "Некорректное блюдо.";
      if (!item.id || typeof item.id !== "string") return "У блюда отсутствует id.";
      if (seenItemIds.has(item.id)) return `Повторяющийся id блюда: "${item.id}".`;
      seenItemIds.add(item.id);
      if (!item.name || typeof item.name.ru !== "string" || !item.name.ru.trim()) {
        return `У блюда "${item.id}" не заполнено название (ru).`;
      }
      if (typeof item.price !== "number" || Number.isNaN(item.price) || item.price < 0) {
        return `Некорректная цена у блюда "${localizedName(item)}".`;
      }
    }
  }
  return null;
}

function localizedName(item) {
  return item?.name?.ru || item?.id || "?";
}

export async function PUT(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный формат данных." }, { status: 400 });
  }

  const categories = body?.categories;
  const validationError = validateCategories(categories);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    writeMenuCategories(categories);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Не удалось сохранить меню на сервере." }, { status: 500 });
  }
}
