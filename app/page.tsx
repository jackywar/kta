import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  return (
    <main className="min-h-screen bg-zinc-50">
      <Topbar />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">Accueil</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Vous êtes connecté.
          </p>
        </div>
      </div>
    </main>
  );
}

