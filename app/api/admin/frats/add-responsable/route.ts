import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  frat_id: z.string().uuid(),
  email: z.string().email()
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

  const email = parsed.data.email.toLowerCase();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Utilisateur introuvable pour cet email." },
      { status: 404 }
    );
  }

  const { error: insertError } = await supabase
    .from("frat_responsables")
    .upsert(
      {
        frat_id: parsed.data.frat_id,
        profile_id: profile.id
      },
      { onConflict: "frat_id,profile_id" }
    );

  if (insertError) {
    return NextResponse.json(
      {
        error:
          insertError.message ??
          "Une erreur est survenue lors de l’ajout du responsable."
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

