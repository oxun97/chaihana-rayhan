import fs from "fs";
import path from "path";

const MENU_PATH = path.join(process.cwd(), "data", "menu.json");
const BACKUP_PATH = path.join(process.cwd(), "data", "menu.backup.json");

export function readMenuCategories() {
  const raw = fs.readFileSync(MENU_PATH, "utf-8");
  return JSON.parse(raw);
}

// Keeps a single rolling backup of the previous version before every overwrite,
// since there is no database history to fall back on.
export function writeMenuCategories(categories) {
  if (fs.existsSync(MENU_PATH)) {
    fs.copyFileSync(MENU_PATH, BACKUP_PATH);
  }
  fs.writeFileSync(MENU_PATH, JSON.stringify(categories, null, 2) + "\n", "utf-8");
}
