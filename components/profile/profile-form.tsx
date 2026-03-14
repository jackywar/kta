"use client";

import { useState, useTransition } from "react";

type Props = {
  initialEmail: string;
  initialFirstName: string;
  initialLastName: string;
};

export function ProfileForm({
  initialEmail,
  initialFirstName,
  initialLastName
}: Props) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSavingTransition] = useTransition();
  const [isResetting, startResetTransition] = useTransition();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const payload = {
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null
    };

    startSavingTransition(async () => {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          (typeof data === "object" &&
            data &&
            "error" in data &&
            typeof (data as { error: unknown }).error === "string" &&
            (data as { error: string }).error) ||
          "Erreur lors de la mise à jour du profil.";
        setError(msg);
        return;
      }

      setMessage("Profil mis à jour.");
    });
  }

  function handleResetPassword() {
    setMessage(null);
    setError(null);

    startResetTransition(async () => {
      const res = await fetch("/api/profile/reset-password", {
        method: "POST"
      });

      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          (typeof data === "object" &&
            data &&
            "error" in data &&
            typeof (data as { error: unknown }).error === "string" &&
            (data as { error: string }).error) ||
          "Erreur lors de l’envoi de l’email de réinitialisation.";
        setError(msg);
        return;
      }

      setMessage(
        "Un email de réinitialisation de mot de passe vous a été envoyé."
      );
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={initialEmail}
          readOnly
          className="h-11 w-full cursor-not-allowed rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-600 shadow-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-zinc-900"
            htmlFor="first-name"
          >
            Prénom
          </label>
          <input
            id="first-name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
            placeholder="Votre prénom"
            autoComplete="given-name"
          />
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-zinc-900"
            htmlFor="last-name"
          >
            Nom
          </label>
          <input
            id="last-name"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
            placeholder="Votre nom"
            autoComplete="family-name"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
        <button
          type="button"
          onClick={handleResetPassword}
          disabled={isResetting}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isResetting ? "Envoi en cours…" : "Réinitialiser le mot de passe"}
        </button>
      </div>
    </form>
  );
}

