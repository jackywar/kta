"use client";

import * as React from "react";
import { usePalette, type PaletteName } from "@/components/theme/palette-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

type Option = { value: PaletteName; label: string };

const OPTIONS: Option[] = [
  { value: "default", label: "Défaut" },
  { value: "blue", label: "Thème D" },
  { value: "red", label: "Thème R" },
  { value: "amber", label: "Thème M" }
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
      <Select value={palette} onValueChange={(v) => setPalette(v as PaletteName)}>
        <SelectTrigger className="mt-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

