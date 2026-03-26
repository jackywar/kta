"use client";

import * as React from "react";

export type PaletteName = "default" | "blue" | "red";

const STORAGE_KEY = "kta:palette";

type PaletteContextValue = {
  palette: PaletteName;
  setPalette: (next: PaletteName) => void;
};

const PaletteContext = React.createContext<PaletteContextValue | null>(null);

function applyPaletteToDocument(palette: PaletteName) {
  document.documentElement.dataset.theme = palette;
}

function isPaletteName(value: unknown): value is PaletteName {
  return value === "default" || value === "blue" || value === "red";
}

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPaletteState] = React.useState<PaletteName>("default");
  const hasHydrated = React.useRef(false);

  const setPalette = React.useCallback((next: PaletteName) => {
    setPaletteState(next);
    applyPaletteToDocument(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }

    void fetch("/api/profile/theme", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ palette: next })
    }).catch(() => {});
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      // 1) try profile
      try {
        const res = await fetch("/api/profile/theme", { method: "GET" });
        if (res.ok) {
          const data: unknown = await res.json().catch(() => null);
          const p =
            typeof data === "object" &&
            data &&
            "palette" in data &&
            (data as { palette?: unknown }).palette;

          if (!cancelled && isPaletteName(p)) {
            setPaletteState(p);
            applyPaletteToDocument(p);
            try {
              localStorage.setItem(STORAGE_KEY, p);
            } catch {}
            hasHydrated.current = true;
            return;
          }
        }
      } catch {
        // ignore
      }

      // 2) fallback localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!cancelled && isPaletteName(stored)) {
          setPaletteState(stored);
          applyPaletteToDocument(stored);
        } else if (!cancelled) {
          applyPaletteToDocument("default");
        }
      } catch {
        if (!cancelled) applyPaletteToDocument("default");
      } finally {
        hasHydrated.current = true;
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!hasHydrated.current) return;
    applyPaletteToDocument(palette);
  }, [palette]);

  return (
    <PaletteContext.Provider value={{ palette, setPalette }}>
      {children}
    </PaletteContext.Provider>
  );
}

export function usePalette() {
  const ctx = React.useContext(PaletteContext);
  if (!ctx) {
    throw new Error("usePalette must be used within PaletteProvider");
  }
  return ctx;
}

