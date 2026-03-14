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
  let displayName = "Utilisateur";

  if (!userError && user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();

    profileRole = profile?.role ?? null;
    isAdmin = profile?.role === "admin";

    if (profile) {
      const fullName = [profile.first_name, profile.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();
      if (fullName.length > 0) {
        displayName = fullName;
      }
    }
  }

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-zinc-900"
          >
            KTA
          </Link>
          {isAdmin ? (
            <>
              <Link
                href="/admin/users"
                className="text-xs font-medium text-zinc-700 underline-offset-4 hover:text-zinc-900 hover:underline"
              >
                Users
              </Link>
              <Link
                href="/admin/frats"
                className="text-xs font-medium text-zinc-700 underline-offset-4 hover:text-zinc-900 hover:underline"
              >
                Frats
              </Link>
              <Link
                href="/admin/catechumenes"
                className="text-xs font-medium text-zinc-700 underline-offset-4 hover:text-zinc-900 hover:underline"
              >
                Catéchumènes
              </Link>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="text-xs font-medium text-zinc-700 underline-offset-4 hover:text-zinc-900 hover:underline"
          >
            {displayName}
          </Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

