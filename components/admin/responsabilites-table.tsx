"use client";

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
      window.location.reload();
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette responsabilité ?")) return;
    const res = await fetch("/api/admin/responsabilites/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (res.ok) window.location.reload();
  }

  if (responsabilites.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
        Aucune responsabilité.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-600">
              <tr>
                <th className="px-4 py-3">Libellé</th>
                <th className="px-4 py-3">Descriptif</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {responsabilites.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50/70">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {r.libelle}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {r.descriptif ? (
                      <span className="truncate block max-w-xs">
                        {r.descriptif.slice(0, 60)}
                        {r.descriptif.length > 60 ? "…" : ""}
                      </span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs text-zinc-600 shadow-sm transition hover:bg-zinc-50"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-xs text-red-600 shadow-sm transition hover:bg-red-50"
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
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h2
              id="edit-responsabilite-title"
              className="text-lg font-semibold text-zinc-900"
            >
              Modifier la responsabilité
            </h2>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-zinc-900"
                  htmlFor="re-libelle"
                >
                  Libellé <span className="text-red-500">*</span>
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
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-zinc-900"
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
                  className="h-32 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                />
              </div>

              {editing.descriptif.trim() ? (
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Aperçu
                  </p>
                  <MarkdownContent content={editing.descriptif} />
                </div>
              ) : null}

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending || !editing.libelle.trim()}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Enregistrement…" : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={closeEdit}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
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
