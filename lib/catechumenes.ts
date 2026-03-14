export type Catechumene = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  date_naissance: string | null;
  observations: string | null;
  aine_dans_la_foi: string | null;
  annee_bapteme_previsionnelle: number | null;
  rencontre_individuelle_date: string | null;
  rencontre_individuelle_texte: string | null;
  date_entree_catechumenat: string;
  created_at: string;
};
