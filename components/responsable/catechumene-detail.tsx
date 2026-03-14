import { getCatechumenePhotoUrl } from "@/lib/storage";
import { MarkdownContent } from "@/components/ui/markdown-content";
import type { CatechumeneWithFrat } from "@/lib/catechumenes";

type Props = {
  catechumene: CatechumeneWithFrat;
  formatDate: (s: string | null) => string;
};

function Field({
  label,
  value,
  className = ""
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  if (value == null || value === "") return null;
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-zinc-900">{value}</dd>
    </div>
  );
}

export function CatechumeneDetail({ catechumene, formatDate }: Props) {
  const photoUrl = getCatechumenePhotoUrl(catechumene.photo_path);
  const borderColor =
    catechumene.frat?.color_oklch?.trim() || "rgb(161 161 170)";

  return (
    <article
      className="overflow-hidden rounded-2xl border-2 bg-white shadow-sm"
      style={{ borderColor }}
    >
      <div className="border-b border-zinc-100 p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="mx-auto shrink-0 sm:mx-0">
            <div className="h-40 w-40 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-4xl text-zinc-300"
                  aria-hidden
                >
                  —
                </div>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
              {catechumene.prenom} {catechumene.nom}
            </h1>
            {catechumene.frat ? (
              <p className="mt-1 flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: catechumene.frat.color_oklch }}
                  aria-hidden
                />
                <span className="text-sm text-zinc-600">
                  {catechumene.frat.name}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <dl className="grid gap-4 p-6 sm:grid-cols-2">
        <Field label="Email" value={catechumene.email ?? ""} />
        <Field label="Téléphone" value={catechumene.telephone ?? ""} />
        <Field
          label="Date de naissance"
          value={formatDate(catechumene.date_naissance)}
        />
        <Field
          label="Date d'entrée en catéchuménat"
          value={formatDate(catechumene.date_entree_catechumenat)}
        />
        <Field
          label="Année de baptême prévisionnelle"
          value={catechumene.annee_bapteme_previsionnelle ?? ""}
        />
        <Field label="Aîné dans la foi" value={catechumene.aine_dans_la_foi ?? ""} />
        <Field
          label="Date rencontre individuelle"
          value={formatDate(catechumene.rencontre_individuelle_date)}
          className="sm:col-span-2"
        />
      </dl>

      {catechumene.rencontre_individuelle_texte?.trim() ? (
        <div className="border-t border-zinc-100 px-6 py-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Rencontre individuelle (notes)
          </h2>
          <div className="mt-2">
            <MarkdownContent content={catechumene.rencontre_individuelle_texte} />
          </div>
        </div>
      ) : null}

      {catechumene.observations?.trim() ? (
        <div className="border-t border-zinc-100 px-6 py-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Observations
          </h2>
          <div className="mt-2">
            <MarkdownContent content={catechumene.observations} />
          </div>
        </div>
      ) : null}
    </article>
  );
}
