"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  EVENT_VISIBILITY_OPTIONS,
  type Event,
  type EventVisibility
} from "@/lib/events";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

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
  visibility: EventVisibility;
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
    descriptif: e.descriptif ?? "",
    visibility: e.visibility ?? "tout"
  };
}

export function ResponsableEventsCalendar({
  events,
  readOnly = false
}: {
  events: Event[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [month, setMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Event | null>(null);
  const [dayPicker, setDayPicker] = useState<{
    iso: string;
    events: Event[];
  } | null>(null);
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

  const monthRange = useMemo(() => {
    const firstDay = startOfMonth(month);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    return {
      from: toISODate(firstDay),
      to: toISODate(lastDay)
    };
  }, [month]);

  const listFiltered = useMemo(() => {
    return events
      .filter((e) => {
        const d = (e.date ?? "").trim();
        if (!d) return false;
        if (d < monthRange.from) return false;
        if (d > monthRange.to) return false;
        return true;
      })
      .slice()
      .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  }, [events, monthRange]);

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
        descriptif: editing.descriptif.trim() || undefined,
        visibility: editing.visibility
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
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            Affichage liste
          </span>
          <Switch
            checked={viewMode === "list"}
            aria-label="Basculer entre affichage liste et calendrier"
            onCheckedChange={(checked) =>
              setViewMode(checked ? "list" : "calendar")
            }
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-card px-3 text-sm font-medium text-muted-foreground shadow-sm transition hover:bg-muted"
          >
            ←
          </button>
          <div className="flex items-center gap-2">
            <Select
              value={String(month.getMonth())}
              onValueChange={(v) =>
                setMonth((m) => setMonthYear(m, parseInt(v, 10), m.getFullYear()))
              }
            >
              <SelectTrigger className="h-10 w-auto min-w-[140px] text-muted-foreground">
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(month.getFullYear())}
              onValueChange={(v) =>
                setMonth((m) => setMonthYear(m, m.getMonth(), parseInt(v, 10)))
              }
            >
              <SelectTrigger className="h-10 w-auto min-w-[100px] text-muted-foreground">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="sr-only">{formatMonthTitle(month)}</span>
          </div>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-card px-3 text-sm font-medium text-muted-foreground shadow-sm transition hover:bg-muted"
          >
            →
          </button>
          <button
            type="button"
            onClick={() => setMonth(startOfMonth(new Date()))}
            className="ml-2 inline-flex h-10 items-center justify-center rounded-xl border border-border bg-card px-3 text-sm font-medium text-muted-foreground shadow-sm transition hover:bg-muted"
          >
            Aujourd&apos;hui
          </button>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="grid grid-cols-7 border-b border-border bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                  className={`min-h-[110px] border-t border-border p-2 ${
                    inMonth ? "bg-card" : "bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`text-xs font-semibold ${
                        inMonth ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {d.getDate()}
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    {/* Desktop/tablet: afficher le texte des évènements */}
                    <div className="hidden sm:block space-y-1">
                      {dayEvents.slice(0, 3).map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => setSelected(e)}
                          className="block w-full truncate rounded-lg border border-border bg-muted px-2 py-1 text-left text-xs text-foreground hover:bg-muted"
                          title={e.libelle}
                        >
                          <span className="font-medium">{e.type}</span>{" "}
                          <span className="text-muted-foreground">— {e.libelle}</span>
                        </button>
                      ))}
                      {dayEvents.length > 3 ? (
                        <div className="text-xs text-muted-foreground">
                          +{dayEvents.length - 3}
                        </div>
                      ) : null}
                    </div>

                    {/* Mobile: icône cliquable + compteur */}
                    {dayEvents.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setDayPicker({ iso, events: dayEvents })}
                        className="sm:hidden inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                        aria-label={`Voir les évènements du ${formatDateLong(iso)}`}
                      >
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full bg-primary"
                          aria-hidden
                        />
                        <span>{dayEvents.length}</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold capitalize text-foreground">
            {formatMonthTitle(month)}
          </h2>
          {listFiltered.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
              Aucun évènement ce mois-ci.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {listFiltered.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setSelected(e)}
                  className="text-left rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {formatDateLong(e.date)}
                  </p>
                  <div className="mt-1 flex items-start justify-between gap-4">
                    <h3 className="min-w-0 truncate text-base font-semibold text-foreground">
                      {e.libelle}
                    </h3>
                    <span className="shrink-0 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      {e.type}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{e.lieu}</p>
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
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {formatDateLong(selected.date)}
                </p>
                <h2
                  id="event-detail-title"
                  className="mt-1 text-lg font-semibold text-foreground"
                >
                  {selected.libelle}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{selected.lieu}</p>
              </div>
              <span className="shrink-0 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {selected.type}
              </span>
            </div>

            {selected.descriptif?.trim() ? (
              <div className="mt-4 rounded-xl border border-border/60 bg-muted p-4">
                <MarkdownContent content={selected.descriptif} />
              </div>
            ) : null}

            <div className="mt-6 flex gap-3">
              {!readOnly ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(eventToEditValues(selected));
                    setSelected(null);
                  }}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
                >
                  Modifier
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className={`inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-medium text-muted-foreground shadow-sm transition hover:bg-muted ${
                  readOnly ? "flex-1" : ""
                }`}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {dayPicker ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="day-events-title"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2
                id="day-events-title"
                className="text-lg font-semibold text-foreground capitalize"
              >
                {formatDateLong(dayPicker.iso)}
              </h2>
              <button
                type="button"
                onClick={() => setDayPicker(null)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground shadow-sm transition hover:bg-muted"
              >
                Fermer
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {dayPicker.events.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => {
                    setDayPicker(null);
                    setSelected(e);
                  }}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-left text-sm shadow-sm transition hover:bg-muted"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-foreground">
                        {e.libelle}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {e.lieu}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {e.type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {!readOnly && editing ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-edit-title"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 id="event-edit-title" className="text-lg font-semibold text-foreground">
              Modifier l&apos;évènement
            </h2>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="re-date">
                  Date
                </label>
                <input
                  id="re-date"
                  type="date"
                  value={editing.date}
                  onChange={(e) => setEditing((v) => (v ? { ...v, date: e.target.value } : null))}
                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="re-type">
                    Type d&apos;évènement
                  </label>
                  <Select
                    value={editing.type_option}
                    onValueChange={(v) =>
                      setEditing((prev) =>
                        prev ? { ...prev, type_option: v as EventTypeOption } : null
                      )
                    }
                  >
                    <SelectTrigger id="re-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                      <SelectItem value="autre">Autre…</SelectItem>
                    </SelectContent>
                  </Select>
                  {editing.type_option === "autre" ? (
                    <input
                      type="text"
                      value={editing.type_autre}
                      onChange={(e) =>
                        setEditing((v) => (v ? { ...v, type_autre: e.target.value } : null))
                      }
                      className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
                      placeholder="Saisir un autre type…"
                      required
                    />
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="re-lieu">
                    Lieu
                  </label>
                  <input
                    id="re-lieu"
                    type="text"
                    value={editing.lieu}
                    onChange={(e) => setEditing((v) => (v ? { ...v, lieu: e.target.value } : null))}
                    className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="re-libelle">
                  Libellé
                </label>
                <input
                  id="re-libelle"
                  type="text"
                  value={editing.libelle}
                  onChange={(e) =>
                    setEditing((v) => (v ? { ...v, libelle: e.target.value } : null))
                  }
                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="re-visibility">
                  Visibilite
                </label>
                <Select
                  value={editing.visibility}
                  onValueChange={(v) =>
                    setEditing((prev) =>
                      prev ? { ...prev, visibility: v as EventVisibility } : null
                    )
                  }
                >
                  <SelectTrigger id="re-visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_VISIBILITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="re-desc">
                  Descriptif (Markdown)
                </label>
                <textarea
                  id="re-desc"
                  rows={5}
                  value={editing.descriptif}
                  onChange={(e) =>
                    setEditing((v) => (v ? { ...v, descriptif: e.target.value } : null))
                  }
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-mono shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
                />
              </div>

              {editing.descriptif.trim() ? (
                <div className="rounded-xl border border-border bg-muted p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Aperçu
                  </p>
                  <div className="mt-2">
                    <MarkdownContent content={editing.descriptif} />
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={isPending}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {isPending ? "Enregistrement…" : "Enregistrer"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  disabled={isPending}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-medium text-muted-foreground shadow-sm transition hover:bg-muted disabled:opacity-60"
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

