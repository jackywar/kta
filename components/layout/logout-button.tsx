"use client";

import { useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  async function onLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    startTransition(() => {
      window.location.assign("/login");
    });
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={isPending}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
      title="Se déconnecter"
    >
      <span aria-hidden="true">{isPending ? "⏳" : "⏻"}</span>
      <span className="sr-only">Se déconnecter</span>
    </button>
  );
}

