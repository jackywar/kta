import { NextResponse } from "next/server";
import { z } from "zod";
import { tryCreateSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const candidatSuiviStatutSchema = z.enum([
  "contacte_rencontre",
  "rencontre",
  "contacte_pas_dispo",
  "contacte_ne_repond_pas"
]);

const bodySchema = z.object({
  id: z.string().uuid(),
  nom: z.string().min(1),
  prenom: z.string().min(1),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  telephone: z.string().optional(),
  date_naissance: z.string().optional(),
  rencontre_individuelle_date: z.string().optional().nullable(),
  rencontre_individuelle_texte: z.string().optional().nullable(),
  responsable_profile_id: z.union([z.string().uuid(), z.null()]).optional(),
  candidat_suivi_statut: z
    .union([candidatSuiviStatutSchema, z.null()])
    .optional()
});

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: me, error: meError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (meError || !me || me.role !== "responsable") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const emailVal = typeof d.email === "string" ? d.email.trim() : "";

  const db = tryCreateSupabaseAdminClient() ?? supabase;

  const { data: row, error: fetchError } = await db
    .from("catechumenes")
    .select("id, est_candidat")
    .eq("id", d.id)
    .maybeSingle();

  if (fetchError || !row) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  if (!(row as { est_candidat: boolean }).est_candidat) {
    return NextResponse.json(
      { error: "Cette fiche n'est pas un candidat." },
      { status: 400 }
    );
  }

  let responsableId: string | null | undefined =
    d.responsable_profile_id === undefined
      ? undefined
      : d.responsable_profile_id;
  if (responsableId !== undefined && responsableId !== null) {
    const { data: rp, error: rpErr } = await db
      .from("profiles")
      .select("id, role")
      .eq("id", responsableId)
      .maybeSingle();
    if (rpErr || !rp || (rp as { role: string }).role !== "responsable") {
      return NextResponse.json(
        { error: "Responsable invalide." },
        { status: 400 }
      );
    }
  }

  const patch: Record<string, unknown> = {
    nom: d.nom.trim(),
    prenom: d.prenom.trim(),
    email: emailVal || null,
    telephone: d.telephone?.trim() ?? null,
    date_naissance: d.date_naissance?.trim() || null,
    rencontre_individuelle_date: d.rencontre_individuelle_date?.trim() || null,
    rencontre_individuelle_texte: d.rencontre_individuelle_texte?.trim() ?? null
  };
  if (responsableId !== undefined) {
    patch.responsable_profile_id = responsableId;
  }
  if (d.candidat_suivi_statut !== undefined) {
    patch.candidat_suivi_statut = d.candidat_suivi_statut;
  }

  const { error: updateError } = await db
    .from("catechumenes")
    .update(patch)
    .eq("id", d.id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message ?? "Échec de la mise à jour" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
