"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function DisabledPage() {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.signOut().finally(() => {
      window.location.replace("/login");
    });
  }, []);

  return (
    <main className="min-h-screen bg-muted">
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-foreground">
            Compte désactivé
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Votre compte est temporairement désactivé. Vous allez être déconnecté.
          </p>
        </div>
      </div>
    </main>
  );
}

