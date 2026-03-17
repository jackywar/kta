import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { CatechumeneTiles } from "@/components/responsable/catechumene-tiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CatechumeneWithFrat } from "@/lib/catechumenes";
import type { FratWithResponsables } from "@/lib/frats";

export default async function CatechumeneFratPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, catechumene_id")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile || profile.role !== "catechumene" || !profile.catechumene_id) {
    redirect("/");
  }

  const { data: catechumeneRow, error: catechumeneError } = await supabase
    .from("catechumenes")
    .select(
      `
      *,
      frat:frats (
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
      )
    `
    )
    .eq("id", profile.catechumene_id)
    .maybeSingle();

  if (catechumeneError) {
    throw new Error(catechumeneError.message);
  }

  if (!catechumeneRow || !catechumeneRow.frat) {
    // Si le catéchumène n'est lié à aucune frat, on redirige vers l'accueil.
    redirect("/");
  }

  const me = catechumeneRow as unknown as CatechumeneWithFrat & {
    frat: FratWithResponsables;
  };

  const fratId = me.frat.id;

  const { data: membersRows, error: membersError } = await supabase
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
    .eq("frat_id", fratId)
    .order("prenom");

  if (membersError) {
    throw new Error(membersError.message);
  }

  const members = (membersRows ?? []) as unknown as CatechumeneWithFrat[];

  const responsables =
    (me.frat.responsables ?? [])
      .map((r) => r.profile)
      .filter(Boolean)
      .map((p) => {
        const full = [p!.first_name, p!.last_name]
          .filter(Boolean)
          .join(" ")
          .trim();
        return full || p!.email;
      }) ?? [];

  return (
    <main className="min-h-screen bg-zinc-50">
      <Topbar />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {me.frat.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600">
            <span
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-900"
              title="Couleur de la frat"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: me.frat.color_oklch }}
                aria-hidden
              />
              Frat
            </span>
            <span className="text-xs text-zinc-500">
              {responsables.length > 0
                ? `Responsables : ${responsables.join(", ")}`
                : "Aucun responsable"}
            </span>
          </div>
        </header>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900">
            Membres de la frat ({members.length})
          </h2>
          <CatechumeneTiles catechumenes={members} clickable={false} />
        </section>
      </div>
    </main>
  );
}

