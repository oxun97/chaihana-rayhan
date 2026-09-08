"use client";

import { useLang } from "@/context/LangContext";

const EMOJI = {
  spicy: "🌶️",
  beef: "🥩",
  chicken: "🐔",
  lamb: "🐑",
  veg: "🥬",
  fish: "🐟",
  dairy: "🧀",
};

export default function IconBadge({ icon, className = "" }) {
  const { iconLabel } = useLang();
  const emoji = EMOJI[icon];
  if (!emoji) return null;
  return (
    <span className={`inline-block leading-none ${className}`} title={iconLabel(icon)}>
      {emoji}
    </span>
  );
}
