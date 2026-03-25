import { NextResponse } from "next/server";
import { z } from "zod";
import { tryCreateSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
const statutEnum = z.enum([
  "contacte_rencontre",
  "rencontre",
  "contacte_pas_dispo",
  "contacte_ne_repond_pas"
]);

const bodySchema = z.object({
  candidat_id: z.string().uuid(),
  candidat_suivi_statut: z.union([statutEnum, z.null()])
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

  const { candidat_id, candidat_suivi_statut } = parsed.data;
  const db = tryCreateSupabaseAdminClient() ?? supabase;

  const { data: row, error: fetchError } = await db
    .from("catechumenes")
    .select("id, est_candidat")
    .eq("id", candidat_id)
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

  const { error: updateError } = await db
    .from("catechumenes")
    .update({ candidat_suivi_statut })
    .eq("id", candidat_id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message ?? "Échec" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
