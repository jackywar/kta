"use client";

import { useMemo, useState, useTransition } from "react";
import type { FratWithResponsables } from "@/lib/frats";

type ResponsableOption = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
};

type RowState = {
  name: string;
  color_oklch: string;
  saving: boolean;
  selectedResponsableId: string;
};

export function FratsTable({
  frats,
  availableResponsables
}: {
  frats: FratWithResponsables[];
  availableResponsables: ResponsableOption[];
}) {
  const [state, setState] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      frats.map((f) => [
        f.id,
        {
          name: f.name,
          color_oklch: f.color_oklch,
          saving: false,
          selectedResponsableId: ""
        }
      ])
    )
  );

  const [isPending, startTransition] = useTransition();
  const disabledGlobally = useMemo(
    () => isPending || frats.length === 0,
    [isPending, frats.length]
  );

  const alreadyResponsableOfSomeFrat = useMemo(() => {
    const ids = new Set<string>();
    for (const f of frats) {
      for (const r of f.responsables ?? []) {
        if (r.profile?.id) ids.add(r.profile.id);
      }
    }
    return ids;
  }, [frats]);

  if (frats.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
        Aucune frat.
      </div>
    );
  }

  async function handleSave(id: string) {
    const row = state[id];
    if (!row) return;

    setState((prev) => ({
      ...prev,
      [id]: { ...prev[id], saving: true }
    }));

    startTransition(async () => {
      await fetch("/api/admin/frats/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id,
          name: row.name.trim(),
          color_oklch: row.color_oklch.trim()
        })
      });
      window.location.reload();
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-600">
            <tr>
              <th className="px-4 py-3 min-w-[220px]">Nom</th>
              <th className="px-4 py-3 min-w-[200px]">Couleur</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {frats.map((f) => {
              const row = state[f.id] ?? {
                name: f.name,
                color_oklch: f.color_oklch,
                saving: false,
                selectedResponsableId: ""
              };

              const options = availableResponsables.filter(
                (p) => !alreadyResponsableOfSomeFrat.has(p.id)
              );

              const isRowBusy = row.saving;

              return (
                <tr key={f.id} className="hover:bg-zinc-50/70 align-top">
                  <td className="px-4 py-3 text-zinc-900">
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            [f.id]: {
                              ...prev[f.id],
                              name: e.target.value
                            }
                          }))
                        }
                        disabled={disabledGlobally || isRowBusy}
                        className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                        placeholder="Nom de la frat"
                      />
                      <div className="flex flex-wrap gap-2">
                        {f.responsables
                          .filter((r) => r.profile)
                          .map((r) => {
                            const p = r.profile!;
                            const fullName = [p.first_name, p.last_name]
                              .map((s) => (s && s.trim()) || "")
                              .filter(Boolean)
                              .join(" ")
                              .trim();
                            const displayName = fullName || p.email;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={async () => {
                                  await fetch(
                                    "/api/admin/frats/remove-responsable",
                                    {
                                      method: "POST",
                                      headers: {
                                        "content-type": "application/json"
                                      },
                                      body: JSON.stringify({
                                        frat_id: f.id,
                                        profile_id: p.id
                                      })
                                    }
                                  );
                                  window.location.reload();
                                }}
                                className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-800 shadow-sm hover:bg-zinc-200"
                                title="Retirer ce responsable"
                              >
                                <span>{displayName}</span>
                                <span aria-hidden="true">×</span>
                              </button>
                            );
                          })}
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={row.selectedResponsableId}
                          onChange={(e) =>
                            setState((prev) => ({
                              ...prev,
                              [f.id]: {
                                ...prev[f.id],
                                selectedResponsableId: e.target.value
                              }
                            }))
                          }
                          disabled={disabledGlobally || isRowBusy}
                          className="h-8 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-xs shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                        >
                          <option value="">
                            {options.length === 0
                              ? "Aucun responsable disponible"
                              : "Choisir un responsable…"}
                          </option>
                          {options.map((p) => {
                            const fullName = [p.first_name, p.last_name]
                              .map((s) => (s && s.trim()) || "")
                              .filter(Boolean)
                              .join(" ")
                              .trim();
                            const label = fullName || p.email;
                            return (
                              <option key={p.id} value={p.id}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                        <button
                          type="button"
                          onClick={async () => {
                            const id = row.selectedResponsableId;
                            if (!id) return;
                            const profile = availableResponsables.find(
                              (p) => p.id === id
                            );
                            if (!profile) return;
                            await fetch("/api/admin/frats/add-responsable", {
                              method: "POST",
                              headers: {
                                "content-type": "application/json"
                              },
                              body: JSON.stringify({
                                frat_id: f.id,
                                email: profile.email
                              })
                            });
                            window.location.reload();
                          }}
                          disabled={
                            disabledGlobally ||
                            isRowBusy ||
                            !row.selectedResponsableId
                          }
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Ajouter le responsable sélectionné"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-900">
                    <input
                      type="color"
                      value={row.color_oklch}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          [f.id]: {
                            ...prev[f.id],
                            color_oklch: e.target.value
                          }
                        }))
                      }
                      disabled={disabledGlobally || isRowBusy}
                      className="h-9 w-9 cursor-pointer rounded-full border border-zinc-200 bg-white p-1 shadow-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleSave(f.id)}
                        disabled={disabledGlobally || isRowBusy}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Enregistrer la frat"
                      >
                        <span className="text-xs">💾</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

