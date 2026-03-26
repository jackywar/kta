"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { Catechumene, CatechumeneWithFrat } from "@/lib/catechumenes";
import type { Frat } from "@/lib/frats";
import { CatechumenePhotoField } from "@/components/admin/catechumene-photo-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FormValues = {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  date_naissance: string;
  observations: string;
  aine_dans_la_foi: string;
  annee_bapteme_previsionnelle: string;
  rencontre_individuelle_date: string;
  rencontre_individuelle_texte: string;
  date_entree_catechumenat: string;
  frat_id: string;
};

const NO_FRAT_VALUE = "__none__";

function catechumeneToForm(c: Catechumene): FormValues {
  return {
    nom: c.nom ?? "",
    prenom: c.prenom ?? "",
    email: c.email ?? "",
    telephone: c.telephone ?? "",
    date_naissance: c.date_naissance ?? "",
    observations: c.observations ?? "",
    aine_dans_la_foi: c.aine_dans_la_foi ?? "",
    annee_bapteme_previsionnelle:
      c.annee_bapteme_previsionnelle != null
        ? String(c.annee_bapteme_previsionnelle)
        : "",
    rencontre_individuelle_date: c.rencontre_individuelle_date ?? "",
    rencontre_individuelle_texte: c.rencontre_individuelle_texte ?? "",
    date_entree_catechumenat: c.date_entree_catechumenat ?? "",
    frat_id: c.frat_id ?? ""
  };
}

export function CatechumeneEditForm({
  catechumene,
  frats,
  backHref
}: {
  catechumene: CatechumeneWithFrat;
  frats: Frat[];
  backHref: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() =>
    catechumeneToForm(catechumene)
  );
  const [isPending, startTransition] = useTransition();
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
      const body = {
        id: catechumene.id,
        nom: values.nom.trim(),
        prenom: values.prenom.trim(),
        email: values.email.trim() || undefined,
        telephone: values.telephone.trim() || undefined,
        date_naissance: values.date_naissance.trim() || undefined,
        observations: values.observations.trim() || undefined,
        aine_dans_la_foi: values.aine_dans_la_foi.trim() || undefined,
        annee_bapteme_previsionnelle: values.annee_bapteme_previsionnelle.trim()
          ? parseInt(values.annee_bapteme_previsionnelle, 10)
          : undefined,
        rencontre_individuelle_date:
          values.rencontre_individuelle_date.trim() || undefined,
        rencontre_individuelle_texte:
          values.rencontre_individuelle_texte.trim() || undefined,
        date_entree_catechumenat:
          values.date_entree_catechumenat.trim() || undefined,
        frat_id: values.frat_id || undefined
      };

      const res = await fetch("/api/admin/catechumenes/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
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
      router.push(backHref);
      router.refresh();
    });
  }

  const inputClass =
    "h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20";
  const labelClass = "text-sm font-medium text-foreground";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={backHref}
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← Retour
        </Link>
        <button
          type="submit"
          disabled={isPending || !canSubmit}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Photo</h2>
        <div className="mt-3">
          <CatechumenePhotoField
            catechumeneId={catechumene.id}
            photoPath={catechumene.photo_path}
            onPhotoChange={() => router.refresh()}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className={labelClass} htmlFor="e-nom">Nom</label>
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
            <label className={labelClass} htmlFor="e-prenom">Prénom</label>
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
          <label className={labelClass} htmlFor="e-frat">Frat</label>
          <Select
            value={values.frat_id || NO_FRAT_VALUE}
            onValueChange={(v) => set("frat_id", v === NO_FRAT_VALUE ? "" : v)}
          >
            <SelectTrigger id="e-frat">
              <SelectValue placeholder="Aucune frat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_FRAT_VALUE}>Aucune frat</SelectItem>
              {frats.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className={labelClass} htmlFor="e-email">Email</label>
          <input
            id="e-email"
            type="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label className={labelClass} htmlFor="e-telephone">Téléphone</label>
          <input
            id="e-telephone"
            type="tel"
            value={values.telephone}
            onChange={(e) => set("telephone", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
            <label className={labelClass} htmlFor="e-date-entree">
              Date d&apos;entrée en catéchuménat
            </label>
            <input
              id="e-date-entree"
              type="date"
              value={values.date_entree_catechumenat}
              onChange={(e) => set("date_entree_catechumenat", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClass} htmlFor="e-aine">Aîné dans la foi</label>
          <input
            id="e-aine"
            type="text"
            value={values.aine_dans_la_foi}
            onChange={(e) => set("aine_dans_la_foi", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label className={labelClass} htmlFor="e-annee-bapteme">
            Année de baptême prévisionnelle
          </label>
          <input
            id="e-annee-bapteme"
            type="number"
            min={1900}
            max={2100}
            value={values.annee_bapteme_previsionnelle}
            onChange={(e) => set("annee_bapteme_previsionnelle", e.target.value)}
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
            onChange={(e) => set("rencontre_individuelle_date", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label className={labelClass} htmlFor="e-rencontre-texte">
            Rencontre individuelle (notes)
          </label>
          <textarea
            id="e-rencontre-texte"
            rows={3}
            value={values.rencontre_individuelle_texte}
            onChange={(e) => set("rencontre_individuelle_texte", e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          />
        </div>

        <div className="space-y-2">
          <label className={labelClass} htmlFor="e-observations">
            Observations (Markdown)
          </label>
          <textarea
            id="e-observations"
            rows={4}
            value={values.observations}
            onChange={(e) => set("observations", e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-mono shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </form>
  );
}
