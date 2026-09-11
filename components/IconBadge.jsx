"use client";

import { Flame, Beef, Drumstick, Leaf, Fish, Milk } from "lucide-react";
import { useLang } from "@/context/LangContext";

const ICONS = {
  spicy: Flame,
  beef: Beef,
  chicken: Drumstick,
  lamb: Beef,
  veg: Leaf,
  fish: Fish,
  dairy: Milk,
};

export default function IconBadge({ icon, size = 13, className = "" }) {
  const { iconLabel } = useLang();
  const Icon = ICONS[icon];
  if (!Icon) return null;
  return (
    <span className={`inline-flex items-center text-gold ${className}`} title={iconLabel(icon)}>
      <Icon size={size} />
    </span>
  );
}
