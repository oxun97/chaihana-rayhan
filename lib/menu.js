import menuData from "@/data/menu.json";

/**
 * menuData: array of categories { id, title: {ru,en,uz,tg}, items: [...] }
 * Each item: { id, name: {ru,en,uz,tg}, desc: {ru,en,uz,tg}, price, weight, icons, img }
 */

export const CATEGORIES = menuData;

// Flat lookup: item id -> { ...item, categoryId }
export const ITEMS_BY_ID = CATEGORIES.reduce((acc, cat) => {
  cat.items.forEach((item) => {
    acc[item.id] = { ...item, categoryId: cat.id };
  });
  return acc;
}, {});

export function getItem(id) {
  return ITEMS_BY_ID[id];
}

export function localized(field, lang) {
  if (!field) return "";
  return field[lang] || field.ru || "";
}
