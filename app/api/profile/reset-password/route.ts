import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminEnv } from "@/lib/supabase/env";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const env = getAdminEnv();

    const redirectTo = `${env.APP_URL.replace(
      /\/$/,
      ""
    )}/auth/confirm?next=/auth/update-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo
    });

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message ??
            "Une erreur est survenue lors de l’envoi de l’email de réinitialisation."
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error during password reset."
      },
      { status: 500 }
    );
  }
}

