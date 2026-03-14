import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  id: z.string().uuid(),
  nom: z.string().min(1),
  prenom: z.string().min(1),
  email: z.string().email(),
  telephone: z.string().optional(),
  date_naissance: z.string().optional(),
  observations: z.string().optional(),
  aine_dans_la_foi: z.string().optional(),
  annee_bapteme_previsionnelle: z.number().int().min(1900).max(2100).optional().nullable(),
  rencontre_individuelle_date: z.string().optional().nullable(),
  rencontre_individuelle_texte: z.string().optional().nullable(),
  date_entree_catechumenat: z.string().min(1)
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

  if (meError || !me || me.role !== "admin") {
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
  const { error: updateError } = await supabase
    .from("catechumenes")
    .update({
      nom: d.nom.trim(),
      prenom: d.prenom.trim(),
      email: d.email.trim(),
      telephone: d.telephone?.trim() ?? null,
      date_naissance: d.date_naissance?.trim() || null,
      observations: d.observations?.trim() ?? null,
      aine_dans_la_foi: d.aine_dans_la_foi?.trim() ?? null,
      annee_bapteme_previsionnelle: d.annee_bapteme_previsionnelle ?? null,
      rencontre_individuelle_date: d.rencontre_individuelle_date?.trim() || null,
      rencontre_individuelle_texte: d.rencontre_individuelle_texte?.trim() ?? null,
      date_entree_catechumenat: d.date_entree_catechumenat.trim()
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
