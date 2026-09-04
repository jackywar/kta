"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
  useTheme
} from "next-themes";
import { DEFAULT_THEME_MODE, type ThemeMode } from "@/lib/theme";

const STORAGE_KEY = "kta:mode";

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

function ThemeProfileSync({ initialMode }: { initialMode: ThemeMode | null }) {
  const { theme } = useTheme();
  const hasHydrated = React.useRef(false);
  // Dernière valeur connue du profil : évite un POST inutile à chaque montage.
  const lastPersisted = React.useRef<ThemeMode | null>(initialMode);

  React.useEffect(() => {
    // `initialMode` est déjà transmis à `defaultTheme`. Ne pas rappeler
    // `setTheme(initialMode)` ici : cela écraserait le choix de l'utilisateur
    // à chaque nouveau rendu du provider.
    hasHydrated.current = true;
  }, []);

  React.useEffect(() => {
    if (!hasHydrated.current) return;
    if (!isThemeMode(theme)) return;
    if (lastPersisted.current === theme) return;

    lastPersisted.current = theme;

    void fetch("/api/profile/theme", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: theme })
    }).catch(() => {});
  }, [theme]);

  return null;
}

export function ThemeProvider({
  children,
  initialMode = null,
  ...props
}: Omit<ThemeProviderProps, "attribute" | "defaultTheme" | "enableSystem"> & {
  /** Mode du profil, rendu côté serveur. `null` si non connecté. */
  initialMode?: ThemeMode | null;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={initialMode ?? DEFAULT_THEME_MODE}
      enableSystem
      storageKey={STORAGE_KEY}
      {...props}
    >
      <ThemeProfileSync initialMode={initialMode} />
      {children}
    </NextThemesProvider>
  );
}
