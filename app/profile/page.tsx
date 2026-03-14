import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/profile-form";

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
    .select("id, email, first_name, last_name")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error || !profile) {
    throw new Error(error?.message ?? "Profil introuvable");
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <Topbar />
      <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Informations personnelles
          </h1>
          <p className="text-sm text-zinc-600">
            Modifiez votre nom, prénom et gérez la réinitialisation de votre
            mot de passe.
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <ProfileForm
            initialEmail={profile.email}
            initialFirstName={profile.first_name ?? ""}
            initialLastName={profile.last_name ?? ""}
          />
        </section>
      </div>
    </main>
  );
}

