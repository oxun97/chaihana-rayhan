import { getSupabaseAdmin } from "@/lib/supabase-admin";

const MENU_IMAGES_BUCKET = "menu-images";

// `img` on a category/dish row is the storage object key (e.g.
// "dishes/salaty/1-abc123.jpg"), not a local path — resolve it to the
// bucket's public URL. Falls back to a decorative placeholder in the UI
// until a real photo is uploaded (see DishCard/MenuSection).
function resolveImage(objectKey) {
  if (!objectKey) return null;
  const { data } = getSupabaseAdmin()
    .storage.from(MENU_IMAGES_BUCKET)
    .getPublicUrl(objectKey);
  return data?.publicUrl || null;
}

function rowToItem(d) {
  return {
    id: d.id,
    name: { ru: d.name_ru || "", uz: d.name_uz || "" },
    desc: { ru: d.desc_ru || "", uz: d.desc_uz || "" },
    price: d.price,
    weight: d.weight || "",
    icons: d.icons || [],
    img: d.img || "",
    imgSrc: resolveImage(d.img),
    featured: !!d.featured,
  };
}

function rowToCategory(cat, dishRows) {
  return {
    id: cat.id,
    title: {
      ru: cat.title_ru || "",
      uz: cat.title_uz || "",
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

// Flattens the dishes marked `featured` in the admin panel across all
// categories, for the homepage "Popular dishes" section. Returns [] until
// at least one dish has been marked — no fake/curated content is shown.
export function getFeaturedDishes(categories, limit = 5) {
  const featured = [];
  for (const cat of categories) {
    for (const item of cat.items) {
      if (item.featured) featured.push({ ...item, categoryId: cat.id });
    }
  }
  return featured.slice(0, limit);
}

// Persists the full category/item tree the admin panel edited. Behaves like
// the old "overwrite the whole file" semantics: anything no longer present
// in `categories` is deleted, everything else is upserted.
export async function writeMenuCategories(categories) {
  const supabase = getSupabaseAdmin();

  const categoryRows = categories.map((cat, i) => ({
    id: cat.id,
    title_ru: cat.title?.ru || "",
    title_uz: cat.title?.uz || "",
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
        name_uz: item.name?.uz || "",
        desc_ru: item.desc?.ru || "",
        desc_uz: item.desc?.uz || "",
        price: Math.round(item.price) || 0,
        weight: item.weight || null,
        icons: item.icons || [],
        img: item.img || null,
        featured: !!item.featured,
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
