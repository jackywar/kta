import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { LogoutButton } from "@/components/layout/logout-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function Topbar() {
  // Ensure auth-dependent UI is always rendered per-request.
  noStore();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  let profileRole: string | null = null;
  let isAdmin = false;

  if (!userError && user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

      profileRole = profile?.role ?? null;
    isAdmin = profile?.role === "admin";
  }

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-zinc-900"
          >
            Secu
          </Link>
          {isAdmin ? (
            <Link
              href="/admin/users"
              className="text-xs font-medium text-zinc-700 underline-offset-4 hover:text-zinc-900 hover:underline"
            >
              Administration
            </Link>
          ) : null}
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}

