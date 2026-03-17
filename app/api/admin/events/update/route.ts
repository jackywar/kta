import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  id: z.string().uuid(),
  date: z.string().min(1),
  type: z.string().min(1),
  libelle: z.string().min(1),
  lieu: z.string().min(1),
  descriptif: z.string().optional()
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
  const { error: updateError } = await supabase
    .from("events")
    .update({
      date: d.date.trim(),
      type: d.type.trim(),
      libelle: d.libelle.trim(),
      lieu: d.lieu.trim(),
      descriptif: d.descriptif?.trim() || null
    })
    .eq("id", d.id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message ?? "Failed to update event" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

