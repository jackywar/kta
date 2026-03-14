import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { FratCreateForm } from "@/components/admin/frat-create-form";
import { FratsTable } from "@/components/admin/frats-table";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FratWithResponsables } from "@/lib/frats";

export default async function AdminFratsPage() {
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

  if (meProfileError) {
    throw new Error(meProfileError.message);
  }

  if (!meProfile || meProfile.role !== "admin") {
    redirect("/");
  }

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
    .order("created_at", { ascending: false });

  if (fratsError) throw new Error(fratsError.message);

  const { data: responsables, error: responsablesError } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name")
    .eq("role", "responsable")
    .order("email");

  if (responsablesError) throw new Error(responsablesError.message);

  return (
    <main className="min-h-screen bg-zinc-50">
      <Topbar />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Administration — Frats
          </h1>
          <p className="text-sm text-zinc-600">
            Créez et modifiez les Frats et leurs couleurs.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-zinc-900">
              Créer une frat
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Donnez un nom et une couleur à la frat.
            </p>
            <div className="mt-5">
              <FratCreateForm />
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-zinc-900">Frats</h2>
            <div className="mt-5">
              <FratsTable
              frats={(frats as FratWithResponsables[]) ?? []}
              availableResponsables={responsables ?? []}
            />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

