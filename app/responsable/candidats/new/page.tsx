import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { CandidatCreateForm } from "@/components/responsable/candidat-create-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ResponsableOption } from "@/lib/catechumenes";

export default async function ResponsableCandidatNewPage() {
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
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Nouveau candidat
          </h1>
          <p className="text-sm text-zinc-600">
            Crée une fiche candidat (statut distinct du catéchumène).
          </p>
        </header>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <CandidatCreateForm responsables={responsables} />
        </div>
      </div>
    </main>
  );
}
