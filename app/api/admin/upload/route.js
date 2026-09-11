import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const MENU_IMAGES_BUCKET = "menu-images";
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function slugify(text) {
  return (
    (text || "")
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "photo"
  );
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
  // Cache-bust the object key itself (rather than relying on a "?v=" query
  // string) so the CDN in front of Supabase Storage never serves a stale
  // cached image after a re-upload.
  const stamp = Date.now().toString(36);
  let objectKey;
  if (target === "category") {
    objectKey = `categories/${categoryId}-${stamp}.${ext}`;
  } else {
    if (!itemId) {
      return NextResponse.json({ error: "Не указано блюдо." }, { status: 400 });
    }
    objectKey = `dishes/${categoryId}/${itemId}-${stamp}.${ext}`;
  }

  try {
    const supabase = getSupabaseAdmin();
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(MENU_IMAGES_BUCKET)
      .upload(objectKey, buffer, { contentType: file.type, upsert: true });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(MENU_IMAGES_BUCKET).getPublicUrl(objectKey);
    return NextResponse.json({ ok: true, path: objectKey, url: data.publicUrl });
  } catch (e) {
    return NextResponse.json({ error: "Не удалось сохранить файл на сервере." }, { status: 500 });
  }
}
