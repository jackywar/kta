import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { CatechumeneCreateForm } from "@/components/admin/catechumene-create-form";
import { CatechumenesTable } from "@/components/admin/catechumenes-table";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Catechumene } from "@/lib/catechumenes";
import type { Frat } from "@/lib/frats";

export default async function AdminCatechumenesPage() {
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

  const { data: catechumenes, error: catechumenesError } = await supabase
    .from("catechumenes")
    .select(
      `
      *,
      frat:frats (
        id,
        name,
        color_oklch
      )
    `
    )
    .order("date_entree_catechumenat", { ascending: false });

  if (catechumenesError) throw new Error(catechumenesError.message);

  const { data: frats, error: fratsError } = await supabase
    .from("frats")
    .select("id, name, color_oklch")
    .order("name");

  if (fratsError) throw new Error(fratsError.message);

  return (
    <main className="min-h-screen bg-zinc-50">
      <Topbar />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Administration — Catéchumènes
          </h1>
          <p className="text-sm text-zinc-600">
            Gérez les catéchumènes : création, modification et suivi.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-zinc-900">
              Créer un catéchumène
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Saisissez les informations du catéchumène.
            </p>
            <div className="mt-5">
              <CatechumeneCreateForm frats={(frats as Frat[]) ?? []} />
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-zinc-900">
              Catéchumènes
            </h2>
            <div className="mt-5">
              <CatechumenesTable
                catechumenes={(catechumenes as Catechumene[]) ?? []}
                frats={(frats as Frat[]) ?? []}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
