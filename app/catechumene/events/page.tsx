import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { ResponsableEventsCalendar } from "@/components/responsable/events-calendar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Event } from "@/lib/events";

export default async function CatechumeneEventsPage() {
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

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile || profile.role !== "catechumene") {
    redirect("/");
  }

  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (
    <main className="min-h-screen bg-zinc-50">
      <Topbar />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Évènements</h1>
          <p className="text-sm text-zinc-600">
            Calendrier mensuel (par défaut) ou liste filtrable.
          </p>
        </header>

        <ResponsableEventsCalendar events={(events as Event[]) ?? []} readOnly />
      </div>
    </main>
  );
}

