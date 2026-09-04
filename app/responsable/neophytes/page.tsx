import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { CatechumeneTilesWithFilter } from "@/components/responsable/catechumene-tiles";
import { getCurrentUserProfile } from "@/lib/auth/current-profile";
import {
  CATECHUMENE_TILE_SELECT,
  type CatechumeneTileData
} from "@/lib/catechumenes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Néophytes | KTA"
};

export default async function ResponsableNeophytesPage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user) redirect("/login");
  if (!profile || profile.role !== "responsable") redirect("/");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("catechumenes")
    .select(CATECHUMENE_TILE_SELECT)
    .eq("est_candidat", false)
    .eq("est_neophyte", true)
    .order("prenom");

  if (error) throw new Error(error.message);

  return (
    <main className="min-h-screen bg-muted">
      <Topbar />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Néophytes</h1>
          <p className="text-sm text-muted-foreground">
            Catéchumènes baptisés ayant été basculés manuellement vers les
            néophytes.
          </p>
        </header>

        <CatechumeneTilesWithFilter
          catechumenes={(data ?? []) as unknown as CatechumeneTileData[]}
          responsableFratIds={[]}
          detailBasePath="/responsable/neophytes"
          emptyLabel="Aucun néophyte."
          showFratFilter={false}
        />
      </div>
    </main>
  );
}
