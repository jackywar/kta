"use client";

import { useMemo, useState, useTransition } from "react";
import type { Event } from "@/lib/events";
import { MarkdownContent } from "@/components/ui/markdown-content";

const EVENT_TYPE_OPTIONS = ["rencontre", "reunion equipe", "étape"] as const;
type EventTypeOption = (typeof EVENT_TYPE_OPTIONS)[number] | "autre";

type ViewMode = "calendar" | "list";

type EditValues = {
  id: string;
  date: string;
  type_option: EventTypeOption;
  type_autre: string;
  libelle: string;
  lieu: string;
  descriptif: string;
};

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function setMonthYear(d: Date, monthIndex: number, year: number): Date {
  return new Date(year, monthIndex, 1);
}

function formatMonthTitle(d: Date): string {
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function formatDateLong(s: string): string {
  try {
    return new Date(s).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  } catch {
    return s;
  }
}

function eventToEditValues(e: Event): EditValues {
  const t = (e.type ?? "").trim();
  const option = (EVENT_TYPE_OPTIONS as readonly string[]).includes(t)
    ? (t as EventTypeOption)
    : ("autre" as const);
  return {
    id: e.id,
    date: e.date ?? "",
    type_option: option,
    type_autre: option === "autre" ? t : "",
    libelle: e.libelle ?? "",
    lieu: e.lieu ?? "",
    descriptif: e.descriptif ?? ""
  };
}

export function ResponsableEventsCalendar({ events }: { events: Event[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [month, setMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selected, setSelected] = useState<Event | null>(null);
  const [editing, setEditing] = useState<EditValues | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return [y - 2, y - 1, y, y + 1, y + 2];
  }, []);

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        value: i,
        label: new Date(2020, i, 1).toLocaleDateString("fr-FR", { month: "long" })
      })),
    []
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const e of events) {
      const key = (e.date ?? "").trim();
      if (!key) continue;
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    for (const [k, arr] of map) {
      arr.sort((a, b) => (a.type ?? "").localeCompare(b.type ?? ""));
      map.set(k, arr);
    }
    return map;
  }, [events]);

  const listFiltered = useMemo(() => {
    const from = dateFrom.trim();
    const to = dateTo.trim();
    return events
      .filter((e) => {
        const d = (e.date ?? "").trim();
        if (!d) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      })
      .slice()
      .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  }, [events, dateFrom, dateTo]);

  const monthDays = useMemo(() => {
    const first = startOfMonth(month);
    const start = new Date(first);
    const day = start.getDay(); // 0=dim
    const mondayIndex = (day + 6) % 7; // 0=lun
    start.setDate(start.getDate() - mondayIndex);

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [month]);

  async function saveEdit() {
    if (!editing) return;
    setError(null);
    startTransition(async () => {
      const typeValue =
        editing.type_option === "autre"
          ? editing.type_autre.trim()
          : editing.type_option;

      const body = {
        id: editing.id,
        date: editing.date.trim(),
        type: typeValue,
        libelle: editing.libelle.trim(),
        lieu: editing.lieu.trim(),
        descriptif: editing.descriptif.trim() || undefined
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
      window.location.reload();
    });
  }

  const switchBase =
    "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-zinc-700">
            Affichage liste
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={viewMode === "list"}
            onClick={() =>
              setViewMode((v) => (v === "list" ? "calendar" : "list"))
            }
            className={`${switchBase} ${
              viewMode === "list"
                ? "border-zinc-900 bg-zinc-900"
                : "border-zinc-200 bg-zinc-100"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                viewMode === "list" ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {viewMode === "calendar" ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMonth((m) => addMonths(m, -1))}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
              ←
            </button>
            <div className="flex items-center gap-2">
              <select
                value={month.getMonth()}
                onChange={(e) =>
                  setMonth((m) =>
                    setMonthYear(m, parseInt(e.target.value, 10), m.getFullYear())
                  )
                }
                className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                aria-label="Mois"
              >
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value} className="capitalize">
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={month.getFullYear()}
                onChange={(e) =>
                  setMonth((m) =>
                    setMonthYear(m, m.getMonth(), parseInt(e.target.value, 10))
                  )
                }
                className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                aria-label="Année"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <span className="sr-only">{formatMonthTitle(month)}</span>
            </div>
            <button
              type="button"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
              →
            </button>
            <button
              type="button"
              onClick={() => setMonth(startOfMonth(new Date()))}
              className="ml-2 inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
              Aujourd'hui
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700" htmlFor="re-from">
                Du
              </label>
              <input
                id="re-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700" htmlFor="re-to">
                Au
              </label>
              <input
                id="re-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              />
            </div>
          </div>
        )}
      </div>

      {viewMode === "calendar" ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-600">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
              <div key={d} className="px-3 py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((d) => {
              const iso = toISODate(d);
              const inMonth = d.getMonth() === month.getMonth();
              const dayEvents = eventsByDate.get(iso) ?? [];
              return (
                <div
                  key={iso}
                  className={`min-h-[110px] border-t border-zinc-200 p-2 ${
                    inMonth ? "bg-white" : "bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`text-xs font-semibold ${
                        inMonth ? "text-zinc-900" : "text-zinc-400"
                      }`}
                    >
                      {d.getDate()}
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    {dayEvents.slice(0, 3).map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setSelected(e)}
                        className="block w-full truncate rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-left text-xs text-zinc-800 hover:bg-zinc-100"
                        title={e.libelle}
                      >
                        <span className="font-medium">{e.type}</span>{" "}
                        <span className="text-zinc-600">— {e.libelle}</span>
                      </button>
                    ))}
                    {dayEvents.length > 3 ? (
                      <div className="text-xs text-zinc-500">
                        +{dayEvents.length - 3}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {listFiltered.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600 shadow-sm">
              Aucun évènement.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {listFiltered.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setSelected(e)}
                  className="text-left rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    {formatDateLong(e.date)}
                  </p>
                  <div className="mt-1 flex items-start justify-between gap-4">
                    <h3 className="min-w-0 truncate text-base font-semibold text-zinc-900">
                      {e.libelle}
                    </h3>
                    <span className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
                      {e.type}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">{e.lieu}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-detail-title"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {formatDateLong(selected.date)}
                </p>
                <h2
                  id="event-detail-title"
                  className="mt-1 text-lg font-semibold text-zinc-900"
                >
                  {selected.libelle}
                </h2>
                <p className="mt-1 text-sm text-zinc-600">{selected.lieu}</p>
              </div>
              <span className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
                {selected.type}
              </span>
            </div>

            {selected.descriptif?.trim() ? (
              <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                <MarkdownContent content={selected.descriptif} />
              </div>
            ) : null}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditing(eventToEditValues(selected));
                  setSelected(null);
                }}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editing ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-edit-title"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h2 id="event-edit-title" className="text-lg font-semibold text-zinc-900">
              Modifier l'évènement
            </h2>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900" htmlFor="re-date">
                  Date
                </label>
                <input
                  id="re-date"
                  type="date"
                  value={editing.date}
                  onChange={(e) => setEditing((v) => (v ? { ...v, date: e.target.value } : null))}
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900" htmlFor="re-type">
                    Type d'évènement
                  </label>
                  <select
                    id="re-type"
                    value={editing.type_option}
                    onChange={(e) =>
                      setEditing((v) =>
                        v ? { ...v, type_option: e.target.value as EventTypeOption } : null
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
                  {editing.type_option === "autre" ? (
                    <input
                      type="text"
                      value={editing.type_autre}
                      onChange={(e) =>
                        setEditing((v) => (v ? { ...v, type_autre: e.target.value } : null))
                      }
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                      placeholder="Saisir un autre type…"
                      required
                    />
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900" htmlFor="re-lieu">
                    Lieu
                  </label>
                  <input
                    id="re-lieu"
                    type="text"
                    value={editing.lieu}
                    onChange={(e) => setEditing((v) => (v ? { ...v, lieu: e.target.value } : null))}
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900" htmlFor="re-libelle">
                  Libellé
                </label>
                <input
                  id="re-libelle"
                  type="text"
                  value={editing.libelle}
                  onChange={(e) =>
                    setEditing((v) => (v ? { ...v, libelle: e.target.value } : null))
                  }
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900" htmlFor="re-desc">
                  Descriptif (Markdown)
                </label>
                <textarea
                  id="re-desc"
                  rows={5}
                  value={editing.descriptif}
                  onChange={(e) =>
                    setEditing((v) => (v ? { ...v, descriptif: e.target.value } : null))
                  }
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-mono shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                />
              </div>

              {editing.descriptif.trim() ? (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Aperçu
                  </p>
                  <div className="mt-2">
                    <MarkdownContent content={editing.descriptif} />
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
                  onClick={saveEdit}
                  disabled={isPending}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60"
                >
                  {isPending ? "Enregistrement…" : "Enregistrer"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
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
    </div>
  );
}

