import fs from "fs";
import path from "path";

const MENU_PATH = path.join(process.cwd(), "data", "menu.json");
const BACKUP_PATH = path.join(process.cwd(), "data", "menu.backup.json");
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

export function readMenuCategories() {
  const raw = fs.readFileSync(MENU_PATH, "utf-8");
  const categories = JSON.parse(raw);
  return categories.map((cat) => ({
    ...cat,
    imageSrc: resolveImage(cat.image),
    items: cat.items.map((item) => ({
      ...item,
      imgSrc: resolveImage(item.img),
    })),
  }));
}

// Keeps a single rolling backup of the previous version before every overwrite,
// since there is no database history to fall back on.
export function writeMenuCategories(categories) {
  if (fs.existsSync(MENU_PATH)) {
    fs.copyFileSync(MENU_PATH, BACKUP_PATH);
  }
  // Strip the resolved imageSrc/imgSrc fields — they're derived at read time
  // and shouldn't be persisted as source data.
  const clean = categories.map(({ imageSrc, items, ...cat }) => ({
    ...cat,
    items: items.map(({ imgSrc, ...item }) => item),
  }));
  fs.writeFileSync(MENU_PATH, JSON.stringify(clean, null, 2) + "\n", "utf-8");
}
