"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Direction = "to-archive" | "restore";

const config: Record<
  Direction,
  { endpoint: string; label: string; confirm: string; pendingLabel: string }
> = {
  "to-archive": {
    endpoint: "/api/responsable/to-archive",
    label: "Archiver",
    confirm: "Archiver cette fiche ? Elle disparaîtra des listes actives.",
    pendingLabel: "Archivage…"
  },
  restore: {
    endpoint: "/api/responsable/archives/restore",
    label: "Restaurer",
    confirm: "Restaurer cette fiche dans sa catégorie d'origine ?",
    pendingLabel: "Restauration…"
  }
};

export function ArchiveTransitionButton({
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
            : "L'opération a échoué.";
        setError(message);
        return;
      }

      if (direction === "to-archive") {
        router.push(`/responsable/archives/${catechumeneId}`);
      } else {
        const destination =
          typeof data === "object" &&
          data &&
          "destination" in data &&
          typeof (data as { destination?: unknown }).destination === "string"
            ? (data as { destination: string }).destination
            : `/responsable/catechumenes/${catechumeneId}`;
        router.push(destination);
      }
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
        {isPending ? options.pendingLabel : options.label}
      </button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
