"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { Event } from "@/lib/events";
import { MarkdownContent } from "@/components/ui/markdown-content";

const EVENT_TYPE_OPTIONS = ["rencontre", "reunion equipe", "étape"] as const;
type EventTypeOption = (typeof EVENT_TYPE_OPTIONS)[number] | "autre";

type FormValues = {
  date: string;
  type: string;
  type_option: EventTypeOption;
  type_autre: string;
  libelle: string;
  lieu: string;
  descriptif: string;
};

function eventToForm(e: Event): FormValues {
  const t = (e.type ?? "").trim();
  const option = (EVENT_TYPE_OPTIONS as readonly string[]).includes(t)
    ? (t as EventTypeOption)
    : ("autre" as const);
  return {
    date: e.date ?? "",
    type: e.type ?? "",
    type_option: option,
    type_autre: option === "autre" ? t : "",
    libelle: e.libelle ?? "",
    lieu: e.lieu ?? "",
    descriptif: e.descriptif ?? ""
  };
}

function formatDate(s: string): string {
  try {
    return new Date(s).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch {
    return s;
  }
}

export function EventsTable({ events }: { events: Event[] }) {
  const router = useRouter();
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<FormValues | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    const from = dateFrom.trim();
    const to = dateTo.trim();
    return events.filter((e) => {
      const d = (e.date ?? "").trim();
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [events, dateFrom, dateTo]);

  const editing = useMemo(
    () => (editingId ? events.find((e) => e.id === editingId) : null),
    [editingId, events]
  );

  const openEdit = (e: Event) => {
    setEditingId(e.id);
    setEditValues(eventToForm(e));
    setError(null);
  };

  const closeEdit = () => {
    setEditingId(null);
    setEditValues(null);
    setError(null);
  };

  const set = (key: keyof FormValues, value: string) => {
    setEditValues((v) => (v ? { ...v, [key]: value } : null));
  };

  async function handleSave() {
    if (!editingId || !editValues) return;
    setError(null);
    startTransition(async () => {
      const typeValue =
        editValues.type_option === "autre"
          ? editValues.type_autre.trim()
          : editValues.type_option;
      const body = {
        id: editingId,
        date: editValues.date.trim(),
        type: typeValue,
        libelle: editValues.libelle.trim(),
        lieu: editValues.lieu.trim(),
        descriptif: editValues.descriptif.trim() || undefined
      };

      const res = await fetch("/api/admin/events/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
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
      closeEdit();
      router.refresh();
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet évènement ?")) return;
    const res = await fetch("/api/admin/events/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (res.ok) router.refresh();
  }

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
        Aucun évènement.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700" htmlFor="ev-from">
              Du
            </label>
            <input
              id="ev-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700" htmlFor="ev-to">
              Au
            </label>
            <input
              id="ev-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
            />
          </div>
        </div>
        <div className="text-xs text-zinc-500">
          {filteredEvents.length} évènement{filteredEvents.length > 1 ? "s" : ""}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-600">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Libellé</th>
                <th className="px-4 py-3">Lieu</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {filteredEvents.map((e) => (
                <tr key={e.id} className="hover:bg-zinc-50/70">
                  <td className="px-4 py-3 text-zinc-900">{formatDate(e.date)}</td>
                  <td className="px-4 py-3 text-zinc-900">{e.type}</td>
                  <td className="px-4 py-3 text-zinc-900">{e.libelle}</td>
                  <td className="px-4 py-3 text-zinc-600">{e.lieu}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(e)}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(e.id)}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-700 shadow-sm transition hover:bg-red-50"
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

      {editing && editValues ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-event-title"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h2 id="edit-event-title" className="text-lg font-semibold text-zinc-900">
              Modifier l&apos;évènement
            </h2>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900" htmlFor="ee-date">
                  Date
                </label>
                <input
                  id="ee-date"
                  type="date"
                  value={editValues.date}
                  onChange={(e) => set("date", e.target.value)}
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900" htmlFor="ee-type">
                    Type d&apos;évènement
                  </label>
                  <select
                    id="ee-type"
                    value={editValues.type_option}
                    onChange={(e) =>
                      setEditValues((v) =>
                        v
                          ? ({
                              ...v,
                              type_option: e.target.value as EventTypeOption
                            } as FormValues)
                          : null
                      )
                    }
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                    required
                  >
                    {EVENT_TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    <option value="autre">Autre…</option>
                  </select>
                  {editValues.type_option === "autre" ? (
                    <input
                      type="text"
                      value={editValues.type_autre}
                      onChange={(e) => set("type_autre", e.target.value)}
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                      placeholder="Saisir un autre type…"
                      required
                    />
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900" htmlFor="ee-lieu">
                    Lieu
                  </label>
                  <input
                    id="ee-lieu"
                    type="text"
                    value={editValues.lieu}
                    onChange={(e) => set("lieu", e.target.value)}
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900" htmlFor="ee-libelle">
                  Libellé
                </label>
                <input
                  id="ee-libelle"
                  type="text"
                  value={editValues.libelle}
                  onChange={(e) => set("libelle", e.target.value)}
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900" htmlFor="ee-desc">
                  Descriptif (Markdown)
                </label>
                <textarea
                  id="ee-desc"
                  rows={5}
                  value={editValues.descriptif}
                  onChange={(e) => set("descriptif", e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-mono shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                />
              </div>

              {editValues.descriptif.trim() ? (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Aperçu
                  </p>
                  <div className="mt-2">
                    <MarkdownContent content={editValues.descriptif} />
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </div>
              ) : null}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60"
                >
                  {isPending ? "Enregistrement…" : "Enregistrer"}
                </button>
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={isPending}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

