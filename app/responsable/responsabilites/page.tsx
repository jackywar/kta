import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import {
  ResponsabilitesRecap,
  responsableDisplayName,
  type ResponsabiliteRecapRow
} from "@/components/responsable/responsabilites-recap";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Responsabilite } from "@/lib/responsabilites";

export const metadata: Metadata = {
  title: "Récapitulatif des responsabilités | KTA"
};

export default async function ResponsableResponsabilitesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  if (!profile || profile.role !== "responsable") redirect("/");

  const { data: responsabilites, error: respError } = await supabase
    .from("responsabilites")
    .select("*")
    .order("libelle");

  if (respError) throw new Error(respError.message);

  const { data: associations, error: assocError } = await supabase
    .from("responsable_responsabilites")
    .select("profile_id, responsabilite_id");

  if (assocError) throw new Error(assocError.message);

  const profileIds = [
    ...new Set((associations ?? []).map((a) => a.profile_id as string))
  ];

  type ProfileRow = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    role: string;
  };

  let profiles: ProfileRow[] = [];
  if (profileIds.length > 0) {
    const { data: profData, error: profError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, role")
      .in("id", profileIds);

    if (profError) throw new Error(profError.message);
    profiles = (profData ?? []) as ProfileRow[];
  }

  const profileById = new Map(profiles.map((p) => [p.id, p]));

  const list = (responsabilites ?? []) as Responsabilite[];
  const rows: ResponsabiliteRecapRow[] = list.map((r) => {
    const assocForR = (associations ?? []).filter(
      (a) => (a as { responsabilite_id: string }).responsabilite_id === r.id
    );

    const responsables = assocForR.map((a) => {
      const pid = (a as { profile_id: string }).profile_id;
      const p = profileById.get(pid);
      if (!p) {
        return {
          id: pid,
          displayName: "Profil non accessible",
          role: "—"
        };
      }
      return {
        id: p.id,
        displayName: responsableDisplayName(p),
        role: p.role
      };
    });

    return {
      id: r.id,
      libelle: r.libelle,
      descriptif: r.descriptif,
      responsables
    };
  });

  return (
    <main className="min-h-screen bg-zinc-50">
      <Topbar />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Récapitulatif des responsabilités
          </h1>
          <p className="text-sm text-zinc-600">
            Liste des responsabilités et des personnes associées (lecture seule).
          </p>
        </header>

        <ResponsabilitesRecap rows={rows} />
      </div>
    </main>
  );
}
