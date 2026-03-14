import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CATECHUMENE_PHOTOS_BUCKET } from "@/lib/storage";

const bodySchema = z.object({
  catechumene_id: z.string().uuid()
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

  const admin = createSupabaseAdminClient();
  const { data: row, error: fetchError } = await admin
    .from("catechumenes")
    .select("id, photo_path")
    .eq("id", parsed.data.catechumene_id)
    .maybeSingle();

  if (fetchError || !row) {
    return NextResponse.json(
      { error: "Catéchumène introuvable" },
      { status: 404 }
    );
  }

  if (row.photo_path) {
    await admin.storage
      .from(CATECHUMENE_PHOTOS_BUCKET)
      .remove([row.photo_path]);
  }

  const { error: updateError } = await admin
    .from("catechumenes")
    .update({ photo_path: null })
    .eq("id", parsed.data.catechumene_id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message ?? "Failed to update" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
