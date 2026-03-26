"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Responsabilite } from "@/lib/responsabilites";
import { MarkdownContent } from "@/components/ui/markdown-content";

type EditValues = {
  id: string;
  libelle: string;
  descriptif: string;
};

export function ResponsabilitesTable({
  responsabilites
}: {
  responsabilites: Responsabilite[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<EditValues | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function openEdit(r: Responsabilite) {
    setEditing({
      id: r.id,
      libelle: r.libelle,
      descriptif: r.descriptif ?? ""
    });
    setError(null);
  }

  function closeEdit() {
    setEditing(null);
    setError(null);
  }

  async function handleSave() {
    if (!editing) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/responsabilites/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          libelle: editing.libelle.trim(),
          descriptif: editing.descriptif.trim() || undefined
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
          "Erreur lors de l'enregistrement.";
        setError(msg);
        return;
      }
      router.refresh();
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette responsabilité ?")) return;
    const res = await fetch("/api/admin/responsabilites/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (res.ok) router.refresh();
  }

  if (responsabilites.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        Aucune responsabilité.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Libellé</th>
                <th className="px-4 py-3">Descriptif</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {responsabilites.map((r) => (
                <tr key={r.id} className="hover:bg-muted/70">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {r.libelle}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.descriptif ? (
                      <span className="truncate block max-w-xs">
                        {r.descriptif.slice(0, 60)}
                        {r.descriptif.length > 60 ? "…" : ""}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground shadow-sm transition hover:bg-muted"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-destructive/30 bg-card px-3 text-xs text-destructive shadow-sm transition hover:bg-destructive/10"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-responsabilite-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2
              id="edit-responsabilite-title"
              className="text-lg font-semibold text-foreground"
            >
              Modifier la responsabilité
            </h2>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="re-libelle"
                >
                  Libellé <span className="text-destructive">*</span>
                </label>
                <input
                  id="re-libelle"
                  type="text"
                  value={editing.libelle}
                  onChange={(e) =>
                    setEditing((v) =>
                      v ? { ...v, libelle: e.target.value } : null
                    )
                  }
                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="re-descriptif"
                >
                  Descriptif (Markdown)
                </label>
                <textarea
                  id="re-descriptif"
                  value={editing.descriptif}
                  onChange={(e) =>
                    setEditing((v) =>
                      v ? { ...v, descriptif: e.target.value } : null
                    )
                  }
                  className="h-32 w-full resize-y rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
                />
              </div>

              {editing.descriptif.trim() ? (
                <div className="rounded-xl border border-border/60 bg-muted p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Aperçu
                  </p>
                  <MarkdownContent content={editing.descriptif} />
                </div>
              ) : null}

              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending || !editing.libelle.trim()}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Enregistrement…" : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={closeEdit}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-medium text-muted-foreground shadow-sm transition hover:bg-muted"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
