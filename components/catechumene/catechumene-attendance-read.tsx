"use client";

import type { Event } from "@/lib/events";
import type { EventAttendance } from "@/lib/event-attendances";

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

export function CatechumeneAttendanceRead({
  catechumeneId,
  events,
  attendances
}: {
  catechumeneId: string;
  events: Pick<Event, "id" | "date" | "libelle">[];
  attendances: Pick<
    EventAttendance,
    "event_id" | "absence_justifiee" | "justificatif"
  >[];
}) {
  const attendanceByEvent = new Map<
    string,
    Pick<
      EventAttendance,
      "absence_justifiee" | "justificatif"
    >
  >();
  for (const a of attendances) {
    attendanceByEvent.set(a.event_id, {
      absence_justifiee: a.absence_justifiee,
      justificatif: a.justificatif
    });
  }

  const rows = events
    .map((e) => {
      const att = attendanceByEvent.get(e.id);
      if (!att) return null;
      const status = att.absence_justifiee ? "Absent (justifié)" : "Présent";
      return {
        id: e.id,
        date: e.date,
        libelle: e.libelle,
        status,
        justificatif: att.justificatif ?? ""
      };
    })
    .filter(Boolean) as {
    id: string;
    date: string;
    libelle: string;
    status: string;
    justificatif: string;
  }[];

  if (rows.length === 0) {
    return null;
  }

  async function handleDelete(eventId: string) {
    if (!confirm("Supprimer cette présence ?")) return;
    const res = await fetch("/api/attendance/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event_id: eventId, catechumene_id: catechumeneId })
    });
    if (res.ok) window.location.reload();
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">
        Présences / absences aux évènements
      </h2>
      <p className="mt-1 text-sm text-zinc-600">
        Liste des évènements pour lesquels une présence a été saisie.
      </p>

      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-0.5">
              <div className="font-medium">
                {formatDateShort(r.date)} — {r.libelle}
              </div>
              <div className="text-xs text-zinc-600">{r.status}</div>
              {r.justificatif ? (
                <div className="text-xs text-zinc-500">
                  Justificatif : {r.justificatif}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => handleDelete(r.id)}
              className="mt-2 inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 sm:mt-0"
              title="Supprimer la présence"
              aria-label="Supprimer la présence"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

