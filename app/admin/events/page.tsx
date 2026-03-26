import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { EventCreateForm } from "@/components/admin/event-create-form";
import { EventsTable } from "@/components/admin/events-table";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Event } from "@/lib/events";

export const metadata: Metadata = {
  title: "Évènements | Admin | KTA"
};

export default async function AdminEventsPage() {
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

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (eventsError) throw new Error(eventsError.message);

  return (
    <main className="min-h-screen bg-muted">
      <Topbar />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Administration — Évènements
          </h1>
          <p className="text-sm text-muted-foreground">
            Créez, modifiez et supprimez des évènements.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-medium text-foreground">
              Créer un évènement
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Saisissez les informations (descriptif en Markdown).
            </p>
            <div className="mt-5">
              <EventCreateForm />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-medium text-foreground">Évènements</h2>
            <div className="mt-5">
              <EventsTable events={(events as Event[]) ?? []} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

