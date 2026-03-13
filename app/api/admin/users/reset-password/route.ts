import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminEnv } from "@/lib/supabase/env";

const bodySchema = z.object({
  email: z.string().email()
});

export async function POST(req: Request) {

  try {
    const supabase = await createSupabaseServerClient();

    // 🔐 Vérification utilisateur connecté
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("[reset-password] getUser error:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user) {
      console.warn("[reset-password] no authenticated user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    // 🔐 Vérification rôle admin
    const { data: me, error: meError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (meError) {
      console.error("[reset-password] profile query error:", meError);
      return NextResponse.json({ error: "Profile lookup failed" }, { status: 500 });
    }

    if (!me || me.role !== "admin") {
      console.warn("[reset-password] user is not admin:", user.id);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }


    // 📦 Lecture body
    const json = await req.json().catch((err) => {
      console.error("[reset-password] invalid JSON body:", err);
      return null;
    });

    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      console.warn("[reset-password] invalid body:", parsed.error.flatten());
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();


    // 🌍 ENV
    const env = getAdminEnv();

    const redirectTo = `${env.APP_URL.replace(
      /\/$/,
      ""
    )}/auth/confirm?next=/auth/update-password`;


    // 📧 Envoi email Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    if (error) {
      console.error("[reset-password] Supabase reset error:", error);
      return NextResponse.json(
        { error: error.message ?? "Failed to send reset email" },
        { status: 500 }
      );
    }


    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[reset-password] unexpected server error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error"
      },
      { status: 500 }
    );
  }
}