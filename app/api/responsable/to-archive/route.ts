import { NextResponse } from "next/server";
import { z } from "zod";
import { tryCreateSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  id: z.string().uuid()
});

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: me, error: meError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    meError ||
    !me ||
    (me.role !== "admin" && me.role !== "responsable")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const db = tryCreateSupabaseAdminClient() ?? supabase;
  const { data: person, error: fetchError } = await db
    .from("catechumenes")
    .select("id, est_archive, frat_id")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (fetchError || !person) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  if (person.est_archive) {
    return NextResponse.json(
      { error: "Cette fiche est déjà archivée." },
      { status: 400 }
    );
  }

  if (person.frat_id) {
    return NextResponse.json(
      { error: "Retirez la frat avant d'archiver." },
      { status: 400 }
    );
  }

  const { data: updated, error: updateError } = await db
    .from("catechumenes")
    .update({ est_archive: true })
    .eq("id", parsed.data.id)
    .eq("est_archive", false)
    .is("frat_id", null)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message ?? "Échec de l'archivage" },
      { status: 500 }
    );
  }
  if (!updated) {
    return NextResponse.json(
      { error: "La fiche a changé. Rechargez la page puis réessayez." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
