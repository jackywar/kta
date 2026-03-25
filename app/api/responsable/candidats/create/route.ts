import { NextResponse } from "next/server";
import { z } from "zod";
import { tryCreateSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  nom: z.string().min(1),
  prenom: z.string().min(1),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  telephone: z.string().optional(),
  date_naissance: z.string().optional(),
  rencontre_individuelle_date: z.string().optional().nullable(),
  rencontre_individuelle_texte: z.string().optional().nullable(),
  responsable_profile_id: z.union([z.string().uuid(), z.null()]).optional()
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

  const responsableId: string | null =
    d.responsable_profile_id === undefined ? null : d.responsable_profile_id;
  if (responsableId) {
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

  const { data: inserted, error: insertError } = await db
    .from("catechumenes")
    .insert({
      nom: d.nom.trim(),
      prenom: d.prenom.trim(),
      email: emailVal || null,
      telephone: d.telephone?.trim() ?? null,
      date_naissance: d.date_naissance?.trim() || null,
      rencontre_individuelle_date: d.rencontre_individuelle_date?.trim() || null,
      rencontre_individuelle_texte: d.rencontre_individuelle_texte?.trim() ?? null,
      est_candidat: true,
      frat_id: null,
      date_entree_catechumenat: null,
      responsable_profile_id: responsableId
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message ?? "Échec de la création" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { ok: true, id: inserted?.id },
    { status: 201 }
  );
}
