import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

  if (
    meError ||
    !me ||
    (me.role !== "admin" && me.role !== "responsable")
  ) {
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

  const catechumeneId = parsed.data.catechumene_id;

  // Récupérer les infos du catéchumène
  const { data: c, error: cError } = await supabase
    .from("catechumenes")
    .select("id, email, prenom, nom")
    .eq("id", catechumeneId)
    .maybeSingle();

  if (cError || !c) {
    return NextResponse.json({ error: "Catéchumène introuvable" }, { status: 404 });
  }

  if (!c.email) {
    return NextResponse.json(
      { error: "Le catéchumène n'a pas d'email saisi" },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdminClient();

  // Crée l'utilisateur + envoie le mail d'activation
  const { data: invited, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(c.email.toLowerCase(), {
      data: {
        first_name: c.prenom,
        last_name: c.nom
      }
    });

  if (inviteError || !invited?.user) {
    return NextResponse.json(
      { error: inviteError?.message ?? "Erreur lors de la création du user" },
      { status: 500 }
    );
  }

  // Lier le profil applicatif au catéchumène + rôle 'catechumene'
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      role: "catechumene",
      catechumene_id: c.id,
      first_name: c.prenom,
      last_name: c.nom
    })
    .eq("id", invited.user.id);

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message ?? "Erreur lors du lien profil/catéchumène" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

