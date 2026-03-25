import { NextResponse } from "next/server";
import { z } from "zod";
import { tryCreateSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  candidat_id: z.string().uuid(),
  action: z.enum(["assign", "unassign"])
});

/**
 * Affectation / désaffectation du responsable référent = utilisateur connecté (responsable).
 */
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const myId = session.user.id;

  const { data: me, error: meError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", myId)
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

  const { candidat_id, action } = parsed.data;
  const db = tryCreateSupabaseAdminClient() ?? supabase;

  const { data: row, error: fetchError } = await db
    .from("catechumenes")
    .select("id, est_candidat, responsable_profile_id")
    .eq("id", candidat_id)
    .maybeSingle();

  if (fetchError || !row) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const r = row as {
    est_candidat: boolean;
    responsable_profile_id: string | null;
  };

  if (!r.est_candidat) {
    return NextResponse.json(
      { error: "Cette fiche n'est pas un candidat." },
      { status: 400 }
    );
  }

  if (action === "unassign") {
    if (r.responsable_profile_id !== myId) {
      return NextResponse.json(
        { error: "Vous n'êtes pas le responsable affecté." },
        { status: 400 }
      );
    }
    const { error: updateError } = await db
      .from("catechumenes")
      .update({ responsable_profile_id: null })
      .eq("id", candidat_id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message ?? "Échec" },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const { error: updateError } = await db
    .from("catechumenes")
    .update({ responsable_profile_id: myId })
    .eq("id", candidat_id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message ?? "Échec" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
