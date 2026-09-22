"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useLang } from "@/context/LangContext";

export default function ThemeToggle({ className = "", size = "h-9 w-9" }) {
  const { isNight, toggleTheme } = useTheme();
  const { t } = useLang();
  const label = isNight ? t("theme_to_day") : t("theme_to_night");

  return (
    <button
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      className={`flex ${size} items-center justify-center rounded-full border border-edge text-muted transition-colors hover:border-saffron hover:text-saffron ${className}`}
    >
      {isNight ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
