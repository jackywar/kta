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
  created_at: string;
};

export type CatechumeneFratInfo = {
  id: string;
  name: string;
  color_oklch: string;
};

export type CatechumeneWithFrat = Catechumene & {
  frat: CatechumeneFratInfo | null;
};
