"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { Catechumene } from "@/lib/catechumenes";
import {
  CANDIDAT_SUIVI_STATUT_OPTIONS,
  formatProfilDisplayName,
  type ResponsableOption
} from "@/lib/catechumenes";
import { CatechumenePhotoField } from "@/components/admin/catechumene-photo-field";

type FormValues = {
  nom: string;
  prenom: string;
  responsable_profile_id: string;
  candidat_suivi_statut: string;
  email: string;
  telephone: string;
  date_naissance: string;
  rencontre_individuelle_date: string;
  rencontre_individuelle_texte: string;
};

function toForm(c: Catechumene): FormValues {
  return {
    nom: c.nom ?? "",
    prenom: c.prenom ?? "",
    responsable_profile_id: c.responsable_profile_id ?? "",
    candidat_suivi_statut: c.candidat_suivi_statut ?? "",
    email: c.email ?? "",
    telephone: c.telephone ?? "",
    date_naissance: c.date_naissance ?? "",
    rencontre_individuelle_date: c.rencontre_individuelle_date ?? "",
    rencontre_individuelle_texte: c.rencontre_individuelle_texte ?? ""
  };
}

export function CandidatEditForm({
  candidat,
  responsables
}: {
  candidat: Catechumene;
  responsables: ResponsableOption[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() => toForm(candidat));
  const [isPending, startTransition] = useTransition();
  const [promotePending, setPromotePending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormValues, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));

  const canSubmit = useMemo(
    () => values.nom.trim().length > 0 && values.prenom.trim().length > 0,
    [values.nom, values.prenom]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/responsable/candidats/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: candidat.id,
          nom: values.nom.trim(),
          prenom: values.prenom.trim(),
          responsable_profile_id: values.responsable_profile_id.trim()
            ? values.responsable_profile_id.trim()
            : null,
          candidat_suivi_statut: values.candidat_suivi_statut.trim()
            ? values.candidat_suivi_statut.trim()
            : null,
          email: values.email.trim() || undefined,
          telephone: values.telephone.trim() || undefined,
          date_naissance: values.date_naissance.trim() || undefined,
          rencontre_individuelle_date:
            values.rencontre_individuelle_date.trim() || undefined,
          rencontre_individuelle_texte:
            values.rencontre_individuelle_texte.trim() || undefined
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
          "Erreur lors de l'enregistrement.";
        setError(msg);
        return;
      }
      router.push(`/responsable/candidats/${candidat.id}`);
      router.refresh();
    });
  }

  async function handlePromote() {
    if (
      !confirm(
        "Basculer cette fiche en catéchumène ? Elle apparaîtra dans la liste des catéchumènes (plus dans les candidats)."
      )
    ) {
      return;
    }
    setError(null);
    setPromotePending(true);
    try {
      const res = await fetch("/api/responsable/candidats/promote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: candidat.id })
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          (typeof data === "object" &&
            data &&
            "error" in data &&
            typeof (data as { error: unknown }).error === "string" &&
            (data as { error: string }).error) ||
          "Échec du basculement.";
        setError(msg);
        return;
      }
      router.push(`/responsable/catechumenes/${candidat.id}`);
      router.refresh();
    } finally {
      setPromotePending(false);
    }
  }

  const inputClass =
    "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";
  const labelClass = "text-sm font-medium text-zinc-900";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/responsable/candidats/${candidat.id}`}
          className="text-sm font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
        >
          ← Retour
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={promotePending}
            onClick={handlePromote}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-4 text-sm font-medium text-amber-900 shadow-sm transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {promotePending ? "Basculement…" : "Basculer en catéchumène"}
          </button>
          <button
            type="submit"
            disabled={isPending || !canSubmit}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Photo</h2>
        <div className="mt-3">
          <CatechumenePhotoField
            catechumeneId={candidat.id}
            photoPath={candidat.photo_path}
            onPhotoChange={() => router.refresh()}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className={labelClass} htmlFor="e-nom">
              Nom
            </label>
            <input
              id="e-nom"
              type="text"
              value={values.nom}
              onChange={(e) => set("nom", e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div className="space-y-2">
            <label className={labelClass} htmlFor="e-prenom">
              Prénom
            </label>
            <input
              id="e-prenom"
              type="text"
              value={values.prenom}
              onChange={(e) => set("prenom", e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClass} htmlFor="e-responsable">
            Responsable référent
          </label>
          <select
            id="e-responsable"
            value={values.responsable_profile_id}
            onChange={(e) => set("responsable_profile_id", e.target.value)}
            className={inputClass}
          >
            <option value="">Non assigné</option>
            {responsables.map((p) => (
              <option key={p.id} value={p.id}>
                {formatProfilDisplayName(p)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className={labelClass} htmlFor="e-statut">
            Statut de suivi
          </label>
          <select
            id="e-statut"
            value={values.candidat_suivi_statut}
            onChange={(e) => set("candidat_suivi_statut", e.target.value)}
            className={inputClass}
          >
            <option value="">Aucun statut</option>
            {CANDIDAT_SUIVI_STATUT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.emoji} {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className={labelClass} htmlFor="e-email">
            Email
          </label>
          <input
            id="e-email"
            type="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label className={labelClass} htmlFor="e-telephone">
            Téléphone
          </label>
          <input
            id="e-telephone"
            type="tel"
            value={values.telephone}
            onChange={(e) => set("telephone", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label className={labelClass} htmlFor="e-date-naissance">
            Date de naissance
          </label>
          <input
            id="e-date-naissance"
            type="date"
            value={values.date_naissance}
            onChange={(e) => set("date_naissance", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label className={labelClass} htmlFor="e-rencontre-date">
            Date rencontre individuelle
          </label>
          <input
            id="e-rencontre-date"
            type="date"
            value={values.rencontre_individuelle_date}
            onChange={(e) =>
              set("rencontre_individuelle_date", e.target.value)
            }
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label className={labelClass} htmlFor="e-rencontre-texte">
            Rencontre individuelle (notes)
          </label>
          <textarea
            id="e-rencontre-texte"
            rows={4}
            value={values.rencontre_individuelle_texte}
            onChange={(e) =>
              set("rencontre_individuelle_texte", e.target.value)
            }
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}
    </form>
  );
}
