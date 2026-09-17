import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { count, error: countError } = await supabase
    .from("catechumenes")
    .select("id", { count: "exact", head: true })
    .eq("frat_id", parsed.data.id);

  if (countError) {
    return NextResponse.json(
      { error: countError.message ?? "Failed to check frat members" },
      { status: 500 }
    );
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "Impossible de supprimer une frat qui contient encore des membres." },
      { status: 400 }
    );
  }

  const { error: deleteError } = await supabase
    .from("frats")
    .delete()
    .eq("id", parsed.data.id);

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message ?? "Failed to delete frat" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
