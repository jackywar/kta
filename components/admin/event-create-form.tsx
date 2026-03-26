"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EVENT_VISIBILITY_OPTIONS, type EventVisibility } from "@/lib/events";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  visibility: EventVisibility;
};

const emptyForm: FormValues = {
  date: "",
  type: "",
  type_option: "rencontre",
  type_autre: "",
  libelle: "",
  lieu: "ND Talence",
  descriptif: "",
  visibility: "tout"
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
        descriptif: values.descriptif.trim() || undefined,
        visibility: values.visibility
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
    "h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="ev-date">
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
          <label className="text-sm font-medium text-foreground" htmlFor="ev-type">
            Type d&apos;évènement
          </label>
          <Select
            value={values.type_option}
            onValueChange={(v) =>
              setValues((prev) => ({ ...prev, type_option: v as EventTypeOption }))
            }
          >
            <SelectTrigger id="ev-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPE_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
              <SelectItem value="autre">Autre…</SelectItem>
            </SelectContent>
          </Select>
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
          <label className="text-sm font-medium text-foreground" htmlFor="ev-lieu">
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
        <label className="text-sm font-medium text-foreground" htmlFor="ev-visibility">
          Visibilite
        </label>
        <Select
          value={values.visibility}
          onValueChange={(v) => set("visibility", v as EventVisibility)}
        >
          <SelectTrigger id="ev-visibility">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EVENT_VISIBILITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="ev-libelle">
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
        <label className="text-sm font-medium text-foreground" htmlFor="ev-desc">
          Descriptif (Markdown)
        </label>
        <textarea
          id="ev-desc"
          rows={5}
          value={values.descriptif}
          onChange={(e) => set("descriptif", e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-mono shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          placeholder="Détails de l'évènement…"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
          {success}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !canSubmit}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Création…" : "Créer l'évènement"}
      </button>
    </form>
  );
}

