"use client";

import Link from "next/link";
import type { FratWithResponsables } from "@/lib/frats";

export type FratTileData = FratWithResponsables & {
  membersCount: number;
};

function displayName(r: {
  email: string;
  first_name: string | null;
  last_name: string | null;
}): string {
  const full = [r.first_name, r.last_name].filter(Boolean).join(" ").trim();
  return full || r.email;
}

export function FratTiles({ frats }: { frats: FratTileData[] }) {
  if (frats.length === 0) {
    return (
      <p className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
        Aucune frat.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {frats.map((f) => (
        <li key={f.id}>
          <Link
            href={`/responsable/frats/${f.id}`}
            className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
          >
            <article
              className="relative flex aspect-square flex-col overflow-hidden rounded-2xl border border-zinc-200 shadow-sm transition-shadow hover:shadow-md"
              style={{ backgroundColor: f.color_oklch }}
            >
              <div className="absolute inset-0 bg-black/25" aria-hidden />
              <div className="relative flex h-full flex-col p-4 text-white">
                <h2 className="text-sm font-semibold tracking-tight">
                  {f.name}
                </h2>

                <div className="mt-2 min-h-0 flex-1">
                  <p className="text-xs font-medium text-white/90">
                    Responsables
                  </p>
                  <ul className="mt-1 space-y-0.5 text-xs text-white/90">
                    {(f.responsables ?? [])
                      .map((x) => x.profile)
                      .filter(Boolean)
                      .slice(0, 4)
                      .map((p) => (
                        <li key={p!.id} className="truncate">
                          {displayName(p!)}
                        </li>
                      ))}
                    {(f.responsables ?? []).filter((x) => x.profile).length > 4 ? (
                      <li className="text-white/80">…</li>
                    ) : null}
                  </ul>
                </div>

                <div className="mt-3 rounded-xl bg-white/15 px-3 py-2 text-xs font-medium">
                  {f.membersCount} membre{f.membersCount > 1 ? "s" : ""}
                </div>
              </div>
            </article>
          </Link>
        </li>
      ))}
    </ul>
  );
}

