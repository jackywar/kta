import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/roles";
import type { PaletteName, ThemeMode } from "@/lib/theme";
import { normalizePalette, normalizeThemeMode } from "@/lib/theme";

export type CurrentProfile = {
  id: string;
  email: string;
  role: Role | null;
  first_name: string | null;
  last_name: string | null;
  catechumene_id: string | null;
  disabled_at: string | null;
  theme_mode: ThemeMode;
  theme_palette: PaletteName;
};

export type CurrentUserProfile = {
  user: User | null;
  profile: CurrentProfile | null;
};

const PROFILE_COLUMNS =
  "id, email, role, first_name, last_name, catechumene_id, disabled_at, theme_mode, theme_palette";

/**
 * Lit l'utilisateur authentifié et son profil en une seule passe.
 *
 * `cache()` mémoïse le résultat pour la durée d'un rendu serveur : le layout
 * racine, la Topbar et la page partagent donc le même aller-retour Supabase.
 */
export const getCurrentUserProfile = cache(
  async (): Promise<CurrentUserProfile> => {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) return { user: null, profile: null };

    const { data } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", user.id)
      .maybeSingle();

    if (!data) return { user, profile: null };

    const row = data as Record<string, unknown>;

    return {
      user,
      profile: {
        id: String(row.id),
        email: String(row.email ?? user.email ?? ""),
        role: (row.role as Role | null) ?? null,
        first_name: (row.first_name as string | null) ?? null,
        last_name: (row.last_name as string | null) ?? null,
        catechumene_id: (row.catechumene_id as string | null) ?? null,
        disabled_at: (row.disabled_at as string | null) ?? null,
        theme_mode: normalizeThemeMode(row.theme_mode),
        theme_palette: normalizePalette(row.theme_palette)
      }
    };
  }
);

/** Profil seul (null si non connecté ou profil absent). */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const { profile } = await getCurrentUserProfile();
  return profile;
}
