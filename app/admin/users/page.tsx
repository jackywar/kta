import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { UserCreateForm } from "@/components/admin/user-create-form";
import { UsersTable } from "@/components/admin/users-table";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Responsabilite, ResponsableResponsabilite } from "@/lib/responsabilites";

export const metadata: Metadata = {
  title: "Utilisateurs | Admin | KTA"
};

export default async function AdminUsersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: meProfile, error: meProfileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (meProfileError) {
    throw new Error(meProfileError.message);
  }

  if (!meProfile || meProfile.role !== "admin") {
    redirect("/");
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, role, created_at")
    .order("created_at", { ascending: false });

  if (profilesError) throw new Error(profilesError.message);

  const { data: responsabilites, error: respError } = await supabase
    .from("responsabilites")
    .select("*")
    .order("libelle");

  if (respError) throw new Error(respError.message);

  const { data: associations, error: assocError } = await supabase
    .from("responsable_responsabilites")
    .select("*");

  if (assocError) throw new Error(assocError.message);

  return (
    <main className="min-h-screen bg-muted">
      <Topbar />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Administration — Utilisateurs
          </h1>
          <p className="text-sm text-muted-foreground">
            Créez des comptes et attribuez un rôle.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-medium text-foreground">
              Créer un utilisateur
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Un mot de passe aléatoire sera généré et envoyé par email.
            </p>
            <div className="mt-5">
              <UserCreateForm />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-medium text-foreground">
              Utilisateurs
            </h2>
            <div className="mt-5">
              <UsersTable
                users={profiles ?? []}
                responsabilites={(responsabilites as Responsabilite[]) ?? []}
                associations={(associations as ResponsableResponsabilite[]) ?? []}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

