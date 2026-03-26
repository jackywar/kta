"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CANDIDAT_SUIVI_STATUT_OPTIONS,
  type CandidatSuiviStatut
} from "@/lib/catechumenes";

type Props = {
  candidatId: string;
  value: CandidatSuiviStatut | null;
};

export function CandidatStatutField({ candidatId, value }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatut(next: CandidatSuiviStatut | null) {
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/responsable/candidats/statut", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          candidat_id: candidatId,
          candidat_suivi_statut: next
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
          "Une erreur est survenue.";
        setError(msg);
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Statut de suivi
      </p>
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          disabled={pending}
          onClick={() => setStatut(null)}
          className={`rounded-lg border px-3 py-2 text-left text-sm transition disabled:opacity-60 ${
            value == null
              ? "border-primary bg-muted font-medium text-foreground"
              : "border-border bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <span className="mr-2 text-muted-foreground" aria-hidden>
            ○
          </span>
          Aucun statut
        </button>
        {CANDIDAT_SUIVI_STATUT_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={pending}
              onClick={() => setStatut(opt.value)}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition disabled:opacity-60 ${
                selected
                  ? "border-primary bg-muted font-medium text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              <span className="mr-2" aria-hidden>
                {opt.emoji}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
