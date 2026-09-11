/**
 * Category shape: { id, title: {ru,en,uz,tg}, items: [...] }
 * Item shape: { id, name: {ru,en,uz,tg}, desc: {ru,en,uz,tg}, price, weight, icons, img }
 *
 * The categories themselves are no longer statically imported here — the menu
 * is editable at runtime via the admin panel, so it's read fresh on the server
 * (see lib/menu-server.js) and passed down through MenuProvider/props instead.
 */

export function localized(field, lang) {
  if (!field) return "";
  return field[lang] || field.ru || "";
}

// Decorative fallback emoji per category id, shown until a real category
// photo is uploaded via /admin. Shared between CategoryRow and DishCard.
export const CATEGORY_EMOJI = {
  salaty: "🥗",
  zakuski: "🫒",
  supy: "🍲",
  goryachie: "🍛",
  shashlyki: "🍢",
  "blyuda-na-zakaz": "🍚",
  garniry: "🍟",
  sousy: "🥣",
  deserty: "🍰",
  "kholodnye-napitki": "🥤",
};

// Builds an id -> item lookup (with categoryId attached) from a categories array.
export function buildMenuIndex(categories) {
  const itemsById = {};
  (categories || []).forEach((cat) => {
    (cat.items || []).forEach((item) => {
      itemsById[item.id] = { ...item, categoryId: cat.id };
    });
  });
  return {
    itemsById,
    getItem: (id) => itemsById[id],
  };
}
