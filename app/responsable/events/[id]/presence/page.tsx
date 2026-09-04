import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { EventPresenceForm } from "@/components/responsable/event-presence-form";
import { getCurrentUserProfile } from "@/lib/auth/current-profile";
import {
  CATECHUMENE_TILE_SELECT,
  type CatechumeneTileData
} from "@/lib/catechumenes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PresenceEvent = { id: string; date: string | null; libelle: string | null };

/** Mémoïsé : `generateMetadata` et la page partagent le même aller-retour. */
const getPresenceEvent = cache(
  async (id: string): Promise<PresenceEvent | null> => {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("events")
      .select("id, date, libelle")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as PresenceEvent | null) ?? null;
  }
);

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const row = await getPresenceEvent(id);
  const libelle = row?.libelle ?? "";

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
  const { user, profile } = await getCurrentUserProfile();

  if (!user) redirect("/login");
  if (!profile || profile.role !== "responsable") redirect("/");

  const eventRow = await getPresenceEvent(id);
  if (!eventRow) notFound();

  const supabase = await createSupabaseServerClient();

  const { data: catechumenes, error: catError } = await supabase
    .from("catechumenes")
    .select(CATECHUMENE_TILE_SELECT)
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

  const list = (catechumenes ?? []) as unknown as CatechumeneTileData[];

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
