import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { ResponsableEventsCalendar } from "@/components/responsable/events-calendar";
import { getCurrentUserProfile } from "@/lib/auth/current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Event } from "@/lib/events";

export const metadata: Metadata = {
  title: "Évènements | KTA"
};

export default async function CatechumeneEventsPage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user) redirect("/login");
  if (!profile || profile.role !== "catechumene") {
    redirect("/");
  }

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
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Évènements</h1>
          <p className="text-sm text-muted-foreground">
            Calendrier mensuel (par défaut) ou liste filtrable.
          </p>
        </header>

        <ResponsableEventsCalendar events={(events as Event[]) ?? []} readOnly />
      </div>
    </main>
  );
}

