"use client";

import { useMemo, useState, useTransition } from "react";
import { roleSchema, type Role } from "@/lib/roles";

export type ProfileRow = {
  id: string;
  email: string;
  role: Role;
  created_at: string;
};

type RowState = {
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

export function UsersTable({ users }: { users: ProfileRow[] }) {
  const [state, setState] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      users.map((u) => [
        u.id,
        {
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
  const [isPending, startTransition] = useTransition();
  const disabledGlobally = useMemo(
    () => isPending || users.length === 0,
    [isPending, users.length]
  );

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
      await fetch("/api/admin/users/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, role: row.role })
      });
      window.location.reload();
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
      window.location.reload();
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
      window.location.reload();
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-600">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Nouveau mot de passe</th>
              <th className="px-4 py-3">Créé le</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {users.map((u) => {
              const row = state[u.id] ?? {
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
    </div>
  );
}

