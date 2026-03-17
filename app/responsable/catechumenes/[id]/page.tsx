import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { CatechumeneDetail } from "@/components/responsable/catechumene-detail";
import { CatechumeneAttendanceRead } from "@/components/catechumene/catechumene-attendance-read";
import { CatechumeneAttendanceAdd } from "@/components/catechumene/catechumene-attendance-add";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CatechumeneWithFrat } from "@/lib/catechumenes";
import type { Event } from "@/lib/events";
import type { EventAttendance } from "@/lib/event-attendances";

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

export default async function ResponsableCatechumeneDetailPage({
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
    .select(
      `
      *,
      frat:frats (
        id,
        name,
        color_oklch
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) notFound();

  const catechumene = row as unknown as CatechumeneWithFrat;

  const { data: linkedProfile, error: linkedProfileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "catechumene")
    .eq("catechumene_id", id)
    .maybeSingle();

  if (linkedProfileError && linkedProfileError.code !== "PGRST116") {
    // PGRST116 = not found / no rows, which is fine
    throw new Error(linkedProfileError.message);
  }

  const isUserLinked = !!linkedProfile;

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, date, libelle")
    .order("date", { ascending: false });

  if (eventsError) throw new Error(eventsError.message);

  const { data: attendances, error: attError } = await supabase
    .from("event_attendances")
    .select("event_id, catechumene_id, absence_justifiee, justificatif")
    .eq("catechumene_id", id);

  if (attError) throw new Error(attError.message);

  return (
    <main className="min-h-screen bg-zinc-50">
      <Topbar />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/responsable/catechumenes"
            className="text-sm font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
          >
            ← Catéchumènes
          </Link>
          <Link
            href={`/responsable/catechumenes/${id}/edit`}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            Édition
          </Link>
        </div>

        <CatechumeneDetail
          catechumene={catechumene}
          formatDate={formatDate}
          isUserLinked={isUserLinked}
        />

        <CatechumeneAttendanceRead
          catechumeneId={id}
          events={((events ?? []) as unknown) as Pick<Event, "id" | "date" | "libelle">[]}
          attendances={((attendances ?? []) as unknown) as Pick<
            EventAttendance,
            "event_id" | "absence_justifiee" | "justificatif"
          >[]}
        />

        <div className="flex justify-end">
          <CatechumeneAttendanceAdd
            catechumeneId={id}
            events={((events ?? []) as unknown) as Pick<Event, "id" | "date" | "libelle">[]}
            attendances={((attendances ?? []) as unknown) as Pick<
              EventAttendance,
              "event_id"
            >[]}
          />
        </div>
      </div>
    </main>
  );
}
