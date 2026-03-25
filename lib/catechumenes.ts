/** Valeurs DB pour `catechumenes.candidat_suivi_statut`. */
export type CandidatSuiviStatut =
  | "contacte_rencontre"
  | "rencontre"
  | "contacte_pas_dispo"
  | "contacte_ne_repond_pas";

export const CANDIDAT_SUIVI_STATUT_OPTIONS: ReadonlyArray<{
  value: CandidatSuiviStatut;
  emoji: string;
  /** Libellé court (tuile, liste). */
  shortLabel: string;
  /** Libellé complet (fiche). */
  label: string;
}> = [
  {
    value: "contacte_rencontre",
    emoji: "☑️",
    shortLabel: "Contacté (RDV)",
    label: "Le candidat a été contacté pour une rencontre"
  },
  {
    value: "rencontre",
    emoji: "✅",
    shortLabel: "Rencontré",
    label: "Le candidat a été rencontré"
  },
  {
    value: "contacte_pas_dispo",
    emoji: "❎",
    shortLabel: "Pas dispo",
    label:
      "Le candidat a été contacté mais n'est pas disponible pour l'instant"
  },
  {
    value: "contacte_ne_repond_pas",
    emoji: "🅾️",
    shortLabel: "Ne répond pas",
    label: "Le candidat a été contacté mais ne répond pas"
  }
];

export function getCandidatSuiviStatutMeta(
  value: CandidatSuiviStatut | null | undefined
): (typeof CANDIDAT_SUIVI_STATUT_OPTIONS)[number] | null {
  if (value == null) return null;
  return CANDIDAT_SUIVI_STATUT_OPTIONS.find((o) => o.value === value) ?? null;
}

export type Catechumene = {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  date_naissance: string | null;
  observations: string | null;
  aine_dans_la_foi: string | null;
  annee_bapteme_previsionnelle: number | null;
  rencontre_individuelle_date: string | null;
  rencontre_individuelle_texte: string | null;
  date_entree_catechumenat: string | null;
  frat_id: string | null;
  photo_path: string | null;
  /** Si true, candidat (pas dans la liste catéchumènes responsable). */
  est_candidat?: boolean;
  /** Responsable référent (profil). */
  responsable_profile_id?: string | null;
  /** Suivi candidat (fiches est_candidat). */
  candidat_suivi_statut?: CandidatSuiviStatut | null;
  created_at: string;
};

export type ProfilResponsableLite = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
};

/** Liste déroulante : profils au rôle responsable. */
export type ResponsableOption = ProfilResponsableLite;

export type CandidatWithResponsable = Catechumene & {
  responsable: ProfilResponsableLite | null;
};

export function formatProfilDisplayName(p: ProfilResponsableLite): string {
  const full = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  return full.length > 0 ? full : p.email;
}

export type CatechumeneFratInfo = {
  id: string;
  name: string;
  color_oklch: string;
};

export type CatechumeneWithFrat = Catechumene & {
  frat: CatechumeneFratInfo | null;
};
