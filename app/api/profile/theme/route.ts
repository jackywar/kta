import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const paletteSchema = z.enum(["default", "blue", "red"]);
const modeSchema = z.enum(["light", "dark", "system"]);

const updateSchema = z.object({
  mode: modeSchema.optional(),
  palette: paletteSchema.optional()
});

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("theme_mode, theme_palette")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Profil introuvable" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      mode: modeSchema.catch("system").parse(data.theme_mode ?? "system"),
      palette: paletteSchema.catch("default").parse(
        data.theme_palette ?? "default"
      )
    },
    { status: 200 }
  );
}

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
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updatePayload: {
    theme_mode?: z.infer<typeof modeSchema>;
    theme_palette?: z.infer<typeof paletteSchema>;
  } = {};

  if (parsed.data.mode) updatePayload.theme_mode = parsed.data.mode;
  if (parsed.data.palette) updatePayload.theme_palette = parsed.data.palette;

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message ?? "Erreur lors de la mise à jour." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

