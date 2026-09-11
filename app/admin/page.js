"use client";

import { useEffect, useMemo, useState } from "react";
import i18n from "@/data/i18n.json";

const LANGS = ["ru", "en", "uz", "tg"];
const ICONS = ["spicy", "beef", "chicken", "lamb", "veg", "fish", "dairy"];
const ICON_EMOJI = {
  spicy: "🌶️",
  beef: "🥩",
  chicken: "🐔",
  lamb: "🐑",
  veg: "🥬",
  fish: "🐟",
  dairy: "🧀",
};

function emptyLocalized() {
  return { ru: "", en: "", uz: "", tg: "" };
}

function makeItemId(categoryId) {
  return `${categoryId}-${Date.now().toString(36)}`;
}

function updateCategory(categories, catId, updater) {
  return categories.map((c) => (c.id === catId ? updater(c) : c));
}

function updateItem(categories, catId, itemId, updater) {
  return updateCategory(categories, catId, (c) => ({
    ...c,
    items: c.items.map((it) => (it.id === itemId ? updater(it) : it)),
  }));
}

export default function AdminPage() {
  const [categories, setCategories] = useState(null);
  const [savedJson, setSavedJson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [search, setSearch] = useState("");
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newCategoryTitle, setNewCategoryTitle] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/menu")
      .then((res) => {
        if (!res.ok) throw new Error("load-failed");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setCategories(data.categories);
        setSavedJson(JSON.stringify(data.categories));
        setActiveCategoryId(data.categories[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Не удалось загрузить меню. Обновите страницу.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dirty = useMemo(() => {
    if (!categories) return false;
    return JSON.stringify(categories) !== savedJson;
  }, [categories, savedJson]);

  useEffect(() => {
    const handler = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const activeCategory = categories?.find((c) => c.id === activeCategoryId) || null;

  const filteredItems = useMemo(() => {
    if (!activeCategory) return [];
    const q = search.trim().toLowerCase();
    if (!q) return activeCategory.items;
    return activeCategory.items.filter((it) =>
      LANGS.some((lang) => (it.name?.[lang] || "").toLowerCase().includes(q))
    );
  }, [activeCategory, search]);

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/admin/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || "Не удалось сохранить меню.");
        return;
      }
      setSavedJson(JSON.stringify(categories));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setSaveError("Не удалось связаться с сервером.");
    } finally {
      setSaving(false);
    }
  }

  function handleAddItem() {
    if (!activeCategory) return;
    const id = makeItemId(activeCategory.id);
    setCategories((prev) =>
      updateCategory(prev, activeCategory.id, (c) => ({
        ...c,
        items: [
          ...c.items,
          {
            id,
            name: emptyLocalized(),
            desc: emptyLocalized(),
            price: 0,
            weight: "",
            icons: [],
            img: "",
          },
        ],
      }))
    );
    setExpandedItemId(id);
  }

  function handleDeleteItem(itemId) {
    if (!activeCategory) return;
    const item = activeCategory.items.find((it) => it.id === itemId);
    if (!window.confirm(`Удалить блюдо «${item?.name?.ru || itemId}»?`)) return;
    setCategories((prev) =>
      updateCategory(prev, activeCategory.id, (c) => ({
        ...c,
        items: c.items.filter((it) => it.id !== itemId),
      }))
    );
    if (expandedItemId === itemId) setExpandedItemId(null);
  }

  function handleAddCategory() {
    const id = newCategoryId.trim();
    const titleRu = newCategoryTitle.trim();
    if (!id || !titleRu) return;
    if (categories.some((c) => c.id === id)) {
      alert("Категория с таким id уже существует.");
      return;
    }
    setCategories((prev) => [
      ...prev,
      { id, title: { ...emptyLocalized(), ru: titleRu }, items: [] },
    ]);
    setActiveCategoryId(id);
    setNewCategoryId("");
    setNewCategoryTitle("");
    setNewCategoryOpen(false);
  }

  function handleDeleteCategory(catId) {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    if (
      !window.confirm(
        `Удалить категорию «${cat.title.ru}» вместе с ${cat.items.length} блюд(ами)?`
      )
    )
      return;
    const next = categories.filter((c) => c.id !== catId);
    setCategories(next);
    if (activeCategoryId === catId) setActiveCategoryId(next[0]?.id ?? null);
  }

  if (loading) {
    return <CenteredMessage>Загрузка меню…</CenteredMessage>;
  }

  if (loadError) {
    return <CenteredMessage error>{loadError}</CenteredMessage>;
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-gold/15 bg-cream/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <h1 className="font-serif text-lg font-bold text-ink">Админ-панель — Чайхана Райхан</h1>
        <a href="/admin/orders" className="text-xs text-ink-soft underline hover:text-gold">
          Заказы
        </a>
        <a href="/" className="text-xs text-ink-soft underline hover:text-gold">
          Открыть сайт
        </a>
        <div className="ml-auto flex items-center gap-3">
          {saveError && <span className="text-xs text-red-500">{saveError}</span>}
          {saveSuccess && <span className="text-xs text-green-600">Меню сохранено ✓</span>}
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gold-dark hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Сохранение…" : dirty ? "Сохранить изменения" : "Всё сохранено"}
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4 md:flex-row sm:p-6">
        <aside className="flex shrink-0 flex-row gap-1.5 overflow-x-auto pb-1 md:w-56 md:flex-col md:overflow-visible md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategoryId(cat.id);
                setExpandedItemId(null);
                setSearch("");
              }}
              className={`shrink-0 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                activeCategoryId === cat.id
                  ? "bg-ink text-cream"
                  : "bg-white text-ink-soft hover:bg-gold/10"
              }`}
            >
              {cat.title.ru || cat.id}
              <span className="ml-1.5 opacity-60">({cat.items.length})</span>
            </button>
          ))}

          {newCategoryOpen ? (
            <div className="flex shrink-0 flex-col gap-1.5 rounded-xl border border-gold/25 bg-white p-2.5 md:w-full">
              <input
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
                placeholder="id (латиницей, напр. napitki)"
                className="admin-input"
              />
              <input
                value={newCategoryTitle}
                onChange={(e) => setNewCategoryTitle(e.target.value)}
                placeholder="Название (ru)"
                className="admin-input"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={handleAddCategory}
                  className="flex-1 rounded-lg bg-gold py-1.5 text-xs font-semibold text-ink hover:bg-gold-dark hover:text-white"
                >
                  Создать
                </button>
                <button
                  onClick={() => setNewCategoryOpen(false)}
                  className="rounded-lg px-2 text-xs text-ink-soft hover:bg-cream"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setNewCategoryOpen(true)}
              className="shrink-0 rounded-xl border border-dashed border-gold/40 px-3 py-2 text-sm text-ink-soft hover:border-gold hover:text-gold"
            >
              + Категория
            </button>
          )}
        </aside>

        {activeCategory && (
          <main className="flex-1 rounded-2xl bg-white p-4 shadow-soft sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gold/10 pb-4">
              <PhotoUpload
                label="Фото категории"
                currentSrc={activeCategory.imageSrc}
                target="category"
                categoryId={activeCategory.id}
                onUploaded={(path, url) =>
                  setCategories((prev) =>
                    updateCategory(prev, activeCategory.id, (c) => ({
                      ...c,
                      image: path,
                      imageSrc: url,
                    }))
                  )
                }
              />
              <button
                onClick={() => handleDeleteCategory(activeCategory.id)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Удалить категорию
              </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2 border-b border-gold/10 pb-4">
              {LANGS.map((lang) => (
                <label key={lang} className="flex items-center gap-1.5 text-xs text-ink-soft">
                  {i18n.ui[lang]?.label}:
                  <input
                    value={activeCategory.title[lang] || ""}
                    onChange={(e) =>
                      setCategories((prev) =>
                        updateCategory(prev, activeCategory.id, (c) => ({
                          ...c,
                          title: { ...c.title, [lang]: e.target.value },
                        }))
                      )
                    }
                    className="admin-input w-36"
                  />
                </label>
              ))}
            </div>

            <div className="mb-3 flex items-center gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск блюда по названию…"
                className="admin-input flex-1"
              />
              <button
                onClick={handleAddItem}
                className="shrink-0 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark hover:text-white"
              >
                + Блюдо
              </button>
            </div>

            <ul className="flex flex-col gap-2">
              {filteredItems.map((item) => (
                <DishRow
                  key={item.id}
                  item={item}
                  categoryId={activeCategory.id}
                  expanded={expandedItemId === item.id}
                  onToggle={() =>
                    setExpandedItemId((id) => (id === item.id ? null : item.id))
                  }
                  onDelete={() => handleDeleteItem(item.id)}
                  onChange={(updater) =>
                    setCategories((prev) =>
                      updateItem(prev, activeCategory.id, item.id, updater)
                    )
                  }
                />
              ))}
              {filteredItems.length === 0 && (
                <li className="py-8 text-center text-sm text-ink-soft">Ничего не найдено.</li>
              )}
            </ul>
          </main>
        )}
      </div>

      <style jsx global>{`
        .admin-input {
          border-radius: 0.5rem;
          border: 1px solid rgba(201, 169, 110, 0.3);
          padding: 0.4rem 0.65rem;
          font-size: 0.8rem;
          outline: none;
          background: #fdfcf8;
          transition: border-color 0.2s;
        }
        .admin-input:focus {
          border-color: #c9a96e;
        }
      `}</style>
    </div>
  );
}

function DishRow({ item, categoryId, expanded, onToggle, onDelete, onChange }) {
  return (
    <li className="rounded-xl border border-gold/10">
      <div className="flex items-center gap-3 px-3 py-2.5">
        {item.imgSrc ? (
          <img src={item.imgSrc} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cream text-sm text-ink-soft/40">
            🍽️
          </div>
        )}
        <button onClick={onToggle} className="flex flex-1 items-center gap-3 text-left">
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
            {item.name.ru || <em className="text-ink-soft">без названия</em>}
          </span>
          <span className="shrink-0 text-sm font-semibold text-gold">{item.price} ₽</span>
          {item.weight && (
            <span className="shrink-0 text-xs text-ink-soft">{item.weight}</span>
          )}
        </button>
        <button onClick={onDelete} className="shrink-0 text-ink-soft/60 hover:text-red-500">
          ✕
        </button>
      </div>

      {expanded && (
        <div className="flex flex-col gap-3 border-t border-gold/10 px-3 py-3">
          <PhotoUpload
            label="Фото блюда"
            currentSrc={item.imgSrc}
            target="dish"
            categoryId={categoryId}
            itemId={item.id}
            onUploaded={(path, url) => onChange((it) => ({ ...it, img: path, imgSrc: url }))}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {LANGS.map((lang) => (
              <label key={lang} className="flex flex-col gap-1 text-xs text-ink-soft">
                Название ({i18n.ui[lang]?.label})
                <input
                  value={item.name[lang] || ""}
                  onChange={(e) =>
                    onChange((it) => ({ ...it, name: { ...it.name, [lang]: e.target.value } }))
                  }
                  className="admin-input"
                />
              </label>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {LANGS.map((lang) => (
              <label key={lang} className="flex flex-col gap-1 text-xs text-ink-soft">
                Описание ({i18n.ui[lang]?.label})
                <textarea
                  value={item.desc?.[lang] || ""}
                  onChange={(e) =>
                    onChange((it) => ({
                      ...it,
                      desc: { ...(it.desc || emptyLocalized()), [lang]: e.target.value },
                    }))
                  }
                  rows={2}
                  className="admin-input resize-none"
                />
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1 text-xs text-ink-soft">
              Цена, ₽
              <input
                type="number"
                min={0}
                value={item.price}
                onChange={(e) =>
                  onChange((it) => ({ ...it, price: Number(e.target.value) || 0 }))
                }
                className="admin-input w-28"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink-soft">
              Вес/объём
              <input
                value={item.weight || ""}
                onChange={(e) => onChange((it) => ({ ...it, weight: e.target.value }))}
                placeholder="напр. 250 г"
                className="admin-input w-28"
              />
            </label>
            <label className="flex flex-1 min-w-[200px] flex-col gap-1 text-xs text-ink-soft">
              Ключ файла в хранилище
              <input
                value={item.img || ""}
                onChange={(e) => onChange((it) => ({ ...it, img: e.target.value }))}
                placeholder="dishes/salaty/salaty-1-abc123.jpg"
                className="admin-input"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            {ICONS.map((icon) => {
              const checked = (item.icons || []).includes(icon);
              return (
                <label key={icon} className="flex items-center gap-1.5 text-xs text-ink-soft">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onChange((it) => {
                        const icons = it.icons || [];
                        return {
                          ...it,
                          icons: checked ? icons.filter((i) => i !== icon) : [...icons, icon],
                        };
                      })
                    }
                  />
                  {ICON_EMOJI[icon]} {i18n.icons.ru[icon]}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </li>
  );
}

function PhotoUpload({ label, currentSrc, target, categoryId, itemId, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputId = `upload-${target}-${categoryId}-${itemId || "cover"}`;

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("target", target);
      form.append("categoryId", categoryId);
      if (itemId) form.append("itemId", itemId);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
      onUploaded(data.path, data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-2.5">
      {currentSrc ? (
        <img src={currentSrc} alt="" className="h-10 w-10 rounded-lg object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cream text-[0.6rem] text-ink-soft/50">
          нет фото
        </div>
      )}
      <label
        htmlFor={inputId}
        className="cursor-pointer rounded-full border border-gold/40 px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-gold hover:text-gold"
      >
        {uploading ? "Загрузка…" : label}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

function CenteredMessage({ children, error }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <p className={`text-sm ${error ? "text-red-500" : "text-ink-soft"}`}>{children}</p>
    </div>
  );
}
