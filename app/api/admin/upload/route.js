import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function slugify(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "photo";
}

export async function POST(request) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Некорректная загрузка." }, { status: 400 });
  }

  const file = form.get("file");
  const target = form.get("target"); // "dish" | "category"
  const categoryId = slugify(form.get("categoryId"));
  const itemId = slugify(form.get("itemId"));

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Файл не найден." }, { status: 400 });
  }
  if (!ALLOWED_TYPES[file.type]) {
    return NextResponse.json(
      { error: "Разрешены только изображения JPG, PNG или WebP." },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Файл больше 8 МБ." }, { status: 400 });
  }
  if (!categoryId) {
    return NextResponse.json({ error: "Не указана категория." }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  let relPath;
  if (target === "category") {
    relPath = path.posix.join("images", "categories", `${categoryId}.${ext}`);
  } else {
    if (!itemId) {
      return NextResponse.json({ error: "Не указано блюдо." }, { status: 400 });
    }
    relPath = path.posix.join("images", "dishes", categoryId, `${itemId}.${ext}`);
  }

  const destPath = path.join(PUBLIC_DIR, relPath);
  if (!destPath.startsWith(PUBLIC_DIR)) {
    return NextResponse.json({ error: "Некорректный путь." }, { status: 400 });
  }

  try {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
  } catch (e) {
    return NextResponse.json({ error: "Не удалось сохранить файл на сервере." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, path: relPath, url: `/${relPath}?v=${Date.now()}` });
}
