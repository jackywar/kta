import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
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

  if (profileError) {
    throw new Error(profileError.message);
  }

  const role = profile?.role ?? null;

  let contentKey: string | null = null;
  if (role === "catechumene") {
    contentKey = "home_catechumene";
  } else if (role === "responsable") {
    contentKey = "home_responsable";
  }

  let pageContent = "";
  if (contentKey) {
    const { data: row, error: contentError } = await supabase
      .from("page_contents")
      .select("content")
      .eq("key", contentKey)
      .maybeSingle();

    if (contentError) {
      throw new Error(contentError.message);
    }

    pageContent = row?.content ?? "";
  }

  return (
    <main className="min-h-screen bg-muted">
      <Topbar />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {pageContent.trim() ? (
            <MarkdownContent content={pageContent} />
          ) : (
            <>
              <h1 className="text-xl font-semibold tracking-tight">Accueil</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Vous êtes connecté.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

