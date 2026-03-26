"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  formatProfilDisplayName,
  type ResponsableOption
} from "@/lib/catechumenes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CandidatCreateForm({
  responsables
}: {
  responsables: ResponsableOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState({
    nom: "",
    prenom: "",
    responsable_profile_id: "",
    email: "",
    telephone: "",
    date_naissance: "",
    rencontre_individuelle_date: "",
    rencontre_individuelle_texte: ""
  });

  const set = (key: keyof typeof values, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));

  const canSubmit = useMemo(
    () => values.nom.trim().length > 0 && values.prenom.trim().length > 0,
    [values.nom, values.prenom]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/responsable/candidats/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nom: values.nom.trim(),
          prenom: values.prenom.trim(),
          responsable_profile_id: values.responsable_profile_id.trim()
            ? values.responsable_profile_id.trim()
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
          "Erreur lors de la création.";
        setError(msg);
        return;
      }

      const id =
        typeof data === "object" &&
        data &&
        "id" in data &&
        typeof (data as { id: unknown }).id === "string"
          ? (data as { id: string }).id
          : null;

      if (id) {
        router.push(`/responsable/candidats/${id}`);
        router.refresh();
      } else {
        router.push("/responsable/candidats");
        router.refresh();
      }
    });
  }

  const inputClass =
    "h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20";
  const labelClass = "text-sm font-medium text-foreground";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/responsable/candidats"
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← Candidats
        </Link>
        <button
          type="submit"
          disabled={isPending || !canSubmit}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Création…" : "Créer le candidat"}
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className={labelClass} htmlFor="c-nom">
              Nom
            </label>
            <input
              id="c-nom"
              type="text"
              value={values.nom}
              onChange={(e) => set("nom", e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div className="space-y-2">
            <label className={labelClass} htmlFor="c-prenom">
              Prénom
            </label>
            <input
              id="c-prenom"
              type="text"
              value={values.prenom}
              onChange={(e) => set("prenom", e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClass} htmlFor="c-responsable">
            Responsable référent
          </label>
          <Select
            value={values.responsable_profile_id}
            onValueChange={(v) => set("responsable_profile_id", v)}
          >
            <SelectTrigger id="c-responsable">
              <SelectValue placeholder="Non assigné" />
            </SelectTrigger>
            <SelectContent>
              {responsables.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {formatProfilDisplayName(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className={labelClass} htmlFor="c-email">
            Email
          </label>
          <input
            id="c-email"
            type="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label className={labelClass} htmlFor="c-tel">
            Téléphone
          </label>
          <input
            id="c-tel"
            type="tel"
            value={values.telephone}
            onChange={(e) => set("telephone", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label className={labelClass} htmlFor="c-naissance">
            Date de naissance
          </label>
          <input
            id="c-naissance"
            type="date"
            value={values.date_naissance}
            onChange={(e) => set("date_naissance", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label className={labelClass} htmlFor="c-rencontre-date">
            Date rencontre individuelle
          </label>
          <input
            id="c-rencontre-date"
            type="date"
            value={values.rencontre_individuelle_date}
            onChange={(e) => set("rencontre_individuelle_date", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label className={labelClass} htmlFor="c-rencontre-texte">
            Rencontre individuelle (notes)
          </label>
          <textarea
            id="c-rencontre-texte"
            rows={4}
            value={values.rencontre_individuelle_texte}
            onChange={(e) =>
              set("rencontre_individuelle_texte", e.target.value)
            }
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
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
