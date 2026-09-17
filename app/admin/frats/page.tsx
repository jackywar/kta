import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { FratCreateForm } from "@/components/admin/frat-create-form";
import { FratsTable } from "@/components/admin/frats-table";
import { getCurrentUserProfile } from "@/lib/auth/current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FratWithResponsables } from "@/lib/frats";

export const metadata: Metadata = {
  title: "Frats | Admin | KTA"
};

export default async function AdminFratsPage() {
  const { user, profile: meProfile } = await getCurrentUserProfile();

  if (!user) redirect("/login");
  if (!meProfile || meProfile.role !== "admin") {
    redirect("/");
  }

  const supabase = await createSupabaseServerClient();

  const { data: frats, error: fratsError } = await supabase
    .from("frats")
    .select(
      `
      id,
      name,
      color_oklch,
      created_at,
      responsables:frat_responsables (
        profile:profiles (
          id,
          email,
          first_name,
          last_name
        )
      )
    `
    )
    .order("created_at", { ascending: false });

  if (fratsError) throw new Error(fratsError.message);

  const { data: responsables, error: responsablesError } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name")
    .eq("role", "responsable")
    .order("email");

  if (responsablesError) throw new Error(responsablesError.message);

  const { data: memberRows, error: memberError } = await supabase
    .from("catechumenes")
    .select("frat_id")
    .not("frat_id", "is", null);

  if (memberError) throw new Error(memberError.message);

  const memberCountByFratId: Record<string, number> = {};
  for (const row of memberRows ?? []) {
    if (!row.frat_id) continue;
    memberCountByFratId[row.frat_id] = (memberCountByFratId[row.frat_id] ?? 0) + 1;
  }

  return (
    <main className="min-h-screen bg-muted">
      <Topbar />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Administration — Frats
          </h1>
          <p className="text-sm text-muted-foreground">
            Créez et modifiez les Frats et leurs couleurs.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-medium text-foreground">
              Créer une frat
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Donnez un nom et une couleur à la frat.
            </p>
            <div className="mt-5">
              <FratCreateForm />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-medium text-foreground">Frats</h2>
            <div className="mt-5">
              <FratsTable
                frats={((frats ?? []) as unknown) as FratWithResponsables[]}
                availableResponsables={responsables ?? []}
                memberCountByFratId={memberCountByFratId}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

