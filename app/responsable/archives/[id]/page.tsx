import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CatechumeneAttendanceAdd } from "@/components/catechumene/catechumene-attendance-add";
import { CatechumeneAttendanceRead } from "@/components/catechumene/catechumene-attendance-read";
import { Topbar } from "@/components/layout/topbar";
import { CandidatDetail } from "@/components/responsable/candidat-detail";
import { CatechumeneDetail } from "@/components/responsable/catechumene-detail";
import { ArchiveTransitionButton } from "@/components/responsable/archive-transition-button";
import {
  CANDIDAT_SELECT_WITH_RESPONSABLE,
  normalizeCandidatRow
} from "@/lib/candidats-query";
import { getCurrentUserProfile } from "@/lib/auth/current-profile";
import {
  getCatechumeneCategory,
  type CatechumeneWithFrat
} from "@/lib/catechumenes";
import type { EventAttendance } from "@/lib/event-attendances";
import type { Event } from "@/lib/events";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch {
    return value;
  }
}

export default async function ResponsableArchiveDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await getCurrentUserProfile();

  if (!user) redirect("/login");
  if (!profile || profile.role !== "responsable") redirect("/");

  const supabase = await createSupabaseServerClient();
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

  const person = row as unknown as CatechumeneWithFrat;
  const category = getCatechumeneCategory(person);
  if (category === "candidat") redirect(`/responsable/candidats/${id}`);
  if (category === "neophyte") redirect(`/responsable/neophytes/${id}`);
  if (category === "catechumene") redirect(`/responsable/catechumenes/${id}`);

  if (person.est_candidat) {
    const { data: candidatRow, error: candidatError } = await supabase
      .from("catechumenes")
      .select(CANDIDAT_SELECT_WITH_RESPONSABLE)
      .eq("id", id)
      .maybeSingle();

    if (candidatError) throw new Error(candidatError.message);
    if (!candidatRow) notFound();

    const candidat = normalizeCandidatRow(candidatRow);

    return (
      <main className="min-h-screen bg-muted">
        <Topbar />
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/responsable/archives"
              className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              ← Archives
            </Link>
            <div className="flex items-center gap-3">
              <ArchiveTransitionButton
                catechumeneId={id}
                direction="restore"
              />
              <Link
                href={`/responsable/archives/${id}/edit`}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-medium text-muted-foreground shadow-sm transition hover:bg-muted"
              >
                Édition
              </Link>
            </div>
          </div>

          <CandidatDetail
            candidat={candidat}
            formatDate={formatDate}
            currentUserProfileId={user.id}
          />
        </div>
      </main>
    );
  }

  const [{ data: linkedProfile, error: linkedError }, eventsResult, attendanceResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id")
        .eq("role", "catechumene")
        .eq("catechumene_id", id)
        .maybeSingle(),
      supabase
        .from("events")
        .select("id, date, libelle")
        .order("date", { ascending: false }),
      supabase
        .from("event_attendances")
        .select("event_id, catechumene_id, absence_justifiee, justificatif")
        .eq("catechumene_id", id)
    ]);

  if (linkedError && linkedError.code !== "PGRST116") {
    throw new Error(linkedError.message);
  }
  if (eventsResult.error) throw new Error(eventsResult.error.message);
  if (attendanceResult.error) throw new Error(attendanceResult.error.message);

  const events = (eventsResult.data ?? []) as unknown as Pick<
    Event,
    "id" | "date" | "libelle"
  >[];
  const attendances = (attendanceResult.data ?? []) as unknown as Pick<
    EventAttendance,
    "event_id" | "absence_justifiee" | "justificatif"
  >[];

  return (
    <main className="min-h-screen bg-muted">
      <Topbar />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/responsable/archives"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ← Archives
          </Link>
          <Link
            href={`/responsable/archives/${id}/edit`}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-medium text-muted-foreground shadow-sm transition hover:bg-muted"
          >
            Édition
          </Link>
        </div>

        <CatechumeneDetail
          catechumene={person}
          formatDate={formatDate}
          isUserLinked={Boolean(linkedProfile)}
          archiveAction="restore"
        />

        <CatechumeneAttendanceRead
          catechumeneId={id}
          events={events}
          attendances={attendances}
        />

        <div className="flex justify-end">
          <CatechumeneAttendanceAdd
            catechumeneId={id}
            events={events}
            attendances={attendances}
          />
        </div>
      </div>
    </main>
  );
}
