"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground shadow-sm transition hover:bg-muted"
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
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="add-attendance-title"
                  className="text-lg font-semibold text-foreground"
                >
                  Ajouter une présence
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sélectionnez un évènement sans présence enregistrée. Filtrez par
                  plage de dates si nécessaire.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground shadow-sm transition hover:bg-muted"
              >
                Fermer
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-muted p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Filtre date à date
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={useRangeFilter}
                    onClick={() => setUseRangeFilter((v) => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                      useRangeFilter
                        ? "border-primary bg-primary"
                        : "border-border bg-muted"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-card shadow-sm transition-transform ${
                        useRangeFilter ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                <div className="text-xs text-muted-foreground">
                  {candidates.length} évènement{candidates.length > 1 ? "s" : ""}{" "}
                  sans présence
                </div>
              </div>

              {useRangeFilter ? (
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <div className="space-y-1">
                    <label
                      className="text-xs font-medium text-muted-foreground"
                      htmlFor="att-from"
                    >
                      Du
                    </label>
                    <input
                      id="att-from"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="h-9 rounded-lg border border-border bg-card px-3 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      className="text-xs font-medium text-muted-foreground"
                      htmlFor="att-to"
                    >
                      Au
                    </label>
                    <input
                      id="att-to"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="h-9 rounded-lg border border-border bg-card px-3 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMonth((m) => addMonths(m, -1))}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-3 text-sm font-medium text-muted-foreground shadow-sm transition hover:bg-muted"
                    aria-label="Mois précédent"
                  >
                    ←
                  </button>
                  <div className="min-w-[180px] text-center text-sm font-semibold text-foreground capitalize">
                    {formatMonthTitle(month)}
                  </div>
                  <button
                    type="button"
                    onClick={() => setMonth((m) => addMonths(m, 1))}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-3 text-sm font-medium text-muted-foreground shadow-sm transition hover:bg-muted"
                    aria-label="Mois suivant"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonth(startOfMonth(new Date()))}
                    className="ml-2 inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-3 text-sm font-medium text-muted-foreground shadow-sm transition hover:bg-muted"
                  >
                    Mois courant
                  </button>
                </div>
              )}
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                {success}
              </div>
            ) : null}

            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={saveAll}
                disabled={isPending}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>

            {/* Mobile: cartes */}
            <div className="mt-4 space-y-3 sm:hidden">
              {candidates.length === 0 ? (
                <div className="rounded-xl border border-border bg-card px-4 py-4 text-center text-sm text-muted-foreground">
                  Aucun évènement disponible.
                </div>
              ) : (
                candidates.map((e) => {
                  const row = state[e.id] ?? {
                    selected: false,
                    absence_justifiee: false,
                    justificatif: ""
                  };
                  return (
                    <div
                      key={e.id}
                      className="rounded-xl border border-border bg-card p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={(ev) =>
                            setRow(e.id, { selected: ev.target.checked })
                          }
                          className="mt-1 h-4 w-4 shrink-0 accent-primary"
                          aria-label="Sélectionner l'évènement"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-foreground">
                            {formatDateShort(e.date)} — {e.libelle}
                          </div>

                          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <input
                              id={`aj-${e.id}`}
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
                              className="h-4 w-4 accent-primary"
                            />
                            <label htmlFor={`aj-${e.id}`}>Absence justifiée</label>
                          </div>

                          {row.absence_justifiee ? (
                            <div className="mt-2">
                              <input
                                type="text"
                                value={row.justificatif}
                                onChange={(ev) =>
                                  setRow(e.id, { justificatif: ev.target.value })
                                }
                                placeholder="Justificatif (optionnel)"
                                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop: tableau */}
            <div className="mt-4 hidden overflow-hidden rounded-xl border border-border sm:block">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="w-12 px-4 py-3">Ajout</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Évènement</th>
                      <th className="px-4 py-3">Absence justifiée</th>
                      <th className="px-4 py-3">Justificatif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {candidates.length === 0 ? (
                      <tr>
                        <td
                          className="px-4 py-4 text-center text-sm text-muted-foreground"
                          colSpan={5}
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
                          <tr key={e.id} className="hover:bg-muted/70">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={row.selected}
                                onChange={(ev) =>
                                  setRow(e.id, { selected: ev.target.checked })
                                }
                                className="h-4 w-4 accent-primary"
                                aria-label="Sélectionner l'évènement"
                              />
                            </td>
                            <td className="px-4 py-3 text-foreground">
                              {formatDateShort(e.date)}
                            </td>
                            <td className="px-4 py-3 text-foreground">
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
                                className="h-4 w-4 accent-primary"
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
                                className="h-9 w-56 rounded-lg border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
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

