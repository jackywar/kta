import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { ResponsabiliteCreateForm } from "@/components/admin/responsabilite-create-form";
import { ResponsabilitesTable } from "@/components/admin/responsabilites-table";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Responsabilite } from "@/lib/responsabilites";

export default async function AdminResponsabilitesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: meProfile, error: meProfileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (meProfileError) throw new Error(meProfileError.message);
  if (!meProfile || meProfile.role !== "admin") redirect("/");

  const { data: responsabilites, error: respError } = await supabase
    .from("responsabilites")
    .select("*")
    .order("libelle");

  if (respError) throw new Error(respError.message);

  return (
    <main className="min-h-screen bg-zinc-50">
      <Topbar />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Administration — Responsabilités
          </h1>
          <p className="text-sm text-zinc-600">
            Créez, modifiez et supprimez des responsabilités.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-zinc-900">
              Créer une responsabilité
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Saisissez le libellé et le descriptif (Markdown).
            </p>
            <div className="mt-5">
              <ResponsabiliteCreateForm />
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-zinc-900">
              Responsabilités
            </h2>
            <div className="mt-5">
              <ResponsabilitesTable
                responsabilites={(responsabilites as Responsabilite[]) ?? []}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
