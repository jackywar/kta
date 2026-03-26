import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { CandidatDetail } from "@/components/responsable/candidat-detail";
import {
  CANDIDAT_SELECT_WITH_RESPONSABLE,
  normalizeCandidatRow
} from "@/lib/candidats-query";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatDate(s: string | null): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch {
    return s;
  }
}

export default async function ResponsableCandidatDetailPage({
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
    .select(CANDIDAT_SELECT_WITH_RESPONSABLE)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) notFound();

  const candidat = normalizeCandidatRow(row);
  if (!candidat.est_candidat) {
    redirect(`/responsable/catechumenes/${id}`);
  }

  return (
    <main className="min-h-screen bg-muted">
      <Topbar />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/responsable/candidats"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ← Candidats
          </Link>
          <Link
            href={`/responsable/candidats/${id}/edit`}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-medium text-muted-foreground shadow-sm transition hover:bg-muted"
          >
            Édition
          </Link>
        </div>

        <CandidatDetail
          candidat={candidat}
          formatDate={formatDate}
          currentUserProfileId={session.user.id}
        />
      </div>
    </main>
  );
}
