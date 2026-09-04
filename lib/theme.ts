import { z } from "zod";

export const themeModeSchema = z.enum(["light", "dark", "system"]);
export type ThemeMode = z.infer<typeof themeModeSchema>;

export const paletteNameSchema = z.enum(["default", "blue", "red", "amber"]);
export type PaletteName = z.infer<typeof paletteNameSchema>;

export const DEFAULT_THEME_MODE: ThemeMode = "system";
export const DEFAULT_PALETTE: PaletteName = "default";

export function normalizeThemeMode(value: unknown): ThemeMode {
  return themeModeSchema.catch(DEFAULT_THEME_MODE).parse(value ?? DEFAULT_THEME_MODE);
}

export function normalizePalette(value: unknown): PaletteName {
  return paletteNameSchema.catch(DEFAULT_PALETTE).parse(value ?? DEFAULT_PALETTE);
}
