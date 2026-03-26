import Image from "next/image";
import { getCatechumenePhotoUrl } from "@/lib/storage";
import { MarkdownContent } from "@/components/ui/markdown-content";
import {
  formatProfilDisplayName,
  type CandidatWithResponsable
} from "@/lib/catechumenes";
import { CandidatSelfAssign } from "@/components/responsable/candidat-self-assign";
import { CandidatStatutField } from "@/components/responsable/candidat-statut-field";

type Props = {
  candidat: CandidatWithResponsable;
  formatDate: (s: string | null) => string;
  currentUserProfileId: string;
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
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function CandidatDetail({
  candidat,
  formatDate,
  currentUserProfileId
}: Props) {
  const photoUrl = getCatechumenePhotoUrl(candidat.photo_path);

  return (
    <article className="overflow-hidden rounded-2xl border-2 border-border bg-card shadow-sm">
      <div className="border-b border-border/60 p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="mx-auto shrink-0 sm:mx-0">
            <div className="relative h-40 w-40 overflow-hidden rounded-2xl border border-border bg-muted">
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-4xl text-muted-foreground"
                  aria-hidden
                >
                  —
                </div>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Candidat
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {candidat.prenom} {candidat.nom}
            </h1>
          </div>
        </div>
      </div>

      <dl className="grid gap-4 p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field
            label="Responsable référent"
            value={
              candidat.responsable
                ? formatProfilDisplayName(candidat.responsable)
                : "—"
            }
          />
          <CandidatSelfAssign
            candidatId={candidat.id}
            myProfileId={currentUserProfileId}
            responsableProfileId={candidat.responsable_profile_id ?? null}
          />
        </div>
        <div className="sm:col-span-2">
          <CandidatStatutField
            candidatId={candidat.id}
            value={candidat.candidat_suivi_statut ?? null}
          />
        </div>
        <Field label="Email" value={candidat.email ?? ""} />
        <Field label="Téléphone" value={candidat.telephone ?? ""} />
        <Field
          label="Date de naissance"
          value={formatDate(candidat.date_naissance)}
        />
        <Field
          label="Date rencontre individuelle"
          value={formatDate(candidat.rencontre_individuelle_date)}
        />
      </dl>

      {candidat.rencontre_individuelle_texte?.trim() ? (
        <div className="border-t border-border/60 px-6 py-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Rencontre individuelle (notes)
          </h2>
          <div className="mt-2">
            <MarkdownContent content={candidat.rencontre_individuelle_texte} />
          </div>
        </div>
      ) : null}
    </article>
  );
}
