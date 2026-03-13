"use client";

import { useMemo, useState, useTransition } from "react";
import { z } from "zod";
import { roleSchema } from "@/lib/roles";

const formSchema = z.object({
  email: z.string().email("Email invalide"),
  role: roleSchema
});

type FormValues = z.infer<typeof formSchema>;

const roleLabels: Record<FormValues["role"], string> = {
  admin: "Admin",
  responsable: "Responsable",
  catechumene: "Catéchumène"
};

export function UserCreateForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [values, setValues] = useState<FormValues>({
    email: "",
    role: "catechumene"
  });

  const canSubmit = useMemo(() => values.email.trim().length > 0, [values.email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const parsed = formSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data)
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

      setValues({ email: "", role: "catechumene" });
      setSuccess("Utilisateur créé. Un email a été envoyé.");
      // Refresh server data (table) by reloading route cache
      window.location.reload();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900" htmlFor="new-email">
          Email
        </label>
        <input
          id="new-email"
          type="email"
          autoComplete="off"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          placeholder="nouveau@exemple.fr"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900" htmlFor="new-role">
          Rôle
        </label>
        <select
          id="new-role"
          value={values.role}
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              role: roleSchema.parse(e.target.value)
            }))
          }
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
        >
          {roleSchema.options.map((r) => (
            <option key={r} value={r}>
              {roleLabels[r]}
            </option>
          ))}
        </select>
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
        {isPending ? "Création…" : "Créer"}
      </button>
    </form>
  );
}

