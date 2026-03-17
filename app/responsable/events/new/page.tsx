import Link from "next/link";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { EventCreateForm } from "@/components/admin/event-create-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ResponsableEventNewPage() {
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

  return (
    <main className="min-h-screen bg-zinc-50">
      <Topbar />
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/responsable/events"
            className="text-sm font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
          >
            ← Évènements
          </Link>
        </div>

        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Ajouter un évènement
          </h1>
          <p className="text-sm text-zinc-600">
            Date, type, libellé, lieu (par défaut ND Talence) et descriptif en
            Markdown.
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <EventCreateForm redirectOnSuccess="/responsable/events" />
        </section>
      </div>
    </main>
  );
}

