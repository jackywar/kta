import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { CatechumeneTilesWithFilter } from "@/components/responsable/catechumene-tiles";
import { getCurrentUserProfile } from "@/lib/auth/current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  CATECHUMENE_TILE_SELECT,
  type CatechumeneTileData
} from "@/lib/catechumenes";

export const metadata: Metadata = {
  title: "Catéchumènes | KTA"
};

export default async function ResponsableCatechumenesPage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user) redirect("/login");
  if (!profile || profile.role !== "responsable") redirect("/");

  const supabase = await createSupabaseServerClient();

  const { data: responsableFrats, error: rfError } = await supabase
    .from("frat_responsables")
    .select("frat_id")
    .eq("profile_id", user.id);

  if (rfError) throw new Error(rfError.message);
  const responsableFratIds =
    responsableFrats?.map((r) => r.frat_id).filter(Boolean) ?? [];

  const { data: catechumenes, error: catError } = await supabase
    .from("catechumenes")
    .select(CATECHUMENE_TILE_SELECT)
    .eq("est_candidat", false)
    .eq("est_neophyte", false)
    .order("prenom");

  if (catError) throw new Error(catError.message);

  const list = (catechumenes ?? []) as unknown as CatechumeneTileData[];

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
