"use client";

import Link from "next/link";
import {
  UtensilsCrossed,
  LayoutDashboard,
  ClipboardList,
  BadgePercent,
  CalendarDays,
  Send,
  ExternalLink,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const NAV = [
  { key: "menu", href: "/admin", label: "Меню", icon: UtensilsCrossed },
  { key: "dashboard", href: "/admin/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { key: "orders", href: "/admin/orders", label: "Заказы", icon: ClipboardList },
  { key: "promos", href: "/admin/promos", label: "Акции", icon: BadgePercent },
  { key: "bookings", href: "/admin/bookings", label: "Брони", icon: CalendarDays },
  { key: "telegram", href: "/admin/telegram", label: "Telegram", icon: Send },
];

// Shared chrome for every admin screen: one navigation, the same theme
// tokens as the storefront (so day/night follows the site), and a nav that
// becomes a scrollable icon rail on a phone instead of wrapping.
export default function AdminShell({ title, active, actions, children }) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 border-b border-edge/70 bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <h1 className="font-serif text-lg font-bold text-body">{title}</h1>
          <div className="ml-auto flex items-center gap-2">
            {actions}
            <ThemeToggle />
            <Link
              href="/"
              title="Открыть сайт"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-edge text-muted transition-colors hover:border-brand hover:text-brand"
            >
              <ExternalLink size={16} />
            </Link>
          </div>
        </div>

        <nav className="no-scrollbar mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-4 pb-2.5 sm:px-6">
          {NAV.map(({ key, href, label, icon: Icon }) => {
            const isActive = key === active;
            return (
              <Link
                key={key}
                href={href}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.82rem] font-medium transition-colors ${
                  isActive
                    ? "bg-brand text-white"
                    : "border border-edge text-muted hover:border-brand hover:text-brand"
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6">{children}</main>

      <style jsx global>{`
        .admin-field {
          width: 100%;
          border-radius: 0.65rem;
          border: 1px solid rgb(var(--edge));
          background: rgb(var(--card));
          color: rgb(var(--body));
          padding: 0.5rem 0.7rem;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .admin-field::placeholder {
          color: rgb(var(--muted));
        }
        .admin-field:focus {
          border-color: rgb(var(--brand));
        }
      `}</style>
    </div>
  );
}
