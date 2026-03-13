"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { z } from "zod";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const schema = z
  .object({
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    confirm: z.string()
  })
  .refine((data) => data.password === data.confirm, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirm"]
  });

export function UpdatePasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setError(firstIssue?.message ?? "Formulaire invalide.");
      return;
    }

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setError(
          "Lien expiré ou invalide. Veuillez redemander un email de réinitialisation."
        );
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: parsed.data.password
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess("Votre mot de passe a été mis à jour.");

      setTimeout(() => {
        router.replace("/login");
      }, 1500);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          className="text-sm font-medium text-zinc-900"
          htmlFor="new-password"
        >
          Nouveau mot de passe
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          placeholder="••••••••••"
        />
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium text-zinc-900"
          htmlFor="confirm-password"
        >
          Confirmer le mot de passe
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          placeholder="••••••••••"
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
        disabled={isPending}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Mise à jour…" : "Enregistrer le mot de passe"}
      </button>
    </form>
  );
}

