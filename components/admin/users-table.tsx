"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { roleSchema, type Role } from "@/lib/roles";
import type { Responsabilite, ResponsableResponsabilite } from "@/lib/responsabilites";

export type ProfileRow = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: Role;
  created_at: string;
};

type RowState = {
  firstName: string;
  lastName: string;
  role: Role;
  newPassword: string;
  savingRole: boolean;
  resettingPassword: boolean;
  deleting: boolean;
};

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  responsable: "Responsable",
  catechumene: "Catéchumène"
};

export function UsersTable({
  users,
  responsabilites,
  associations
}: {
  users: ProfileRow[];
  responsabilites: Responsabilite[];
  associations: ResponsableResponsabilite[];
}) {
  const router = useRouter();
  const [state, setState] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      users.map((u) => [
        u.id,
        {
          firstName: u.first_name ?? "",
          lastName: u.last_name ?? "",
          role: u.role,
          newPassword: "",
          savingRole: false,
          resettingPassword: false,
          deleting: false
        }
      ])
    )
  );
  const [confirmingUser, setConfirmingUser] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const [editingResponsabilites, setEditingResponsabilites] = useState<{
    profileId: string;
    email: string;
    selectedIds: Set<string>;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const disabledGlobally = useMemo(
    () => isPending || users.length === 0,
    [isPending, users.length]
  );

  const responsabilitesById = useMemo(() => {
    return new Map(responsabilites.map((r) => [r.id, r]));
  }, [responsabilites]);

  const associationsByProfileId = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const a of associations) {
      const arr = map.get(a.profile_id) ?? [];
      arr.push(a.responsabilite_id);
      map.set(a.profile_id, arr);
    }
    return map;
  }, [associations]);

  function openResponsabilitesModal(profileId: string, email: string) {
    const currentIds = associationsByProfileId.get(profileId) ?? [];
    setEditingResponsabilites({
      profileId,
      email,
      selectedIds: new Set(currentIds)
    });
  }

  async function handleSaveResponsabilites() {
    if (!editingResponsabilites) return;
    startTransition(async () => {
      await fetch("/api/admin/users/set-responsabilites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          profile_id: editingResponsabilites.profileId,
          responsabilite_ids: Array.from(editingResponsabilites.selectedIds)
        })
      });
      router.refresh();
    });
  }

  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
        Aucun utilisateur.
      </div>
    );
  }

  async function handleSaveRole(id: string) {
    const row = state[id];
    if (!row) return;

    setState((prev) => ({
      ...prev,
      [id]: { ...prev[id], savingRole: true }
    }));

    startTransition(async () => {
      const firstName = row.firstName.trim();
      const lastName = row.lastName.trim();

      await fetch("/api/admin/users/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id,
          role: row.role,
          first_name: firstName.length > 0 ? firstName : null,
          last_name: lastName.length > 0 ? lastName : null
        })
      });
      router.refresh();
    });
  }

  async function handleResetPassword(email: string) {
    setState((prev) => ({
      ...prev,
      [email]: prev[email] ?? prev[email]
    }));

    startTransition(async () => {
      await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email })
      });
      router.refresh();
    });
  }

  function openDeleteConfirm(id: string, email: string) {
    setConfirmingUser({ id, email });
  }

  async function handleConfirmDelete(id: string) {
    setState((prev) => ({
      ...prev,
      [id]: { ...prev[id], deleting: true }
    }));

    startTransition(async () => {
      await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id })
      });
      setConfirmingUser(null);
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-600">
            <tr>
              <th className="px-4 py-3 min-w-[240px]">Nom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Responsabilités</th>
              <th className="px-4 py-3">Mot de passe</th>
              <th className="px-4 py-3">Créé le</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {users.map((u) => {
              const row = state[u.id] ?? {
                firstName: u.first_name ?? "",
                lastName: u.last_name ?? "",
                role: u.role,
                newPassword: "",
                savingRole: false,
                resettingPassword: false,
                deleting: false
              };

              const isRowBusy =
                row.savingRole || row.resettingPassword || row.deleting;

              return (
                <tr key={u.id} className="hover:bg-zinc-50/70">
                  <td className="px-4 py-3 text-zinc-900">
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        value={row.firstName}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            [u.id]: {
                              ...prev[u.id],
                              firstName: e.target.value
                            }
                          }))
                        }
                        placeholder="Prénom"
                        disabled={disabledGlobally || isRowBusy}
                        className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                      />
                      <input
                        type="text"
                        value={row.lastName}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            [u.id]: {
                              ...prev[u.id],
                              lastName: e.target.value
                            }
                          }))
                        }
                        placeholder="Nom"
                        disabled={disabledGlobally || isRowBusy}
                        className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {u.email}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={row.role}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            [u.id]: {
                              ...prev[u.id],
                              role: roleSchema.parse(e.target.value)
                            }
                          }))
                        }
                        disabled={disabledGlobally || isRowBusy}
                        className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                      >
                        {roleSchema.options.map((r) => (
                          <option key={r} value={r}>
                            {roleLabels[r]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "responsable" ? (
                      <div className="flex flex-col gap-1">
                        {(() => {
                          const ids = associationsByProfileId.get(u.id) ?? [];
                          if (ids.length === 0) {
                            return (
                              <span className="text-xs text-zinc-400">
                                Aucune
                              </span>
                            );
                          }
                          return ids.slice(0, 2).map((rid) => {
                            const r = responsabilitesById.get(rid);
                            return r ? (
                              <span
                                key={rid}
                                className="inline-block max-w-[120px] truncate rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700"
                                title={r.libelle}
                              >
                                {r.libelle}
                              </span>
                            ) : null;
                          });
                        })()}
                        {(associationsByProfileId.get(u.id)?.length ?? 0) > 2 ? (
                          <span className="text-xs text-zinc-400">
                            +{(associationsByProfileId.get(u.id)?.length ?? 0) - 2} autres
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => openResponsabilitesModal(u.id, u.email)}
                          disabled={disabledGlobally || isRowBusy}
                          className="mt-1 inline-flex h-7 items-center justify-center rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-600 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Modifier
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleResetPassword(u.email)}
                        disabled={disabledGlobally || isRowBusy}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Envoyer un lien de réinitialisation de mot de passe"
                      >
                        {/* pictogramme clé simple */}
                        <span className="text-xs">🔑</span>
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {new Date(u.created_at).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveRole(u.id)}
                        disabled={disabledGlobally || isRowBusy}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Enregistrer le rôle"
                      >
                        {/* pictogramme disquette */}
                        <span className="text-xs">💾</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteConfirm(u.id, u.email)}
                        disabled={disabledGlobally || isRowBusy}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Supprimer l’utilisateur"
                      >
                        {/* pictogramme corbeille */}
                        <span className="text-xs">🗑️</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {confirmingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-zinc-900">
              Confirmer la suppression
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Voulez-vous vraiment supprimer l’utilisateur{" "}
              <span className="font-medium text-zinc-900">
                {confirmingUser.email}
              </span>
              ? Cette action est définitive.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmingUser(null)}
                className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete(confirmingUser.id)}
                className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
      {editingResponsabilites && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-zinc-900">
              Responsabilités de {editingResponsabilites.email}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Cochez les responsabilités à attribuer.
            </p>
            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              {responsabilites.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Aucune responsabilité définie.
                </p>
              ) : (
                responsabilites.map((r) => (
                  <label
                    key={r.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 p-3 transition hover:bg-zinc-50"
                  >
                    <input
                      type="checkbox"
                      checked={editingResponsabilites.selectedIds.has(r.id)}
                      onChange={(e) => {
                        const newSet = new Set(editingResponsabilites.selectedIds);
                        if (e.target.checked) {
                          newSet.add(r.id);
                        } else {
                          newSet.delete(r.id);
                        }
                        setEditingResponsabilites({
                          ...editingResponsabilites,
                          selectedIds: newSet
                        });
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-zinc-900">
                        {r.libelle}
                      </div>
                      {r.descriptif ? (
                        <div className="mt-0.5 truncate text-xs text-zinc-500">
                          {r.descriptif.slice(0, 80)}
                          {r.descriptif.length > 80 ? "…" : ""}
                        </div>
                      ) : null}
                    </div>
                  </label>
                ))
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingResponsabilites(null)}
                className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveResponsabilites}
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

