"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function onLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    startTransition(() => {
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={isPending}
      className="inline-flex items-center rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Déconnexion…" : "Se déconnecter"}
    </button>
  );
}

