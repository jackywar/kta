"use client";

import * as React from "react";

/** Hauteur par défaut ~18 lignes (demande 15–20), redimensionnable verticalement. */
const TEXTAREA_DEFAULT_CLASSES =
  "min-h-[22.5rem] w-full resize-y rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20";

export type TextareaProps = React.ComponentPropsWithoutRef<"textarea">;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className = "", rows = 18, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={[TEXTAREA_DEFAULT_CLASSES, className].filter(Boolean).join(" ")}
        {...props}
      />
    );
  }
);
