"use client";

import { useMemo, useState, useTransition } from "react";
import { z } from "zod";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
  remember: z.boolean()
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<LoginValues>({
    email: "",
    password: "",
    remember: true
  });

  const canSubmit = useMemo(() => {
    return values.email.trim().length > 0 && values.password.length > 0;
  }, [values.email, values.password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password
      });

      if (signInError) {
        setError("Email ou mot de passe incorrect.");
        return;
      }

      // Navigation pleine page : évite la course replace/refresh (refresh sur la mauvaise route)
      // et garantit HTML/RSC alignés sur la nouvelle session (topbar, droits).
      window.location.assign("/");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          placeholder="prenom.nom@exemple.fr"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900" htmlFor="password">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={values.password}
          onChange={(e) =>
            setValues((v) => ({ ...v, password: e.target.value }))
          }
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          placeholder="••••••••••••"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer select-none items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={values.remember}
            onChange={(e) =>
              setValues((v) => ({ ...v, remember: e.target.checked }))
            }
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-300"
          />
          Se souvenir de moi
        </label>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !canSubmit}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}

