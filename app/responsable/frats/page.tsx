import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { FratTiles, type FratTileData } from "@/components/responsable/frat-tiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FratWithResponsables } from "@/lib/frats";

export const metadata: Metadata = {
  title: "Frats | KTA"
};

export default async function ResponsableFratsPage() {
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
    .order("name");

  if (fratsError) throw new Error(fratsError.message);

  const { data: catechumeneFrats, error: cfError } = await supabase
    .from("catechumenes")
    .select("frat_id");

  if (cfError) throw new Error(cfError.message);

  const counts = new Map<string, number>();
  for (const row of catechumeneFrats ?? []) {
    const id = row.frat_id as string | null;
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const tiles: FratTileData[] = (((frats ?? []) as unknown) as FratWithResponsables[]).map(
    (f) => ({
      ...f,
      membersCount: counts.get(f.id) ?? 0
    })
  );

  return (
    <main className="min-h-screen bg-zinc-50">
      <Topbar />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Frats</h1>
          <p className="text-sm text-zinc-600">
            Consultez les frats, leurs responsables et leurs membres.
          </p>
        </header>

        <FratTiles frats={tiles} />
      </div>
    </main>
  );
}

