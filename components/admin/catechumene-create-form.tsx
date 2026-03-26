"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { Frat } from "@/lib/frats";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FormValues = {
  nom: string;
  prenom: string;
  est_candidat: boolean;
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

const emptyForm: FormValues = {
  nom: "",
  prenom: "",
  est_candidat: false,
  email: "",
  telephone: "",
  date_naissance: "",
  observations: "",
  aine_dans_la_foi: "",
  annee_bapteme_previsionnelle: "",
  rencontre_individuelle_date: "",
  rencontre_individuelle_texte: "",
  date_entree_catechumenat: "",
  frat_id: ""
};

export function CatechumeneCreateForm({
  frats,
  redirectOnSuccess
}: {
  frats: Frat[];
  redirectOnSuccess?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [values, setValues] = useState<FormValues>({ ...emptyForm });

  const canSubmit = useMemo(
    () =>
      values.nom.trim().length > 0 && values.prenom.trim().length > 0,
    [values.nom, values.prenom]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const body = {
        nom: values.nom.trim(),
        prenom: values.prenom.trim(),
        est_candidat: values.est_candidat,
        email: values.email.trim() || undefined,
        telephone: values.telephone.trim() || undefined,
        date_naissance: values.date_naissance.trim() || undefined,
        observations: values.observations.trim() || undefined,
        aine_dans_la_foi: values.aine_dans_la_foi.trim() || undefined,
        annee_bapteme_previsionnelle: values.annee_bapteme_previsionnelle.trim()
          ? parseInt(values.annee_bapteme_previsionnelle, 10)
          : undefined,
        rencontre_individuelle_date: values.rencontre_individuelle_date.trim() || undefined,
        rencontre_individuelle_texte: values.rencontre_individuelle_texte.trim() || undefined,
        date_entree_catechumenat: values.date_entree_catechumenat.trim() || undefined,
        frat_id: values.frat_id || undefined
      };

      const res = await fetch("/api/admin/catechumenes/create", {
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
          "Erreur lors de la création du catéchumène.";
        setError(msg);
        return;
      }

      setValues({ ...emptyForm });
      setSuccess("Catéchumène créé.");
      if (redirectOnSuccess) {
        router.push(redirectOnSuccess);
        router.refresh();
      } else {
        router.refresh();
      }
    });
  }

  const set = (key: keyof FormValues, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="c-nom">
            Nom
          </label>
          <input
            id="c-nom"
            type="text"
            autoComplete="family-name"
            value={values.nom}
            onChange={(e) => set("nom", e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
            placeholder="Dupont"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="c-prenom">
            Prénom
          </label>
          <input
            id="c-prenom"
            type="text"
            autoComplete="given-name"
            value={values.prenom}
            onChange={(e) => set("prenom", e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
            placeholder="Marie"
            required
          />
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/80 px-4 py-3">
        <Checkbox
          id="c-est-candidat"
          checked={values.est_candidat}
          onCheckedChange={(checked) =>
            setValues((v) => ({ ...v, est_candidat: checked === true }))
          }
          className="mt-1"
        />
        <div className="min-w-0">
          <label
            htmlFor="c-est-candidat"
            className="text-sm font-medium text-foreground"
          >
            Candidat
          </label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Si coché, la fiche est traitée comme candidat (liste candidats
            responsable) et non comme catéchumène actif dans la liste principale.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="c-frat">
          Frat
        </label>
        <Select value={values.frat_id} onValueChange={(v) => set("frat_id", v)}>
          <SelectTrigger id="c-frat">
            <SelectValue placeholder="Aucune frat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Aucune frat</SelectItem>
            {frats.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="c-email">
          Email <span className="text-muted-foreground">(facultatif)</span>
        </label>
        <input
          id="c-email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          placeholder="marie@exemple.fr"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="c-telephone">
          Téléphone
        </label>
        <input
          id="c-telephone"
          type="tel"
          autoComplete="tel"
          value={values.telephone}
          onChange={(e) => set("telephone", e.target.value)}
          className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          placeholder="06 12 34 56 78"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="c-date-naissance">
            Date de naissance <span className="text-muted-foreground">(facultatif)</span>
          </label>
          <input
            id="c-date-naissance"
            type="date"
            value={values.date_naissance}
            onChange={(e) => set("date_naissance", e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="c-date-entree">
            Date d&apos;entrée en catéchuménat <span className="text-muted-foreground">(facultatif)</span>
          </label>
          <input
            id="c-date-entree"
            type="date"
            value={values.date_entree_catechumenat}
            onChange={(e) => set("date_entree_catechumenat", e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="c-aine">
          Ainé dans la foi
        </label>
        <input
          id="c-aine"
          type="text"
          value={values.aine_dans_la_foi}
          onChange={(e) => set("aine_dans_la_foi", e.target.value)}
          className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          placeholder="Nom de l'ainé"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="c-annee-bapteme">
          Année de baptême prévisionnelle
        </label>
        <input
          id="c-annee-bapteme"
          type="number"
          min={1900}
          max={2100}
          value={values.annee_bapteme_previsionnelle}
          onChange={(e) => set("annee_bapteme_previsionnelle", e.target.value)}
          className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          placeholder="2026"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="c-rencontre-date">
            Date rencontre individuelle
          </label>
          <input
            id="c-rencontre-date"
            type="date"
            value={values.rencontre_individuelle_date}
            onChange={(e) => set("rencontre_individuelle_date", e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="c-rencontre-texte">
          Rencontre individuelle (notes)
        </label>
        <textarea
          id="c-rencontre-texte"
          rows={3}
          value={values.rencontre_individuelle_texte}
          onChange={(e) => set("rencontre_individuelle_texte", e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          placeholder="Notes de la rencontre…"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="c-observations">
          Observations (Markdown)
        </label>
        <textarea
          id="c-observations"
          rows={4}
          value={values.observations}
          onChange={(e) => set("observations", e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-mono shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          placeholder="Notes libres en markdown…"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
          {success}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !canSubmit}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Création…" : "Créer le catéchumène"}
      </button>
    </form>
  );
}
