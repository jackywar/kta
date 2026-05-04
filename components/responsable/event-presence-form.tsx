"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { CatechumeneWithFrat } from "@/lib/catechumenes";
import { CatechumeneTile } from "@/components/responsable/catechumene-tiles";
import { Checkbox } from "@/components/ui/checkbox";

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

export function EventPresenceForm({
  eventId,
  eventDate,
  eventLibelle,
  catechumenes,
  initialPresentCatechumeneIds,
  initialJustifiedAbsenceCatechumeneIds
}: {
  eventId: string;
  eventDate: string;
  eventLibelle: string;
  catechumenes: CatechumeneWithFrat[];
  initialPresentCatechumeneIds: string[];
  initialJustifiedAbsenceCatechumeneIds: string[];
}) {
  const router = useRouter();
  const justifiedAbsenceSet = useMemo(
    () => new Set(initialJustifiedAbsenceCatechumeneIds),
    [initialJustifiedAbsenceCatechumeneIds]
  );

  const [present, setPresent] = useState<Record<string, boolean>>(() => {
    const justified = new Set(initialJustifiedAbsenceCatechumeneIds);
    const presentIds = new Set(initialPresentCatechumeneIds);
    const r: Record<string, boolean> = {};
    for (const c of catechumenes) {
      r[c.id] = !justified.has(c.id) && presentIds.has(c.id);
    }
    return r;
  });

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function setPresentFor(id: string, value: boolean) {
    if (justifiedAbsenceSet.has(id)) return;
    setPresent((prev) => ({ ...prev, [id]: value }));
  }

  function save() {
    setError(null);

    const items = catechumenes
      .filter((c) => present[c.id] && !justifiedAbsenceSet.has(c.id))
      .map((c) => ({
        event_id: eventId,
        catechumene_id: c.id,
        absence_justifiee: false as const
      }));

    if (items.length === 0) {
      setError("Cochez au moins un catéchumène présent.");
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
      router.push("/responsable/events");
    });
  }

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {formatDateLong(eventDate)}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {eventLibelle}
        </h1>
      </header>

      {catechumenes.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Aucun catéchumène.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {catechumenes.map((c) => {
            const justified = justifiedAbsenceSet.has(c.id);
            return (
              <li key={c.id}>
                <CatechumeneTile
                  catechumene={c}
                  clickable={false}
                  footer={
                    justified ? (
                      <div
                        className="flex flex-col items-center gap-1 text-center text-muted-foreground"
                        aria-label={`Absence justifiée — ${c.prenom} ${c.nom}`}
                      >
                        <div className="flex items-center justify-center gap-2 text-sm opacity-80">
                          <Checkbox checked={false} disabled />
                          <span>Présent</span>
                        </div>
                        <span className="text-xs font-medium leading-tight">
                          Absence justifiée
                        </span>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer items-center justify-center gap-2 text-sm font-medium text-foreground">
                        <Checkbox
                          checked={present[c.id] ?? false}
                          onCheckedChange={(v) =>
                            setPresentFor(c.id, v === true)
                          }
                          aria-label={`Présent — ${c.prenom} ${c.nom}`}
                        />
                        <span>Présent</span>
                      </label>
                    )
                  }
                />
              </li>
            );
          })}
        </ul>
      )}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={isPending || catechumenes.length === 0}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
        >
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
