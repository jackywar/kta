export type Event = {
  id: string;
  date: string; // ISO date (yyyy-mm-dd)
  type: string;
  libelle: string;
  lieu: string;
  descriptif: string | null;
  created_at: string;
};

