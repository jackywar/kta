import { notFound, redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { CatechumeneEditForm } from "@/components/responsable/catechumene-edit-form";
import { getCurrentUserProfile } from "@/lib/auth/current-profile";
import {
  getCatechumeneCategory,
  type CatechumeneWithFrat
} from "@/lib/catechumenes";
import type { Frat } from "@/lib/frats";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ResponsableNeophyteEditPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await getCurrentUserProfile();

  if (!user) redirect("/login");
  if (!profile || profile.role !== "responsable") redirect("/");

  const supabase = await createSupabaseServerClient();
  const [{ data: row, error }, { data: frats, error: fratsError }] =
    await Promise.all([
      supabase
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
        .maybeSingle(),
      supabase.from("frats").select("id, name, color_oklch").order("name")
    ]);

  if (error) throw new Error(error.message);
  if (fratsError) throw new Error(fratsError.message);
  if (!row) notFound();

  const neophyte = row as unknown as CatechumeneWithFrat;
  const category = getCatechumeneCategory(neophyte);
  if (category === "candidat") {
    redirect(`/responsable/candidats/${id}/edit`);
  }
  if (category === "catechumene") {
    redirect(`/responsable/catechumenes/${id}/edit`);
  }

  return (
    <main className="min-h-screen bg-muted">
      <Topbar />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Modifier {neophyte.prenom} {neophyte.nom}
          </h1>
          <p className="text-sm text-muted-foreground">
            Édition des informations du néophyte.
          </p>
        </header>

        <CatechumeneEditForm
          catechumene={neophyte}
          frats={(frats as Frat[]) ?? []}
          backHref={`/responsable/neophytes/${id}`}
        />
      </div>
    </main>
  );
}
