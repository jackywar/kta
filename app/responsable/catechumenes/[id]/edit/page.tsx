import { notFound, redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { CatechumeneEditForm } from "@/components/responsable/catechumene-edit-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CatechumeneWithFrat } from "@/lib/catechumenes";
import type { Frat } from "@/lib/frats";

export default async function ResponsableCatechumeneEditPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: row, error } = await supabase
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
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) notFound();

  const { data: frats, error: fratsError } = await supabase
    .from("frats")
    .select("id, name, color_oklch")
    .order("name");

  if (fratsError) throw new Error(fratsError.message);

  const catechumene = row as unknown as CatechumeneWithFrat;

  if (catechumene.est_candidat) {
    redirect(`/responsable/candidats/${id}/edit`);
  }

  return (
    <main className="min-h-screen bg-muted">
      <Topbar />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Modifier {catechumene.prenom} {catechumene.nom}
          </h1>
          <p className="text-sm text-muted-foreground">
            Édition des informations du catéchumène.
          </p>
        </header>

        <CatechumeneEditForm
          catechumene={catechumene}
          frats={(frats as Frat[]) ?? []}
          backHref={`/responsable/catechumenes/${id}`}
        />
      </div>
    </main>
  );
}
