import { notFound, redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { CandidatEditForm } from "@/components/responsable/candidat-edit-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Catechumene, ResponsableOption } from "@/lib/catechumenes";

export default async function ResponsableCandidatEditPage({
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
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) notFound();

  const c = row as Catechumene;
  if (!c.est_candidat) {
    redirect(`/responsable/catechumenes/${id}/edit`);
  }

  const { data: respRows, error: respError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .eq("role", "responsable")
    .order("last_name", { ascending: true });

  if (respError) throw new Error(respError.message);

  const responsables = (respRows ?? []) as ResponsableOption[];

  return (
    <main className="min-h-screen bg-zinc-50">
      <Topbar />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Modifier {c.prenom} {c.nom}
          </h1>
          <p className="text-sm text-zinc-600">Candidat — champs limités.</p>
        </header>

        <CandidatEditForm candidat={c} responsables={responsables} />
      </div>
    </main>
  );
}
