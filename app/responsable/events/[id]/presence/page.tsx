import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { EventPresenceForm } from "@/components/responsable/event-presence-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CatechumeneWithFrat } from "@/lib/catechumenes";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: row } = await supabase
    .from("events")
    .select("libelle")
    .eq("id", id)
    .maybeSingle();

  const libelle =
    row && typeof row === "object" && "libelle" in row
      ? String((row as { libelle: unknown }).libelle ?? "")
      : "";

  return {
    title: libelle ? `Présences — ${libelle} | KTA` : "Présences | KTA"
  };
}

export default async function ResponsableEventPresencePage({
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

  const { data: eventRow, error: eventError } = await supabase
    .from("events")
    .select("id, date, libelle")
    .eq("id", id)
    .maybeSingle();

  if (eventError) throw new Error(eventError.message);
  if (!eventRow) notFound();

  const { data: catechumenes, error: catError } = await supabase
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
    .eq("est_candidat", false)
    .order("prenom");

  if (catError) throw new Error(catError.message);

  const { data: attendances, error: attError } = await supabase
    .from("event_attendances")
    .select("catechumene_id, absence_justifiee")
    .eq("event_id", id);

  if (attError) throw new Error(attError.message);

  const initialPresentCatechumeneIds =
    (attendances ?? [])
      .filter((a) => !a.absence_justifiee)
      .map((a) => a.catechumene_id) ?? [];

  const initialJustifiedAbsenceCatechumeneIds =
    (attendances ?? [])
      .filter((a) => a.absence_justifiee)
      .map((a) => a.catechumene_id) ?? [];

  const list = (catechumenes ?? []) as unknown as CatechumeneWithFrat[];

  return (
    <main className="min-h-screen bg-muted">
      <Topbar />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <Link
          href="/responsable/events"
          className="inline-block text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← Évènements
        </Link>

        <EventPresenceForm
          key={eventRow.id}
          eventId={eventRow.id}
          eventDate={eventRow.date ?? ""}
          eventLibelle={eventRow.libelle ?? ""}
          catechumenes={list}
          initialPresentCatechumeneIds={initialPresentCatechumeneIds}
          initialJustifiedAbsenceCatechumeneIds={
            initialJustifiedAbsenceCatechumeneIds
          }
        />
      </div>
    </main>
  );
}
