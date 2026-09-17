import { notFound, redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { CandidatEditForm } from "@/components/responsable/candidat-edit-form";
import { CatechumeneEditForm } from "@/components/responsable/catechumene-edit-form";
import { getCurrentUserProfile } from "@/lib/auth/current-profile";
import {
  getCatechumeneCategory,
  type Catechumene,
  type CatechumeneWithFrat,
  type ResponsableOption
} from "@/lib/catechumenes";
import type { Frat } from "@/lib/frats";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ResponsableArchiveEditPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await getCurrentUserProfile();

  if (!user) redirect("/login");
  if (!profile || profile.role !== "responsable") redirect("/");

  const supabase = await createSupabaseServerClient();
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

  const person = row as unknown as CatechumeneWithFrat;
  const category = getCatechumeneCategory(person);
  if (category === "candidat") {
    redirect(`/responsable/candidats/${id}/edit`);
  }
  if (category === "neophyte") {
    redirect(`/responsable/neophytes/${id}/edit`);
  }
  if (category === "catechumene") {
    redirect(`/responsable/catechumenes/${id}/edit`);
  }

  if (person.est_candidat) {
    const { data: respRows, error: respError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .eq("role", "responsable")
      .order("last_name", { ascending: true });

    if (respError) throw new Error(respError.message);

    return (
      <main className="min-h-screen bg-muted">
        <Topbar />
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Modifier {person.prenom} {person.nom}
            </h1>
            <p className="text-sm text-muted-foreground">
              Édition d&apos;un candidat archivé.
            </p>
          </header>

          <CandidatEditForm
            candidat={person as Catechumene}
            responsables={(respRows ?? []) as ResponsableOption[]}
          />
        </div>
      </main>
    );
  }

  const { data: frats, error: fratsError } = await supabase
    .from("frats")
    .select("id, name, color_oklch")
    .order("name");

  if (fratsError) throw new Error(fratsError.message);

  return (
    <main className="min-h-screen bg-muted">
      <Topbar />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Modifier {person.prenom} {person.nom}
          </h1>
          <p className="text-sm text-muted-foreground">
            Édition d&apos;une fiche archivée.
          </p>
        </header>

        <CatechumeneEditForm
          catechumene={person}
          frats={(frats as Frat[]) ?? []}
          backHref={`/responsable/archives/${id}`}
        />
      </div>
    </main>
  );
}
