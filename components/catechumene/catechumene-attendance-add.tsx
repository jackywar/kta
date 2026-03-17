"use client";

import { useMemo, useState, useTransition } from "react";
import type { Event } from "@/lib/events";
import type { EventAttendance } from "@/lib/event-attendances";

type RowState = {
  selected: boolean;
  absence_justifiee: boolean;
  justificatif: string;
};

function formatDateShort(s: string): string {
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

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function monthRange(d: Date): { from: string; to: string } {
  const y = d.getFullYear();
  const m = d.getMonth();
  const from = new Date(y, m, 1);
  const to = new Date(y, m + 1, 0);
  const iso = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(
      x.getDate()
    ).padStart(2, "0")}`;
  return { from: iso(from), to: iso(to) };
}

function formatMonthTitle(d: Date): string {
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export function CatechumeneAttendanceAdd({
  catechumeneId,
  events,
  attendances
}: {
  catechumeneId: string;
  events: Pick<Event, "id" | "date" | "libelle">[];
  attendances: Pick<EventAttendance, "event_id">[];
}) {
  const [open, setOpen] = useState(false);
  const [useRangeFilter, setUseRangeFilter] = useState(false);
  const [month, setMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [state, setState] = useState<Record<string, RowState>>({});
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const alreadyHasAttendance = useMemo(() => {
    const set = new Set<string>();
    for (const a of attendances) set.add(a.event_id);
    return set;
  }, [attendances]);

  const candidates = useMemo(() => {
    const from = useRangeFilter ? dateFrom.trim() : monthRange(month).from;
    const to = useRangeFilter ? dateTo.trim() : monthRange(month).to;
    return events
      .filter((e) => !alreadyHasAttendance.has(e.id))
      .filter((e) => {
        const d = (e.date ?? "").trim();
        if (!d) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      })
      .slice()
      .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  }, [events, alreadyHasAttendance, dateFrom, dateTo, useRangeFilter, month]);

  const setRow = (eventId: string, patch: Partial<RowState>) => {
    setState((prev) => ({
      ...prev,
      [eventId]: {
        ...(prev[eventId] ?? {
          selected: false,
          absence_justifiee: false,
          justificatif: ""
        }),
        ...patch
      }
    }));
  };

  async function saveAll() {
    setError(null);
    setSuccess(null);

    const items = candidates
      .map((e) => {
        const row = state[e.id];
        if (!row?.selected) return null;
        return {
          event_id: e.id,
          catechumene_id: catechumeneId,
          absence_justifiee: row.absence_justifiee,
          justificatif: row.absence_justifiee ? row.justificatif : undefined
        };
      })
      .filter(Boolean) as {
      event_id: string;
      catechumene_id: string;
      absence_justifiee?: boolean;
      justificatif?: string;
    }[];

    if (items.length === 0) {
      setError("Sélectionnez au moins un évènement à enregistrer.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/attendance/bulk-upsert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items })
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
      setSuccess("Présences enregistrées.");
      window.location.reload();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
      >
        Ajouter présence
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-attendance-title"
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="add-attendance-title"
                  className="text-lg font-semibold text-zinc-900"
                >
                  Ajouter une présence
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Sélectionnez un évènement sans présence enregistrée. Filtrez par
                  plage de dates si nécessaire.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
              >
                Fermer
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-700">
                    Filtre date à date
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={useRangeFilter}
                    onClick={() => setUseRangeFilter((v) => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 ${
                      useRangeFilter
                        ? "border-zinc-900 bg-zinc-900"
                        : "border-zinc-200 bg-zinc-100"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        useRangeFilter ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                <div className="text-xs text-zinc-500">
                  {candidates.length} évènement{candidates.length > 1 ? "s" : ""}{" "}
                  sans présence
                </div>
              </div>

              {useRangeFilter ? (
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <div className="space-y-1">
                    <label
                      className="text-xs font-medium text-zinc-700"
                      htmlFor="att-from"
                    >
                      Du
                    </label>
                    <input
                      id="att-from"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      className="text-xs font-medium text-zinc-700"
                      htmlFor="att-to"
                    >
                      Au
                    </label>
                    <input
                      id="att-to"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMonth((m) => addMonths(m, -1))}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                    aria-label="Mois précédent"
                  >
                    ←
                  </button>
                  <div className="min-w-[180px] text-center text-sm font-semibold text-zinc-900 capitalize">
                    {formatMonthTitle(month)}
                  </div>
                  <button
                    type="button"
                    onClick={() => setMonth((m) => addMonths(m, 1))}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                    aria-label="Mois suivant"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonth(startOfMonth(new Date()))}
                    className="ml-2 inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                  >
                    Mois courant
                  </button>
                </div>
              )}
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {success}
              </div>
            ) : null}

            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={saveAll}
                disabled={isPending}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                    <tr>
                      <th className="w-12 px-4 py-3">Ajout</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Évènement</th>
                      <th className="px-4 py-3">Absence justifiée</th>
                      <th className="px-4 py-3">Justificatif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white">
                    {candidates.length === 0 ? (
                      <tr>
                        <td
                          className="px-4 py-4 text-center text-sm text-zinc-500"
                          colSpan={6}
                        >
                          Aucun évènement disponible.
                        </td>
                      </tr>
                    ) : (
                      candidates.map((e) => {
                        const row = state[e.id] ?? {
                          selected: false,
                          absence_justifiee: false,
                          justificatif: ""
                        };

                        return (
                          <tr key={e.id} className="hover:bg-zinc-50/70">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={row.selected}
                                onChange={(ev) =>
                                  setRow(e.id, { selected: ev.target.checked })
                                }
                                className="h-4 w-4 accent-zinc-900"
                                aria-label="Sélectionner l'évènement"
                              />
                            </td>
                            <td className="px-4 py-3 text-zinc-900">
                              {formatDateShort(e.date)}
                            </td>
                            <td className="px-4 py-3 text-zinc-900">
                              {e.libelle}
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={row.absence_justifiee}
                                onChange={(ev) =>
                                  setRow(e.id, {
                                    absence_justifiee: ev.target.checked,
                                    justificatif: ev.target.checked
                                      ? row.justificatif
                                      : ""
                                  })
                                }
                                className="h-4 w-4 accent-zinc-900 disabled:opacity-50"
                                aria-label="Absence justifiée"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={row.justificatif}
                                disabled={!row.absence_justifiee}
                                onChange={(ev) =>
                                  setRow(e.id, { justificatif: ev.target.value })
                                }
                                placeholder="Optionnel"
                                className="h-9 w-56 rounded-lg border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 disabled:opacity-50"
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

