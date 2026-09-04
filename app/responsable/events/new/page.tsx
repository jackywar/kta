import Link from "next/link";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { EventCreateForm } from "@/components/admin/event-create-form";
import { getCurrentUserProfile } from "@/lib/auth/current-profile";

export default async function ResponsableEventNewPage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user) redirect("/login");
  if (!profile || profile.role !== "responsable") redirect("/");

  return (
    <main className="min-h-screen bg-muted">
      <Topbar />
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/responsable/events"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ← Évènements
          </Link>
        </div>

        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Ajouter un évènement
          </h1>
          <p className="text-sm text-muted-foreground">
            Date, type, libellé, lieu (par défaut ND Talence) et descriptif en
            Markdown.
          </p>
        </header>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <EventCreateForm redirectOnSuccess="/responsable/events" />
        </section>
      </div>
    </main>
  );
}

