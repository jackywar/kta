"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  catechumeneId: string;
  email: string | null;
  isLinked: boolean;
};

export function CatechumeneLinkUserButton({
  catechumeneId,
  email,
  isLinked
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (isLinked) {
    return (
      <div className="flex flex-col items-start gap-1 sm:items-end">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          Utilisateur lié
        </span>
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : null}
      </div>
    );
  }

  async function handleClick() {
    if (!email) return;
    const confirmMsg =
      "Créer un utilisateur lié à ce catéchumène et lui envoyer un email d'activation ?";
    if (!confirm(confirmMsg)) return;
    setError(null);

    startTransition(async () => {
      const res = await fetch("/api/admin/catechumenes/create-user", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ catechumene_id: catechumeneId })
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          (typeof data === "object" &&
            data &&
            "error" in data &&
            typeof (data as { error: unknown }).error === "string" &&
            (data as { error: string }).error) ||
          "Erreur lors de la création de l'utilisateur.";
        setError(msg);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending || !email}
        className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
        title={
          email
            ? "Créer un utilisateur pour ce catéchumène"
            : "Renseignez un email avant de créer l'utilisateur"
        }
      >
        Créer l&apos;utilisateur
      </button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

