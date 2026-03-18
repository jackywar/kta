"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const EVENT_TYPE_OPTIONS = ["rencontre", "reunion equipe", "étape"] as const;
type EventTypeOption = (typeof EVENT_TYPE_OPTIONS)[number] | "autre";

type FormValues = {
  date: string;
  type: string; // valeur finale envoyée à l'API (non éditée directement)
  type_option: EventTypeOption;
  type_autre: string;
  libelle: string;
  lieu: string;
  descriptif: string;
};

const emptyForm: FormValues = {
  date: "",
  type: "",
  type_option: "rencontre",
  type_autre: "",
  libelle: "",
  lieu: "ND Talence",
  descriptif: ""
};

export function EventCreateForm({
  redirectOnSuccess
}: {
  redirectOnSuccess?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [values, setValues] = useState<FormValues>({ ...emptyForm });

  const canSubmit = useMemo(() => {
    const typeValue =
      values.type_option === "autre"
        ? values.type_autre.trim()
        : values.type_option;
    return (
      values.date.trim().length > 0 &&
      typeValue.trim().length > 0 &&
      values.libelle.trim().length > 0 &&
      values.lieu.trim().length > 0
    );
  }, [
    values.date,
    values.type_option,
    values.type_autre,
    values.libelle,
    values.lieu
  ]);

  const set = (key: keyof FormValues, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const typeValue =
        values.type_option === "autre"
          ? values.type_autre.trim()
          : values.type_option;
      const body = {
        date: values.date.trim(),
        type: typeValue,
        libelle: values.libelle.trim(),
        lieu: values.lieu.trim(),
        descriptif: values.descriptif.trim() || undefined
      };

      const res = await fetch("/api/admin/events/create", {
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
          "Erreur lors de la création de l'évènement.";
        setError(msg);
        return;
      }

      setValues({ ...emptyForm });
      setSuccess("Évènement créé.");
      if (redirectOnSuccess) {
        router.push(redirectOnSuccess);
        router.refresh();
      } else {
        router.refresh();
      }
    });
  }

  const inputClass =
    "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900" htmlFor="ev-date">
          Date
        </label>
        <input
          id="ev-date"
          type="date"
          value={values.date}
          onChange={(e) => set("date", e.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-900" htmlFor="ev-type">
            Type d&apos;évènement
          </label>
          <select
            id="ev-type"
            value={values.type_option}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                type_option: e.target.value as EventTypeOption
              }))
            }
            className={inputClass}
            required
          >
            {EVENT_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
            <option value="autre">Autre…</option>
          </select>
          {values.type_option === "autre" ? (
            <input
              type="text"
              value={values.type_autre}
              onChange={(e) => set("type_autre", e.target.value)}
              className={inputClass}
              placeholder="Saisir un autre type…"
              required
            />
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-900" htmlFor="ev-lieu">
            Lieu
          </label>
          <input
            id="ev-lieu"
            type="text"
            value={values.lieu}
            onChange={(e) => set("lieu", e.target.value)}
            className={inputClass}
            placeholder="Paroisse, salle…"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900" htmlFor="ev-libelle">
          Libellé
        </label>
        <input
          id="ev-libelle"
          type="text"
          value={values.libelle}
          onChange={(e) => set("libelle", e.target.value)}
          className={inputClass}
          placeholder="Ex: Rencontre de rentrée"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900" htmlFor="ev-desc">
          Descriptif (Markdown)
        </label>
        <textarea
          id="ev-desc"
          rows={5}
          value={values.descriptif}
          onChange={(e) => set("descriptif", e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-mono shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          placeholder="Détails de l'évènement…"
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
        disabled={isPending || !canSubmit}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Création…" : "Créer l'évènement"}
      </button>
    </form>
  );
}

