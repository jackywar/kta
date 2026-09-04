"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Direction = "to-neophyte" | "to-catechumene";

const config: Record<
  Direction,
  { endpoint: string; label: string; confirm: string; destination: string }
> = {
  "to-neophyte": {
    endpoint: "/api/responsable/catechumenes/to-neophyte",
    label: "Basculer vers néophyte",
    confirm:
      "Basculer cette personne vers les néophytes ? Elle sera retirée de sa frat.",
    destination: "/responsable/neophytes"
  },
  "to-catechumene": {
    endpoint: "/api/responsable/neophytes/to-catechumene",
    label: "Basculer vers catéchumène",
    confirm:
      "Rebasculer cette personne vers les catéchumènes ? Sa frat devra être réaffectée manuellement.",
    destination: "/responsable/catechumenes"
  }
};

export function NeophyteTransitionButton({
  catechumeneId,
  direction
}: {
  catechumeneId: string;
  direction: Direction;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const options = config[direction];

  function handleClick() {
    if (!confirm(options.confirm)) return;
    setError(null);

    startTransition(async () => {
      const response = await fetch(options.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: catechumeneId })
      });
      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data &&
          "error" in data &&
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Le basculement a échoué.";
        setError(message);
        return;
      }

      router.push(`${options.destination}/${catechumeneId}`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Basculement…" : options.label}
      </button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
