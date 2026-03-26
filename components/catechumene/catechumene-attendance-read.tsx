"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
        isJustifiedAbsence: att.absence_justifiee,
        justificatif: att.justificatif ?? ""
      };
    })
    .filter(Boolean) as {
    id: string;
    date: string;
    libelle: string;
    status: string;
    isJustifiedAbsence: boolean;
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
    if (res.ok) router.refresh();
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground">
        Présences / absences aux évènements
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Liste des évènements pour lesquels une présence a été saisie.
      </p>

      <div className="mt-4 space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-foreground break-words">
                  {formatDateShort(r.date)} — {r.libelle}
                </div>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                      r.isJustifiedAbsence
                        ? "border-border bg-muted text-foreground"
                        : "border-primary/30 bg-primary/10 text-primary"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(r.id)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground shadow-sm transition hover:bg-muted"
                title="Supprimer la présence"
                aria-label="Supprimer la présence"
              >
                🗑️
              </button>
            </div>

            {r.justificatif ? (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-muted-foreground">Justificatif :</span>{" "}
                {r.justificatif}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

