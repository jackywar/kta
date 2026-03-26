"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import type { Catechumene } from "@/lib/catechumenes";
import type { Frat } from "@/lib/frats";
import { getCatechumenePhotoUrl } from "@/lib/storage";
import { CatechumenePhotoField } from "@/components/admin/catechumene-photo-field";

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

function catechumeneToForm(c: Catechumene): FormValues {
  return {
    nom: c.nom ?? "",
    prenom: c.prenom ?? "",
    est_candidat: Boolean(c.est_candidat),
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

function formatDate(s: string | null): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch {
    return s;
  }
}

export function CatechumenesTable({
  catechumenes,
  frats,
  linkedByCatechumeneId
}: {
  catechumenes: Catechumene[];
  frats: Frat[];
  linkedByCatechumeneId: Set<string>;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<FormValues | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const editing = useMemo(
    () => (editingId ? catechumenes.find((c) => c.id === editingId) : null),
    [editingId, catechumenes]
  );

  const openEdit = (c: Catechumene) => {
    setEditingId(c.id);
    setEditValues(catechumeneToForm(c));
    setError(null);
  };

  const closeEdit = () => {
    setEditingId(null);
    setEditValues(null);
    setError(null);
  };

  const set = (key: keyof FormValues, value: string) => {
    setEditValues((v) => (v ? { ...v, [key]: value } : null));
  };

  const setEstCandidat = (checked: boolean) => {
    setEditValues((v) => (v ? { ...v, est_candidat: checked } : null));
  };

  async function handleSave() {
    if (!editingId || !editValues) return;
    setError(null);
    startTransition(async () => {
      const body = {
        id: editingId,
        nom: editValues.nom.trim(),
        prenom: editValues.prenom.trim(),
        est_candidat: editValues.est_candidat,
        email: editValues.email.trim() || undefined,
        telephone: editValues.telephone.trim() || undefined,
        date_naissance: editValues.date_naissance.trim() || undefined,
        observations: editValues.observations.trim() || undefined,
        aine_dans_la_foi: editValues.aine_dans_la_foi.trim() || undefined,
        annee_bapteme_previsionnelle: editValues.annee_bapteme_previsionnelle.trim()
          ? parseInt(editValues.annee_bapteme_previsionnelle, 10)
          : undefined,
        rencontre_individuelle_date: editValues.rencontre_individuelle_date.trim() || undefined,
        rencontre_individuelle_texte:
          editValues.rencontre_individuelle_texte.trim() || undefined,
        date_entree_catechumenat: editValues.date_entree_catechumenat.trim() || undefined,
        frat_id: editValues.frat_id || undefined
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
      closeEdit();
      router.refresh();
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce catéchumène ?")) return;
    const res = await fetch("/api/admin/catechumenes/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (res.ok) router.refresh();
  }

  async function handleCreateUser(catechumeneId: string) {
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

  if (catechumenes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        Aucun catéchumène.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-14 px-4 py-3">Photo</th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Prénom</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Candidat</th>
                <th className="px-4 py-3">Frat</th>
                <th className="px-4 py-3">Entrée</th>
                <th className="px-4 py-3">Baptême prév.</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {catechumenes.map((c) => {
                const photoUrl = getCatechumenePhotoUrl(c.photo_path);
                return (
                <tr key={c.id} className="hover:bg-muted/70">
                  <td className="px-4 py-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-border bg-muted">
                      {photoUrl ? (
                        <Image
                          src={photoUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs" aria-hidden>—</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">{c.nom}</td>
                  <td className="px-4 py-3 text-foreground">{c.prenom}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    {c.est_candidat ? (
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                        Oui
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Non</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.frat_id ? (
                      <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-foreground">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor:
                              frats.find((f) => f.id === c.frat_id)
                                ?.color_oklch ?? "#e5e5e5"
                          }}
                        />
                        <span>
                          {
                            frats.find((f) => f.id === c.frat_id)?.name ??
                            "Frat inconnue"
                          }
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Aucune frat
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(c.date_entree_catechumenat)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.annee_bapteme_previsionnelle ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {linkedByCatechumeneId.has(c.id) ? (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        Utilisateur lié
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCreateUser(c.id)}
                        disabled={isPending || !c.email}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
                        title={
                          c.email
                            ? "Créer un utilisateur pour ce catéchumène"
                            : "Renseignez un email avant de créer l'utilisateur"
                        }
                      >
                        Créer l&apos;utilisateur
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground shadow-sm transition hover:bg-muted"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-destructive/30 bg-card px-3 text-xs text-destructive shadow-sm transition hover:bg-destructive/10"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && editValues ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-catechumene-title"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 id="edit-catechumene-title" className="text-lg font-semibold text-foreground">
              Modifier {editing.prenom} {editing.nom}
            </h2>

            <div className="mt-6 space-y-4">
              <CatechumenePhotoField
                catechumeneId={editing.id}
                photoPath={editing.photo_path}
                onPhotoChange={() => router.refresh()}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="e-nom">
                    Nom
                  </label>
                  <input
                    id="e-nom"
                    type="text"
                    value={editValues.nom}
                    onChange={(e) => set("nom", e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="e-prenom">
                    Prénom
                  </label>
                  <input
                    id="e-prenom"
                    type="text"
                    value={editValues.prenom}
                    onChange={(e) => set("prenom", e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
                    required
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/80 px-4 py-3">
                <input
                  id="e-est-candidat"
                  type="checkbox"
                  checked={editValues.est_candidat}
                  onChange={(e) => setEstCandidat(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border text-foreground focus:ring-ring"
                />
                <div className="min-w-0">
                  <label
                    htmlFor="e-est-candidat"
                    className="text-sm font-medium text-foreground"
                  >
                    Candidat
                  </label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Si coché, la fiche apparaît dans la liste des candidats
                    (responsable) et pas dans la liste des catéchumènes actifs.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="e-frat">
                  Frat
                </label>
                <select
                  id="e-frat"
                  value={editValues.frat_id}
                  onChange={(e) => set("frat_id", e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
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
                <label className="text-sm font-medium text-foreground" htmlFor="e-email">
                  Email
                </label>
                <input
                  id="e-email"
                  type="email"
                  value={editValues.email}
                  onChange={(e) => set("email", e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="e-telephone">
                  Téléphone
                </label>
                <input
                  id="e-telephone"
                  type="tel"
                  value={editValues.telephone}
                  onChange={(e) => set("telephone", e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="e-date-naissance">
                    Date de naissance
                  </label>
                  <input
                    id="e-date-naissance"
                    type="date"
                    value={editValues.date_naissance}
                    onChange={(e) => set("date_naissance", e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="e-date-entree">
                    Date d&apos;entrée en catéchuménat
                  </label>
                  <input
                    id="e-date-entree"
                    type="date"
                    value={editValues.date_entree_catechumenat}
                    onChange={(e) => set("date_entree_catechumenat", e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="e-aine">
                  Ainé dans la foi
                </label>
                <input
                  id="e-aine"
                  type="text"
                  value={editValues.aine_dans_la_foi}
                  onChange={(e) => set("aine_dans_la_foi", e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="e-annee-bapteme">
                  Année de baptême prévisionnelle
                </label>
                <input
                  id="e-annee-bapteme"
                  type="number"
                  min={1900}
                  max={2100}
                  value={editValues.annee_bapteme_previsionnelle}
                  onChange={(e) => set("annee_bapteme_previsionnelle", e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="e-rencontre-date">
                  Date rencontre individuelle
                </label>
                <input
                  id="e-rencontre-date"
                  type="date"
                  value={editValues.rencontre_individuelle_date}
                  onChange={(e) => set("rencontre_individuelle_date", e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="e-rencontre-texte">
                  Rencontre individuelle (notes)
                </label>
                <textarea
                  id="e-rencontre-texte"
                  rows={3}
                  value={editValues.rencontre_individuelle_texte}
                  onChange={(e) => set("rencontre_individuelle_texte", e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="e-observations">
                  Observations (Markdown)
                </label>
                <textarea
                  id="e-observations"
                  rows={4}
                  value={editValues.observations}
                  onChange={(e) => set("observations", e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-mono shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {isPending ? "Enregistrement…" : "Enregistrer"}
                </button>
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={isPending}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-medium text-muted-foreground shadow-sm transition hover:bg-muted disabled:opacity-60"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
