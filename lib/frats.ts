export type Frat = {
  id: string;
  name: string;
  color_oklch: string;
  created_at: string;
};

export type FratResponsable = {
  frat_id: string;
  profile_id: string;
};

export type FratWithResponsables = Frat & {
  responsables: {
    profile: {
      id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
    } | null;
  }[];
};

