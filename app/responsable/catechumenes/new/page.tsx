import Link from "next/link";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { CatechumeneCreateForm } from "@/components/admin/catechumene-create-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Frat } from "@/lib/frats";

export default async function ResponsableCatechumeneNewPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  if (!profile || profile.role !== "responsable") redirect("/");

  const { data: frats, error: fratsError } = await supabase
    .from("frats")
    .select("id, name, color_oklch")
    .order("name");

  if (fratsError) throw new Error(fratsError.message);

  return (
    <main className="min-h-screen bg-muted">
      <Topbar />
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/responsable/catechumenes"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ← Catéchumènes
          </Link>
        </div>

        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Ajouter un catéchumène
          </h1>
          <p className="text-sm text-muted-foreground">
            Saisissez les informations du catéchumène.
          </p>
        </header>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <CatechumeneCreateForm
            frats={(frats as Frat[]) ?? []}
            redirectOnSuccess="/responsable/catechumenes"
          />
        </div>
      </div>
    </main>
  );
}
