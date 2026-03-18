export type Responsabilite = {
  id: string;
  libelle: string;
  descriptif: string | null;
  created_at: string;
};

export type ResponsableResponsabilite = {
  profile_id: string;
  responsabilite_id: string;
};
