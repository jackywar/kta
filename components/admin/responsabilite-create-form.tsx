"use client";

import { useState, useTransition } from "react";
import { MarkdownContent } from "@/components/ui/markdown-content";

export function ResponsabiliteCreateForm() {
  const [libelle, setLibelle] = useState("");
  const [descriptif, setDescriptif] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canSubmit = libelle.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);

    startTransition(async () => {
      const res = await fetch("/api/admin/responsabilites/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          libelle: libelle.trim(),
          descriptif: descriptif.trim() || undefined
        })
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          (typeof data === "object" &&
            data &&
            "error" in data &&
            typeof (data as { error: unknown }).error === "string" &&
            (data as { error: string }).error) ||
          "Erreur lors de la création.";
        setError(msg);
        return;
      }
      window.location.reload();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900" htmlFor="rc-libelle">
          Libellé <span className="text-red-500">*</span>
        </label>
        <input
          id="rc-libelle"
          type="text"
          value={libelle}
          onChange={(e) => setLibelle(e.target.value)}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          placeholder="Ex : Accompagnement spirituel"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900" htmlFor="rc-descriptif">
          Descriptif (Markdown)
        </label>
        <textarea
          id="rc-descriptif"
          value={descriptif}
          onChange={(e) => setDescriptif(e.target.value)}
          className="h-32 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          placeholder="Description détaillée…"
        />
      </div>

      {descriptif.trim() ? (
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Aperçu
          </p>
          <MarkdownContent content={descriptif} />
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={!canSubmit || isPending}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Création…" : "Créer la responsabilité"}
      </button>
    </form>
  );
}
