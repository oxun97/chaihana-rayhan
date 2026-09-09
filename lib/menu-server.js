import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const PUBLIC_DIR = path.join(process.cwd(), "public");

// Resolves a menu-relative image path (e.g. "images/dishes/salaty/1.jpg") to
// a public URL only if the file actually exists on disk — lets components
// fall back to a decorative placeholder until a real photo is uploaded.
function resolveImage(relPath) {
  if (!relPath) return null;
  const abs = path.join(PUBLIC_DIR, relPath);
  if (!abs.startsWith(PUBLIC_DIR)) return null; // guard against ../ escapes
  return fs.existsSync(abs) ? `/${relPath.replace(/^\/+/, "")}` : null;
}

let supabaseAdmin = null;
function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Menu database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
      );
    }
    supabaseAdmin = createClient(url, key, { auth: { persistSession: false } });
  }
  return supabaseAdmin;
}

function rowToItem(d) {
  return {
    id: d.id,
    name: { ru: d.name_ru || "", en: d.name_en || "", uz: d.name_uz || "", tg: d.name_tg || "" },
    desc: { ru: d.desc_ru || "", en: d.desc_en || "", uz: d.desc_uz || "", tg: d.desc_tg || "" },
    price: d.price,
    weight: d.weight || "",
    icons: d.icons || [],
    img: d.img || "",
    imgSrc: resolveImage(d.img),
  };
}

function rowToCategory(cat, dishRows) {
  return {
    id: cat.id,
    title: {
      ru: cat.title_ru || "",
      en: cat.title_en || "",
      uz: cat.title_uz || "",
      tg: cat.title_tg || "",
    },
    image: cat.image || "",
    imageSrc: resolveImage(cat.image),
    items: dishRows.filter((d) => d.category_id === cat.id).map(rowToItem),
  };
}

// Reads the full menu (categories + dishes) from Postgres, shaped as an
// array of categories with nested items so the rest of the app (Nav,
// DishCard, CartContext, the admin UI, ...) stays storage-agnostic.
export async function readMenuCategories() {
  const supabase = getSupabaseAdmin();
  const [{ data: categories, error: catErr }, { data: dishes, error: dishErr }] =
    await Promise.all([
      supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      supabase.from("dishes").select("*").order("sort_order", { ascending: true }),
    ]);
  if (catErr) throw catErr;
  if (dishErr) throw dishErr;

  return categories.map((cat) => rowToCategory(cat, dishes));
}

// Persists the full category/item tree the admin panel edited. Behaves like
// the old "overwrite the whole file" semantics: anything no longer present
// in `categories` is deleted, everything else is upserted.
export async function writeMenuCategories(categories) {
  const supabase = getSupabaseAdmin();

  const categoryRows = categories.map((cat, i) => ({
    id: cat.id,
    title_ru: cat.title?.ru || "",
    title_en: cat.title?.en || "",
    title_uz: cat.title?.uz || "",
    title_tg: cat.title?.tg || "",
    image: cat.image || null,
    sort_order: i,
  }));

  const dishRows = [];
  categories.forEach((cat) => {
    (cat.items || []).forEach((item, i) => {
      dishRows.push({
        id: item.id,
        category_id: cat.id,
        name_ru: item.name?.ru || "",
        name_en: item.name?.en || "",
        name_uz: item.name?.uz || "",
        name_tg: item.name?.tg || "",
        desc_ru: item.desc?.ru || "",
        desc_en: item.desc?.en || "",
        desc_uz: item.desc?.uz || "",
        desc_tg: item.desc?.tg || "",
        price: Math.round(item.price) || 0,
        weight: item.weight || null,
        icons: item.icons || [],
        img: item.img || null,
        sort_order: i,
      });
    });
  });

  const [{ data: existingCats, error: exCatErr }, { data: existingDishes, error: exDishErr }] =
    await Promise.all([
      supabase.from("categories").select("id"),
      supabase.from("dishes").select("id"),
    ]);
  if (exCatErr) throw exCatErr;
  if (exDishErr) throw exDishErr;

  const newCatIds = new Set(categoryRows.map((c) => c.id));
  const newDishIds = new Set(dishRows.map((d) => d.id));
  const removedCatIds = existingCats.map((c) => c.id).filter((id) => !newCatIds.has(id));
  const removedDishIds = existingDishes.map((d) => d.id).filter((id) => !newDishIds.has(id));

  // Delete dishes before their categories, to satisfy the foreign key.
  if (removedDishIds.length) {
    const { error } = await supabase.from("dishes").delete().in("id", removedDishIds);
    if (error) throw error;
  }
  if (removedCatIds.length) {
    const { error } = await supabase.from("dishes").delete().in("category_id", removedCatIds);
    if (error) throw error;
    const { error: catDelErr } = await supabase.from("categories").delete().in("id", removedCatIds);
    if (catDelErr) throw catDelErr;
  }

  if (categoryRows.length) {
    const { error } = await supabase.from("categories").upsert(categoryRows, { onConflict: "id" });
    if (error) throw error;
  }
  if (dishRows.length) {
    const { error } = await supabase.from("dishes").upsert(dishRows, { onConflict: "id" });
    if (error) throw error;
  }
}
