import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  id: z.string().uuid()
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

  // Optionnel: empêcher un admin de se supprimer lui-même
  if (parsed.data.id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdminClient();

  const { error: deleteError } = await admin.auth.admin.deleteUser(
    parsed.data.id
  );

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message ?? "Failed to delete user" },
      { status: 500 }
    );
  }

  // profiles row will be deleted by ON DELETE CASCADE.

  return NextResponse.json({ ok: true }, { status: 200 });
}

