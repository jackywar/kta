import type { Responsabilite } from "@/lib/responsabilites";
import { MarkdownContent } from "@/components/ui/markdown-content";

type Props = {
  responsabilites: Responsabilite[];
};

export function ProfileResponsabilites({ responsabilites }: Props) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">
        Mes responsabilités
      </h2>
      <p className="mt-1 text-sm text-zinc-600">
        Les responsabilités qui vous ont été attribuées.
      </p>

      {responsabilites.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-500">
          Aucune responsabilité attribuée.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {responsabilites.map((r) => (
            <article
              key={r.id}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
            >
              <h3 className="text-sm font-medium text-zinc-900">{r.libelle}</h3>
              {r.descriptif?.trim() ? (
                <div className="mt-2">
                  <MarkdownContent content={r.descriptif} />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
