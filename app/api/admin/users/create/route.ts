import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { roleSchema } from "@/lib/roles";
import { getAdminEnv } from "@/lib/supabase/env";

const bodySchema = z.object({
  email: z.string().email(),
  role: roleSchema
});

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Server-side admin check (RLS-protected data via anon key + session cookies)
  const { data: me, error: meError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (meError) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!me || me.role !== "admin") {
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
  const env = getAdminEnv();

  const redirectTo = `${env.APP_URL.replace(/\/$/, "")}/auth/confirm?next=/auth/update-password`;

  const { data: invited, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(parsed.data.email.toLowerCase(), {
      redirectTo
    });

  if (inviteError || !invited.user) {
    return NextResponse.json(
      { error: inviteError?.message ?? "User invitation failed" },
      { status: 400 }
    );
  }

  // Maintain application profile row with desired role
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: invited.user.id,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role
    },
    { onConflict: "id" }
  );

  if (profileError) {
    return NextResponse.json(
      { error: "Profile upsert failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

