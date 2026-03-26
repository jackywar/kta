"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  candidatId: string;
  myProfileId: string;
  responsableProfileId: string | null;
};

export function CandidatSelfAssign({
  candidatId,
  myProfileId,
  responsableProfileId
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMine = responsableProfileId === myProfileId;

  async function call(action: "assign" | "unassign") {
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/responsable/candidats/self-assign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ candidat_id: candidatId, action })
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
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {isMine ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => call("unassign")}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "…" : "Me désaffecter"}
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => call("assign")}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "…" : "Me l'affecter"}
        </button>
      )}
      {error ? (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
