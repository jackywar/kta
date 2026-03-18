import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  profile_id: z.string().uuid(),
  responsabilite_ids: z.array(z.string().uuid())
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

  const { profile_id, responsabilite_ids } = parsed.data;

  // Supprimer les anciennes associations
  const { error: deleteError } = await supabase
    .from("responsable_responsabilites")
    .delete()
    .eq("profile_id", profile_id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Insérer les nouvelles associations
  if (responsabilite_ids.length > 0) {
    const rows = responsabilite_ids.map((rid) => ({
      profile_id,
      responsabilite_id: rid
    }));

    const { error: insertError } = await supabase
      .from("responsable_responsabilites")
      .insert(rows);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
