"use client";

import { useEffect, useState } from "react";

export default function AdminTelegramPage() {
  const [subscribers, setSubscribers] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [setupError, setSetupError] = useState("");
  const [botUsername, setBotUsername] = useState("");
  const [setupBusy, setSetupBusy] = useState(false);

  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState("");
  const [statusBusy, setStatusBusy] = useState(false);

  const loadStatus = () => {
    setStatusBusy(true);
    setStatusError("");
    fetch("/api/admin/telegram/status")
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error);
        setStatus(data);
      })
      .catch((e) => setStatusError(e.message || "Не удалось получить статус."))
      .finally(() => setStatusBusy(false));
  };

  const loadSubscribers = () => {
    fetch("/api/admin/telegram/subscribers")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSubscribers(data.subscribers);
      })
      .catch((e) => setLoadError(e.message || "Не удалось загрузить список."));
  };

  useEffect(() => {
    loadSubscribers();
    loadStatus();
  }, []);

  async function handleSetup() {
    setSetupBusy(true);
    setSetupError("");
    try {
      const res = await fetch("/api/admin/telegram/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBotUsername(data.username);
    } catch (e) {
      setSetupError(e.message || "Не удалось настроить бота.");
    } finally {
      setSetupBusy(false);
    }
  }

  async function unsubscribe(chatId) {
    if (!window.confirm("Отписать этот чат от уведомлений?")) return;
    try {
      const res = await fetch(`/api/admin/telegram/subscribers?chatId=${chatId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      loadSubscribers();
    } catch (e) {
      alert(e.message || "Не удалось отписать чат.");
    }
  }

  const activeSubscribers = (subscribers || []).filter((s) => s.is_active);

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-gold/15 bg-cream/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <h1 className="font-serif text-lg font-bold text-ink">Telegram — Чайхана Райхан</h1>
        <a href="/admin" className="text-xs text-ink-soft underline hover:text-gold">
          Меню
        </a>
        <a href="/admin/dashboard" className="text-xs text-ink-soft underline hover:text-gold">
          Дашборд
        </a>
        <a href="/admin/orders" className="text-xs text-ink-soft underline hover:text-gold">
          Заказы
        </a>
        <a href="/" className="text-xs text-ink-soft underline hover:text-gold">
          Открыть сайт
        </a>
      </header>

      <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 sm:p-6">
        <div className="rounded-2xl bg-white p-4 shadow-soft">
          <h2 className="font-serif text-base font-bold text-ink">Настройка бота</h2>
          <p className="mt-2 text-sm text-ink-soft">
            1. Создайте бота через{" "}
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noreferrer"
              className="text-gold underline"
            >
              @BotFather
            </a>{" "}
            в Telegram и получите токен.
            <br />
            2. Добавьте <code className="rounded bg-cream px-1">TELEGRAM_BOT_TOKEN</code> в
            переменные окружения проекта и задеплойте.
            <br />
            3. Откройте эту страницу по постоянному адресу сайта (не по адресу отдельной сборки) и
            нажмите кнопку ниже — бот будет подключён именно к этому адресу.
          </p>

          <button
            onClick={handleSetup}
            disabled={setupBusy}
            className="mt-3 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark hover:text-white disabled:opacity-50"
          >
            {setupBusy ? "Настраиваем…" : "Настроить бота"}
          </button>

          {setupError && <p className="mt-2 text-sm text-red-500">{setupError}</p>}
          {botUsername && (
            <p className="mt-2 text-sm text-green-700">
              Готово! Напишите боту{" "}
              <a
                href={`https://t.me/${botUsername}`}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                @{botUsername}
              </a>{" "}
              команду <code className="rounded bg-cream px-1">/start</code>, чтобы получать уведомления
              о новых заказах.
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-serif text-base font-bold text-ink">Диагностика</h2>
            <button
              onClick={loadStatus}
              disabled={statusBusy}
              className="rounded-full border border-gold/30 px-3 py-1 text-xs font-semibold text-ink-soft hover:border-gold hover:text-gold disabled:opacity-50"
            >
              {statusBusy ? "Проверяем…" : "Проверить"}
            </button>
          </div>

          {statusError && <p className="mt-2 text-sm text-red-500">{statusError}</p>}

          {status && (
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-ink-soft">Бот</dt>
                <dd className="text-ink">@{status.bot.username}</dd>
              </div>

              <div className="flex flex-col gap-1 border-t border-cream pt-2">
                <dt className="text-ink-soft">Адрес, куда Telegram доставляет</dt>
                <dd className="break-all font-mono text-xs text-ink">
                  {status.webhook.url || "— не задан —"}
                </dd>
                {!status.webhook.url ? (
                  <dd className="text-xs text-red-600">
                    Вебхук не зарегистрирован. Нажмите «Настроить бота» выше.
                  </dd>
                ) : status.deploymentSpecific ? (
                  <dd className="text-xs text-red-600">
                    Это адрес отдельной сборки, а не постоянный адрес сайта — Telegram перестаёт
                    доставлять после следующего деплоя. Нажмите «Настроить бота», чтобы
                    перерегистрировать на постоянный адрес.
                  </dd>
                ) : status.matches ? (
                  <dd className="text-xs text-green-700">
                    Совпадает с адресом, на котором открыта админка ✓
                  </dd>
                ) : (
                  <dd className="text-xs text-red-600">
                    Не совпадает с адресом, на котором открыта админка:{" "}
                    <span className="break-all font-mono">{status.expectedUrl}</span>. Нажмите
                    «Настроить бота», чтобы перерегистрировать на него.
                  </dd>
                )}
              </div>

              <div className="flex flex-wrap justify-between gap-2 border-t border-cream pt-2">
                <dt className="text-ink-soft">Сообщений в очереди</dt>
                <dd className="text-ink">{status.webhook.pendingUpdateCount}</dd>
              </div>

              <div className="flex flex-col gap-1 border-t border-cream pt-2">
                <dt className="text-ink-soft">Последняя ошибка доставки</dt>
                {status.webhook.lastErrorMessage ? (
                  <>
                    <dd className="text-xs text-red-600">{status.webhook.lastErrorMessage}</dd>
                    <dd className="text-xs text-ink-soft">
                      {new Date(status.webhook.lastErrorDate).toLocaleString("ru-RU")}
                    </dd>
                  </>
                ) : (
                  <dd className="text-xs text-green-700">Ошибок нет ✓</dd>
                )}
              </div>
            </dl>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-soft">
          <h2 className="font-serif text-base font-bold text-ink">
            Подписанные чаты {subscribers && `(${activeSubscribers.length})`}
          </h2>
          {loadError && <p className="mt-2 text-sm text-red-500">{loadError}</p>}
          {subscribers === null ? (
            <p className="mt-3 text-sm text-ink-soft">Загрузка…</p>
          ) : activeSubscribers.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">
              Пока никто не подписан. Настройте бота выше и отправьте ему /start.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {activeSubscribers.map((s) => (
                <li key={s.chat_id} className="flex items-center justify-between text-sm">
                  <span className="text-ink">
                    {s.first_name || "Без имени"}
                    {s.username && <span className="ml-1 text-ink-soft">@{s.username}</span>}
                  </span>
                  <button
                    onClick={() => unsubscribe(s.chat_id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Отписать
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
