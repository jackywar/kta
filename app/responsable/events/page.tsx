import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { ResponsableEventsCalendar } from "@/components/responsable/events-calendar";
import { getCurrentUserProfile } from "@/lib/auth/current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Event } from "@/lib/events";

export const metadata: Metadata = {
  title: "Évènements | KTA"
};

export default async function ResponsableEventsPage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user) redirect("/login");
  if (!profile || profile.role !== "responsable") redirect("/");

  const supabase = await createSupabaseServerClient();

  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (
    <main className="min-h-screen bg-muted">
      <Topbar />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Évènements</h1>
            <p className="text-sm text-muted-foreground">
              Calendrier mensuel (par défaut) ou liste filtrable.
            </p>
          </div>
          <Link
            href="/responsable/events/new"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            Ajouter un évènement
          </Link>
        </header>

        <ResponsableEventsCalendar events={(events as Event[]) ?? []} />
      </div>
    </main>
  );
}

