export type Event = {
  id: string;
  date: string; // ISO date (yyyy-mm-dd)
  type: string;
  libelle: string;
  lieu: string;
  descriptif: string | null;
  visibility: EventVisibility;
  created_at: string;
};

export type EventVisibility = "tout" | "annee_1" | "annee_2" | "equipe";

export const EVENT_VISIBILITY_OPTIONS: ReadonlyArray<{
  value: EventVisibility;
  label: string;
}> = [
  { value: "tout", label: "Tout (visible par tous)" },
  {
    value: "annee_1",
    label: "Annee 1 (catechumenes sans entree en catechumenat)"
  },
  {
    value: "annee_2",
    label: "Annee 2 (catechumenes entres en catechumenat)"
  },
  { value: "equipe", label: "Equipe (responsables et admin)" }
];

