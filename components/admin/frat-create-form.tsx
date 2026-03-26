"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { Frat } from "@/lib/frats";

type FormValues = {
  name: string;
  color_oklch: string;
};

export function FratCreateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [values, setValues] = useState<FormValues>({
    name: "",
    color_oklch: "#7f5af0"
  });

  const canSubmit = useMemo(
    () => values.name.trim().length > 0 && values.color_oklch.trim().length > 0,
    [values.name, values.color_oklch]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await fetch("/api/admin/frats/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values)
      });

      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          (typeof data === "object" &&
            data &&
            "error" in data &&
            typeof (data as { error: unknown }).error === "string" &&
            (data as { error: string }).error) ||
          "Erreur lors de la création de la frat.";
        setError(msg);
        return;
      }

      setValues({ name: "", color_oklch: "#7f5af0" });
      setSuccess("Frat créée.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="frat-name">
          Nom de la frat
        </label>
        <input
          id="frat-name"
          type="text"
          autoComplete="off"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          placeholder="Frat Vert Fluo"
          required
        />
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="frat-color"
        >
          Couleur
        </label>
        <input
          id="frat-color"
          type="color"
          value={values.color_oklch}
          onChange={(e) =>
            setValues((v) => ({ ...v, color_oklch: e.target.value }))
          }
          className="h-10 w-10 cursor-pointer rounded-full border border-border bg-card p-1 shadow-sm"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
          {success}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !canSubmit}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Création…" : "Créer"}
      </button>
    </form>
  );
}

