import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  first_name: z.string().trim().optional().nullable(),
  last_name: z.string().trim().optional().nullable()
});

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updatePayload: {
    first_name?: string | null;
    last_name?: string | null;
  } = {};

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

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json(
      {
        error:
          updateError.message ??
          "Une erreur est survenue lors de la mise à jour du profil."
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

