import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Event } from "@/lib/events";

function formatDate(s: string): string {
  try {
    return new Date(s).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  } catch {
    return s;
  }
}

export default async function CatechumeneEventsPage() {
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

  if (!profile || profile.role !== "catechumene") {
    redirect("/");
  }

  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const list = (events ?? []) as Event[];

  return (
    <main className="min-h-screen bg-zinc-50">
      <Topbar />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Évènements
          </h1>
          <p className="text-sm text-zinc-600">
            Tous les évènements.
          </p>
        </header>

        {list.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600 shadow-sm">
            Aucun évènement.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {list.map((e) => (
              <article
                key={e.id}
                className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      {formatDate(e.date)}
                    </p>
                    <h2 className="mt-1 truncate text-base font-semibold text-zinc-900">
                      {e.libelle}
                    </h2>
                  </div>
                  <span className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
                    {e.type}
                  </span>
                </div>

                <p className="mt-2 text-sm text-zinc-600">{e.lieu}</p>

                {e.descriptif?.trim() ? (
                  <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                    <MarkdownContent content={e.descriptif} />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

