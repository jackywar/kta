import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileResponsabilites } from "@/components/profile/profile-responsabilites";
import type { Responsabilite } from "@/lib/responsabilites";

export const metadata: Metadata = {
  title: "Mon profil | KTA"
};

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error || !profile) {
    throw new Error(error?.message ?? "Profil introuvable");
  }

  let responsabilites: Responsabilite[] = [];

  if (profile.role === "responsable") {
    const { data: associations, error: assocError } = await supabase
      .from("responsable_responsabilites")
      .select("responsabilite_id")
      .eq("profile_id", profile.id);

    if (assocError) throw new Error(assocError.message);

    const responsabiliteIds = (associations ?? []).map(
      (a) => (a as { responsabilite_id: string }).responsabilite_id
    );

    if (responsabiliteIds.length > 0) {
      const { data: respData, error: respError } = await supabase
        .from("responsabilites")
        .select("*")
        .in("id", responsabiliteIds)
        .order("libelle");

      if (respError) throw new Error(respError.message);
      responsabilites = (respData ?? []) as Responsabilite[];
    }
  }

  return (
    <main className="min-h-screen bg-muted">
      <Topbar />
      <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Informations personnelles
          </h1>
          <p className="text-sm text-muted-foreground">
            Modifiez votre nom, prénom et gérez la réinitialisation de votre
            mot de passe.
          </p>
        </header>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <ProfileForm
            initialEmail={profile.email}
            initialFirstName={profile.first_name ?? ""}
            initialLastName={profile.last_name ?? ""}
          />
        </section>

        {profile.role === "responsable" ? (
          <ProfileResponsabilites responsabilites={responsabilites} />
        ) : null}
      </div>
    </main>
  );
}

