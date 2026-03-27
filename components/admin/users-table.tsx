"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { roleSchema, type Role } from "@/lib/roles";
import type { Responsabilite, ResponsableResponsabilite } from "@/lib/responsabilites";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type ProfileRow = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: Role;
  created_at: string;
  disabled_at?: string | null;
};

type RowState = {
  firstName: string;
  lastName: string;
  role: Role;
  newPassword: string;
  savingRole: boolean;
  resettingPassword: boolean;
  deleting: boolean;
  togglingDisabled: boolean;
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
          deleting: false,
          togglingDisabled: false
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
      <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
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

  async function handleToggleDisabled(id: string, nextDisabled: boolean) {
    setState((prev) => ({
      ...prev,
      [id]: { ...prev[id], togglingDisabled: true }
    }));

    startTransition(async () => {
      await fetch("/api/admin/users/toggle-disabled", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, disabled: nextDisabled })
      });
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
          <tbody className="divide-y divide-border bg-card">
            {users.map((u) => {
              const row = state[u.id] ?? {
                firstName: u.first_name ?? "",
                lastName: u.last_name ?? "",
                role: u.role,
                newPassword: "",
                savingRole: false,
                resettingPassword: false,
                deleting: false,
                togglingDisabled: false
              };

              const isRowBusy =
                row.savingRole ||
                row.resettingPassword ||
                row.deleting ||
                row.togglingDisabled;

              const isDisabled = Boolean(u.disabled_at);

              return (
                <tr
                  key={u.id}
                  className={`hover:bg-muted/70 ${isDisabled ? "opacity-60" : ""}`}
                >
                  <td className="px-4 py-3 text-foreground">
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
                        className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
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
                        className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {u.email}
                    {isDisabled ? (
                      <div className="mt-1">
                        <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          Désactivé
                        </span>
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Select
                        value={row.role}
                        onValueChange={(v) =>
                          setState((prev) => ({
                            ...prev,
                            [u.id]: {
                              ...prev[u.id],
                              role: roleSchema.parse(v)
                            }
                          }))
                        }
                        disabled={disabledGlobally || isRowBusy}
                      >
                        <SelectTrigger className="h-8 w-auto min-w-[130px] rounded-lg px-2 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleSchema.options.map((r) => (
                            <SelectItem key={r} value={r}>
                              {roleLabels[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "responsable" ? (
                      <div className="flex flex-col gap-1">
                        {(() => {
                          const ids = associationsByProfileId.get(u.id) ?? [];
                          if (ids.length === 0) {
                            return (
                              <span className="text-xs text-muted-foreground">
                                Aucune
                              </span>
                            );
                          }
                          return ids.slice(0, 2).map((rid) => {
                            const r = responsabilitesById.get(rid);
                            return r ? (
                              <span
                                key={rid}
                                className="inline-block max-w-[120px] truncate rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                                title={r.libelle}
                              >
                                {r.libelle}
                              </span>
                            ) : null;
                          });
                        })()}
                        {(associationsByProfileId.get(u.id)?.length ?? 0) > 2 ? (
                          <span className="text-xs text-muted-foreground">
                            +{(associationsByProfileId.get(u.id)?.length ?? 0) - 2} autres
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => openResponsabilitesModal(u.id, u.email)}
                          disabled={disabledGlobally || isRowBusy}
                          className="mt-1 inline-flex h-7 items-center justify-center rounded-lg border border-border bg-card px-2 text-xs text-muted-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Modifier
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleResetPassword(u.email)}
                        disabled={disabledGlobally || isRowBusy}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        title="Envoyer un lien de réinitialisation de mot de passe"
                      >
                        {/* pictogramme clé simple */}
                        <span className="text-xs">🔑</span>
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(u.created_at).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleDisabled(u.id, !isDisabled)}
                        disabled={disabledGlobally || isRowBusy}
                        className={`inline-flex h-8 items-center justify-center rounded-lg border bg-card px-2 text-xs shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          isDisabled
                            ? "border-border text-muted-foreground hover:bg-muted"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                        title={isDisabled ? "Réactiver l’utilisateur" : "Désactiver l’utilisateur"}
                      >
                        {row.togglingDisabled
                          ? "…"
                          : isDisabled
                            ? "Réactiver"
                            : "Désactiver"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveRole(u.id)}
                        disabled={disabledGlobally || isRowBusy}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        title="Enregistrer le rôle"
                      >
                        {/* pictogramme disquette */}
                        <span className="text-xs">💾</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteConfirm(u.id, u.email)}
                        disabled={disabledGlobally || isRowBusy}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-destructive/30 bg-card text-destructive shadow-sm transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
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
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-foreground">
              Confirmer la suppression
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Voulez-vous vraiment supprimer l’utilisateur{" "}
              <span className="font-medium text-foreground">
                {confirmingUser.email}
              </span>
              ? Cette action est définitive.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmingUser(null)}
                className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition hover:bg-muted"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete(confirmingUser.id)}
                className="inline-flex items-center justify-center rounded-lg border border-destructive/30 bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground shadow-sm transition hover:bg-destructive/90"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
      {editingResponsabilites && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-foreground">
              Responsabilités de {editingResponsabilites.email}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cochez les responsabilités à attribuer.
            </p>
            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              {responsabilites.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune responsabilité définie.
                </p>
              ) : (
                responsabilites.map((r) => (
                  <label
                    key={r.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition hover:bg-muted"
                  >
                    <Checkbox
                      checked={editingResponsabilites.selectedIds.has(r.id)}
                      onCheckedChange={(checked) => {
                        const newSet = new Set(editingResponsabilites.selectedIds);
                        if (checked === true) {
                          newSet.add(r.id);
                        } else {
                          newSet.delete(r.id);
                        }
                        setEditingResponsabilites({
                          ...editingResponsabilites,
                          selectedIds: newSet
                        });
                      }}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground">
                        {r.libelle}
                      </div>
                      {r.descriptif ? (
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
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
                className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition hover:bg-muted"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveResponsabilites}
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
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

