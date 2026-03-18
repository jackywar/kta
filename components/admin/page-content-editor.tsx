"use client";

import { useState, useTransition } from "react";
import { MarkdownContent } from "@/components/ui/markdown-content";

type Props = {
  contentKey: string;
  initialContent: string;
};

export function PageContentEditor({ contentKey, initialContent }: Props) {
  const [content, setContent] = useState(initialContent);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await fetch("/api/admin/page-contents/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: contentKey, content })
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
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  return (
    <div className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="h-48 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
        placeholder="Contenu en Markdown…"
      />

      {content.trim() ? (
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Aperçu
          </p>
          <MarkdownContent content={content} />
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}

      {success ? (
        <p className="text-sm text-emerald-600">Enregistré avec succès.</p>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </div>
  );
}
