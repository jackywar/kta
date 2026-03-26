"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

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
      <Select value={value} onValueChange={(v) => setTheme(v as Mode)}>
        <SelectTrigger className="mt-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="system">Système</SelectItem>
          <SelectItem value="light">Clair</SelectItem>
          <SelectItem value="dark">Sombre</SelectItem>
        </SelectContent>
      </Select>
    </label>
  );
}

