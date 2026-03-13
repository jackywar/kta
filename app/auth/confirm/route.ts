import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") ?? "/auth/update-password";

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL("/login?error=missing_token", request.url));
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.verifyOtp({
    type: type as
      | "signup"
      | "invite"
      | "recovery"
      | "email_change"
      | "email",
    token_hash,
  });

  if (error) {
    console.error("[auth/confirm] verifyOtp error:", error);
    return NextResponse.redirect(new URL("/login?error=invalid_or_expired_link", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}