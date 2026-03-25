import type { CandidatWithResponsable, ProfilResponsableLite } from "@/lib/catechumenes";

/**
 * Sélection PostgREST pour joindre le responsable référent (FK
 * `catechumenes.responsable_profile_id` → `profiles.id`).
 */
export const CANDIDAT_SELECT_WITH_RESPONSABLE = `
  *,
  responsable:profiles!responsable_profile_id (
    id,
    first_name,
    last_name,
    email
  )
` as const;

export function normalizeCandidatRow(row: unknown): CandidatWithResponsable {
  const r = row as Record<string, unknown>;
  let responsable: ProfilResponsableLite | null = null;
  const raw = r.responsable;
  if (raw) {
    responsable = (Array.isArray(raw) ? raw[0] : raw) as ProfilResponsableLite;
  }
  const { responsable: _ignored, ...base } = r;
  return { ...base, responsable } as CandidatWithResponsable;
}
