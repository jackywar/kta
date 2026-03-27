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
      {isPending ? (
        <svg
          aria-hidden
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            d="M21 12a9 9 0 0 0-9-9"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg
          aria-hidden
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v10" />
          <path d="M7 4.5a9 9 0 1 0 10 0" />
        </svg>
      )}
      <span className="sr-only">Se déconnecter</span>
    </button>
  );
}

