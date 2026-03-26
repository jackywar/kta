"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
  useTheme
} from "next-themes";

type ThemeMode = "light" | "dark" | "system";

function ThemeProfileSync() {
  const { theme, setTheme } = useTheme();
  const hasHydrated = React.useRef(false);

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch("/api/profile/theme", { method: "GET" });
        if (!res.ok) return;
        const data: unknown = await res.json().catch(() => null);

        const mode =
          typeof data === "object" &&
          data &&
          "mode" in data &&
          (data as { mode?: unknown }).mode;

        if (
          !cancelled &&
          (mode === "light" || mode === "dark" || mode === "system")
        ) {
          setTheme(mode);
        }
      } catch {
        // ignore (offline / not logged in)
      } finally {
        hasHydrated.current = true;
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [setTheme]);

  React.useEffect(() => {
    if (!hasHydrated.current) return;
    if (theme !== "light" && theme !== "dark" && theme !== "system") return;

    void fetch("/api/profile/theme", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: theme satisfies ThemeMode })
    }).catch(() => {});
  }, [theme]);

  return null;
}

export function ThemeProvider({
  children,
  ...props
}: Omit<ThemeProviderProps, "attribute" | "defaultTheme" | "enableSystem">) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="kta:mode"
      {...props}
    >
      <ThemeProfileSync />
      {children}
    </NextThemesProvider>
  );
}

