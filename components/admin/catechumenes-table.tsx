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

  async function handleSave() {
    if (!editingId || !editValues) return;
    setError(null);
    startTransition(async () => {
      const body = {
        id: editingId,
        nom: editValues.nom.trim(),
        prenom: editValues.prenom.trim(),
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
      <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
        Aucun catéchumène.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-600">
              <tr>
                <th className="w-14 px-4 py-3">Photo</th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Prénom</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Frat</th>
                <th className="px-4 py-3">Entrée</th>
                <th className="px-4 py-3">Baptême prév.</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {catechumenes.map((c) => {
                const photoUrl = getCatechumenePhotoUrl(c.photo_path);
                return (
                <tr key={c.id} className="hover:bg-zinc-50/70">
                  <td className="px-4 py-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
                      {photoUrl ? (
                        <Image
                          src={photoUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-400 text-xs" aria-hidden>—</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-900">{c.nom}</td>
                  <td className="px-4 py-3 text-zinc-900">{c.prenom}</td>
                  <td className="px-4 py-3 text-zinc-600">{c.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    {c.frat_id ? (
                      <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-zinc-900">
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
                      <span className="text-xs text-zinc-500">
                        Aucune frat
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {formatDate(c.date_entree_catechumenat)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {c.annee_bapteme_previsionnelle ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {linkedByCatechumeneId.has(c.id) ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        Utilisateur lié
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCreateUser(c.id)}
                        disabled={isPending || !c.email}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-medium text-blue-700 shadow-sm transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-50 disabled:text-zinc-400"
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
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs text-zinc-600 shadow-sm transition hover:bg-zinc-50"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-xs text-red-600 shadow-sm transition hover:bg-red-50"
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
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h2 id="edit-catechumene-title" className="text-lg font-semibold text-zinc-900">
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
                  <label className="text-sm font-medium text-zinc-900" htmlFor="e-nom">
                    Nom
                  </label>
                  <input
                    id="e-nom"
                    type="text"
                    value={editValues.nom}
                    onChange={(e) => set("nom", e.target.value)}
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900" htmlFor="e-prenom">
                    Prénom
                  </label>
                  <input
                    id="e-prenom"
                    type="text"
                    value={editValues.prenom}
                    onChange={(e) => set("prenom", e.target.value)}
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900" htmlFor="e-frat">
                  Frat
                </label>
                <select
                  id="e-frat"
                  value={editValues.frat_id}
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
                <label className="text-sm font-medium text-zinc-900" htmlFor="e-email">
                  Email
                </label>
                <input
                  id="e-email"
                  type="email"
                  value={editValues.email}
                  onChange={(e) => set("email", e.target.value)}
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900" htmlFor="e-telephone">
                  Téléphone
                </label>
                <input
                  id="e-telephone"
                  type="tel"
                  value={editValues.telephone}
                  onChange={(e) => set("telephone", e.target.value)}
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900" htmlFor="e-date-naissance">
                    Date de naissance
                  </label>
                  <input
                    id="e-date-naissance"
                    type="date"
                    value={editValues.date_naissance}
                    onChange={(e) => set("date_naissance", e.target.value)}
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900" htmlFor="e-date-entree">
                    Date d&apos;entrée en catéchuménat
                  </label>
                  <input
                    id="e-date-entree"
                    type="date"
                    value={editValues.date_entree_catechumenat}
                    onChange={(e) => set("date_entree_catechumenat", e.target.value)}
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900" htmlFor="e-aine">
                  Ainé dans la foi
                </label>
                <input
                  id="e-aine"
                  type="text"
                  value={editValues.aine_dans_la_foi}
                  onChange={(e) => set("aine_dans_la_foi", e.target.value)}
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900" htmlFor="e-annee-bapteme">
                  Année de baptême prévisionnelle
                </label>
                <input
                  id="e-annee-bapteme"
                  type="number"
                  min={1900}
                  max={2100}
                  value={editValues.annee_bapteme_previsionnelle}
                  onChange={(e) => set("annee_bapteme_previsionnelle", e.target.value)}
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900" htmlFor="e-rencontre-date">
                  Date rencontre individuelle
                </label>
                <input
                  id="e-rencontre-date"
                  type="date"
                  value={editValues.rencontre_individuelle_date}
                  onChange={(e) => set("rencontre_individuelle_date", e.target.value)}
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900" htmlFor="e-rencontre-texte">
                  Rencontre individuelle (notes)
                </label>
                <textarea
                  id="e-rencontre-texte"
                  rows={3}
                  value={editValues.rencontre_individuelle_texte}
                  onChange={(e) => set("rencontre_individuelle_texte", e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900" htmlFor="e-observations">
                  Observations (Markdown)
                </label>
                <textarea
                  id="e-observations"
                  rows={4}
                  value={editValues.observations}
                  onChange={(e) => set("observations", e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-mono shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </div>
              ) : null}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60"
                >
                  {isPending ? "Enregistrement…" : "Enregistrer"}
                </button>
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={isPending}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60"
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
