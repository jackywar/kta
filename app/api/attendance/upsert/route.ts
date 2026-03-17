import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  event_id: z.string().uuid(),
  catechumene_id: z.string().uuid(),
  // true = absence justifiée, false ou undefined = présence
  absence_justifiee: z.boolean().optional(),
  justificatif: z.string().optional()
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
  const absenceJustifiee = Boolean(d.absence_justifiee);
  const justificatif = absenceJustifiee
    ? d.justificatif?.trim() || null
    : null;

  const { error: upsertError } = await supabase
    .from("event_attendances")
    .upsert(
      {
        event_id: d.event_id,
        catechumene_id: d.catechumene_id,
        absence_justifiee: absenceJustifiee,
        justificatif
      },
      { onConflict: "event_id,catechumene_id" }
    );

  if (upsertError) {
    return NextResponse.json(
      { error: upsertError.message ?? "Failed to upsert attendance" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

