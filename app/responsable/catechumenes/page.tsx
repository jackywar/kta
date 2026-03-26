import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { CatechumeneTilesWithFilter } from "@/components/responsable/catechumene-tiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CatechumeneWithFrat } from "@/lib/catechumenes";

export const metadata: Metadata = {
  title: "Catéchumènes | KTA"
};

export default async function ResponsableCatechumenesPage() {
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

  const { data: responsableFrats, error: rfError } = await supabase
    .from("frat_responsables")
    .select("frat_id")
    .eq("profile_id", session.user.id);

  if (rfError) throw new Error(rfError.message);
  const responsableFratIds =
    responsableFrats?.map((r) => r.frat_id).filter(Boolean) ?? [];

  const { data: catechumenes, error: catError } = await supabase
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
    .eq("est_candidat", false)
    .order("prenom");

  if (catError) throw new Error(catError.message);

  const list = (catechumenes ?? []) as unknown as CatechumeneWithFrat[];

  return (
    <main className="min-h-screen bg-muted">
      <Topbar />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Catéchumènes
            </h1>
            <p className="text-sm text-muted-foreground">
              Tous les catéchumènes.
            </p>
          </div>
          <Link
            href="/responsable/catechumenes/new"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            Ajouter un catéchumène
          </Link>
        </header>

        <CatechumeneTilesWithFilter
          catechumenes={list}
          responsableFratIds={responsableFratIds}
        />
      </div>
    </main>
  );
}
