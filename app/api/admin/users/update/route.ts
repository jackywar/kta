import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { managedUserRoleSchema } from "@/lib/roles";

const bodySchema = z.object({
  id: z.string().uuid(),
  role: managedUserRoleSchema,
  first_name: z.string().trim().optional().nullable(),
  last_name: z.string().trim().optional().nullable()
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

  const admin = createSupabaseAdminClient();
  const { data: target, error: targetError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (targetError || !target) {
    return NextResponse.json(
      { error: targetError?.message ?? "User not found" },
      { status: targetError ? 500 : 404 }
    );
  }

  if (target.role === "admin") {
    return NextResponse.json(
      { error: "The admin account cannot be modified here." },
      { status: 403 }
    );
  }

  const updatePayload: {
    role: string;
    first_name?: string | null;
    last_name?: string | null;
  } = {
    role: parsed.data.role
  };

  if ("first_name" in parsed.data) {
    updatePayload.first_name =
      parsed.data.first_name && parsed.data.first_name.length > 0
        ? parsed.data.first_name
        : null;
  }

  if ("last_name" in parsed.data) {
    updatePayload.last_name =
      parsed.data.last_name && parsed.data.last_name.length > 0
        ? parsed.data.last_name
        : null;
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update(updatePayload)
    .eq("id", parsed.data.id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message ?? "Failed to update role" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

