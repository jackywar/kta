"use client";

import * as React from "react";
import { usePalette, type PaletteName } from "@/components/theme/palette-provider";

type Option = { value: PaletteName; label: string };

const OPTIONS: Option[] = [
  { value: "default", label: "Défaut" },
  { value: "blue", label: "Bleu" },
  { value: "red", label: "Rouge" }
];

export function PaletteSwitcher({
  className,
  label = "Palette"
}: {
  className?: string;
  label?: string;
}) {
  const { palette, setPalette } = usePalette();

  return (
    <label className={className}>
      <span className="block text-sm font-medium text-foreground">{label}</span>
      <select
        className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
        value={palette}
        onChange={(e) => setPalette(e.target.value as PaletteName)}
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

