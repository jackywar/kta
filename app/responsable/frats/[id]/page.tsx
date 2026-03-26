import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { CatechumeneTiles } from "@/components/responsable/catechumene-tiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CatechumeneWithFrat } from "@/lib/catechumenes";
import type { FratWithResponsables } from "@/lib/frats";

export default async function ResponsableFratDetailPage({
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

  const { data: fratRow, error: fratError } = await supabase
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
    .eq("id", id)
    .maybeSingle();

  if (fratError) throw new Error(fratError.message);
  if (!fratRow) notFound();

  const frat = fratRow as unknown as FratWithResponsables;

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
    .eq("frat_id", id)
    .eq("est_candidat", false)
    .order("prenom");

  if (catError) throw new Error(catError.message);

  const list = (catechumenes ?? []) as unknown as CatechumeneWithFrat[];

  const responsables =
    (frat.responsables ?? [])
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
    <main className="min-h-screen bg-muted">
      <Topbar />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/responsable/frats"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ← Frats
          </Link>
          <Link
            href="/responsable/catechumenes/new"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            Ajouter un catéchumène
          </Link>
        </div>

        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{frat.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground"
              title="Couleur de la frat"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: frat.color_oklch }}
                aria-hidden
              />
              Frat
            </span>
            <span className="text-xs text-muted-foreground">
              {responsables.length > 0
                ? `Responsables : ${responsables.join(", ")}`
                : "Aucun responsable"}
            </span>
          </div>
        </header>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Catéchumènes ({list.length})
          </h2>
          <CatechumeneTiles catechumenes={list} />
        </section>
      </div>
    </main>
  );
}

