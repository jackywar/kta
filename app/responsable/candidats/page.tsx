import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { CandidatTilesWithFilter } from "@/components/responsable/candidat-tiles";
import {
  CANDIDAT_SELECT_WITH_RESPONSABLE,
  normalizeCandidatRow
} from "@/lib/candidats-query";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Candidats | KTA"
};

export default async function ResponsableCandidatsPage() {
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

  const { data: rows, error } = await supabase
    .from("catechumenes")
    .select(CANDIDAT_SELECT_WITH_RESPONSABLE)
    .eq("est_candidat", true)
    .order("prenom");

  if (error) throw new Error(error.message);

  const candidats = (rows ?? []).map(normalizeCandidatRow);

  return (
    <main className="min-h-screen bg-zinc-50">
      <Topbar />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Candidats</h1>
            <p className="text-sm text-zinc-600">
              Fiches candidats avant bascule en catéchumène.
            </p>
          </div>
          <Link
            href="/responsable/candidats/new"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
          >
            Nouveau candidat
          </Link>
        </header>

        <CandidatTilesWithFilter candidats={candidats} />
      </div>
    </main>
  );
}
