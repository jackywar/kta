import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { PageContentEditor } from "@/components/admin/page-content-editor";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PageContent } from "@/lib/page-contents";

export default async function AdminPagesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: meProfile, error: meProfileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (meProfileError) throw new Error(meProfileError.message);
  if (!meProfile || meProfile.role !== "admin") redirect("/");

  const { data: contents, error: contentsError } = await supabase
    .from("page_contents")
    .select("*")
    .in("key", ["home_catechumene", "home_responsable"])
    .order("key");

  if (contentsError) throw new Error(contentsError.message);

  const contentMap = new Map(
    ((contents ?? []) as PageContent[]).map((c) => [c.key, c.content])
  );

  return (
    <main className="min-h-screen bg-zinc-50">
      <Topbar />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Administration — Pages
          </h1>
          <p className="text-sm text-zinc-600">
            Modifiez le contenu des pages d&apos;accueil (Markdown).
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-zinc-900">
              Accueil catéchumènes
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Contenu affiché aux utilisateurs avec le rôle &quot;catéchumène&quot;.
            </p>
            <div className="mt-5">
              <PageContentEditor
                contentKey="home_catechumene"
                initialContent={contentMap.get("home_catechumene") ?? ""}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-zinc-900">
              Accueil responsables
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Contenu affiché aux utilisateurs avec le rôle &quot;responsable&quot;.
            </p>
            <div className="mt-5">
              <PageContentEditor
                contentKey="home_responsable"
                initialContent={contentMap.get("home_responsable") ?? ""}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
