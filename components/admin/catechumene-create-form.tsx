"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { Frat } from "@/lib/frats";

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

const emptyForm: FormValues = {
  nom: "",
  prenom: "",
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
          <label className="text-sm font-medium text-zinc-900" htmlFor="c-nom">
            Nom
          </label>
          <input
            id="c-nom"
            type="text"
            autoComplete="family-name"
            value={values.nom}
            onChange={(e) => set("nom", e.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
            placeholder="Dupont"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-900" htmlFor="c-prenom">
            Prénom
          </label>
          <input
            id="c-prenom"
            type="text"
            autoComplete="given-name"
            value={values.prenom}
            onChange={(e) => set("prenom", e.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
            placeholder="Marie"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900" htmlFor="c-frat">
          Frat
        </label>
        <select
          id="c-frat"
          value={values.frat_id}
          onChange={(e) => set("frat_id", e.target.value)}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
        >
          <option value="">Aucune frat</option>
          {frats.map((f) => (
            <option
              key={f.id}
              value={f.id}
              style={{ backgroundColor: f.color_oklch }}
            >
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900" htmlFor="c-email">
          Email <span className="text-zinc-400">(facultatif)</span>
        </label>
        <input
          id="c-email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          placeholder="marie@exemple.fr"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900" htmlFor="c-telephone">
          Téléphone
        </label>
        <input
          id="c-telephone"
          type="tel"
          autoComplete="tel"
          value={values.telephone}
          onChange={(e) => set("telephone", e.target.value)}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          placeholder="06 12 34 56 78"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-900" htmlFor="c-date-naissance">
            Date de naissance <span className="text-zinc-400">(facultatif)</span>
          </label>
          <input
            id="c-date-naissance"
            type="date"
            value={values.date_naissance}
            onChange={(e) => set("date_naissance", e.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-900" htmlFor="c-date-entree">
            Date d&apos;entrée en catéchuménat <span className="text-zinc-400">(facultatif)</span>
          </label>
          <input
            id="c-date-entree"
            type="date"
            value={values.date_entree_catechumenat}
            onChange={(e) => set("date_entree_catechumenat", e.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900" htmlFor="c-aine">
          Ainé dans la foi
        </label>
        <input
          id="c-aine"
          type="text"
          value={values.aine_dans_la_foi}
          onChange={(e) => set("aine_dans_la_foi", e.target.value)}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          placeholder="Nom de l'ainé"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900" htmlFor="c-annee-bapteme">
          Année de baptême prévisionnelle
        </label>
        <input
          id="c-annee-bapteme"
          type="number"
          min={1900}
          max={2100}
          value={values.annee_bapteme_previsionnelle}
          onChange={(e) => set("annee_bapteme_previsionnelle", e.target.value)}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          placeholder="2026"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-900" htmlFor="c-rencontre-date">
            Date rencontre individuelle
          </label>
          <input
            id="c-rencontre-date"
            type="date"
            value={values.rencontre_individuelle_date}
            onChange={(e) => set("rencontre_individuelle_date", e.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900" htmlFor="c-rencontre-texte">
          Rencontre individuelle (notes)
        </label>
        <textarea
          id="c-rencontre-texte"
          rows={3}
          value={values.rencontre_individuelle_texte}
          onChange={(e) => set("rencontre_individuelle_texte", e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          placeholder="Notes de la rencontre…"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900" htmlFor="c-observations">
          Observations (Markdown)
        </label>
        <textarea
          id="c-observations"
          rows={4}
          value={values.observations}
          onChange={(e) => set("observations", e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-mono shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          placeholder="Notes libres en markdown…"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !canSubmit}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Création…" : "Créer le catéchumène"}
      </button>
    </form>
  );
}
