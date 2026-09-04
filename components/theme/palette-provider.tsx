"use client";

import * as React from "react";
import {
  DEFAULT_PALETTE,
  paletteNameSchema,
  type PaletteName
} from "@/lib/theme";

export type { PaletteName };

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
  return paletteNameSchema.safeParse(value).success;
}

export function PaletteProvider({
  children,
  initialPalette = null
}: {
  children: React.ReactNode;
  /** Palette du profil, rendue côté serveur. `null` si non connecté. */
  initialPalette?: PaletteName | null;
}) {
  const [palette, setPaletteState] = React.useState<PaletteName>(
    initialPalette ?? DEFAULT_PALETTE
  );
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
    if (initialPalette) {
      // Profil connecté : la valeur serveur fait foi, on aligne le cache local.
      setPaletteState(initialPalette);
      applyPaletteToDocument(initialPalette);
      try {
        localStorage.setItem(STORAGE_KEY, initialPalette);
      } catch {
        // ignore
      }
    } else {
      // Pas de profil : on retombe sur la préférence locale de l'appareil.
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      const next = isPaletteName(stored) ? stored : DEFAULT_PALETTE;
      setPaletteState(next);
      applyPaletteToDocument(next);
    }

    hasHydrated.current = true;
  }, [initialPalette]);

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
