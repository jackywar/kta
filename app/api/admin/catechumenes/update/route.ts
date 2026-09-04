import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  id: z.string().uuid(),
  nom: z.string().min(1),
  prenom: z.string().min(1),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  telephone: z.string().optional(),
  date_naissance: z.string().optional(),
  observations: z.string().optional(),
  aine_dans_la_foi: z.string().optional(),
  annee_bapteme_previsionnelle: z.number().int().min(1900).max(2100).optional().nullable(),
  date_bapteme: z.string().date().optional().nullable(),
  rencontre_individuelle_date: z.string().optional().nullable(),
  rencontre_individuelle_texte: z.string().optional().nullable(),
  date_entree_catechumenat: z.string().optional(),
  frat_id: z.string().uuid().optional().nullable(),
  est_candidat: z.boolean().optional()
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

  const allowedRoles = ["admin", "responsable"];
  if (meError || !me || !allowedRoles.includes(me.role)) {
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

  const { data: current, error: currentError } = await supabase
    .from("catechumenes")
    .select("est_neophyte")
    .eq("id", d.id)
    .maybeSingle();

  if (currentError || !current) {
    return NextResponse.json(
      { error: currentError?.message ?? "Catéchumène introuvable" },
      { status: currentError ? 500 : 404 }
    );
  }

  if (
    current.est_neophyte &&
    (!d.date_bapteme || d.frat_id || d.est_candidat === true)
  ) {
    return NextResponse.json(
      {
        error:
          "Un néophyte doit conserver une date de baptême, rester sans frat et ne peut pas être candidat."
      },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("catechumenes")
    .update({
      nom: d.nom.trim(),
      prenom: d.prenom.trim(),
      email: emailVal || null,
      telephone: d.telephone?.trim() ?? null,
      date_naissance: d.date_naissance?.trim() || null,
      observations: d.observations?.trim() ?? null,
      aine_dans_la_foi: d.aine_dans_la_foi?.trim() ?? null,
      annee_bapteme_previsionnelle: d.annee_bapteme_previsionnelle ?? null,
      date_bapteme: d.date_bapteme?.trim() || null,
      rencontre_individuelle_date: d.rencontre_individuelle_date?.trim() || null,
      rencontre_individuelle_texte: d.rencontre_individuelle_texte?.trim() ?? null,
      date_entree_catechumenat: d.date_entree_catechumenat?.trim() || null,
      frat_id: d.frat_id ?? null,
      ...(d.est_candidat !== undefined ? { est_candidat: d.est_candidat } : {})
    })
    .eq("id", d.id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message ?? "Failed to update catechumene" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
