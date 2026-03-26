"use client";

import * as React from "react";
import { useTheme } from "next-themes";

type Mode = "light" | "dark" | "system";

export function ModeSwitcher({
  className,
  label = "Mode"
}: {
  className?: string;
  label?: string;
}) {
  const { theme, setTheme } = useTheme();
  const value = (theme === "light" || theme === "dark" || theme === "system"
    ? theme
    : "system") satisfies Mode;

  return (
    <label className={className}>
      <span className="block text-sm font-medium text-foreground">{label}</span>
      <select
        className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
        value={value}
        onChange={(e) => setTheme(e.target.value as Mode)}
      >
        <option value="system">Système</option>
        <option value="light">Clair</option>
        <option value="dark">Sombre</option>
      </select>
    </label>
  );
}

