"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { getCatechumenePhotoUrl } from "@/lib/storage";
import type { CatechumeneWithFrat } from "@/lib/catechumenes";

const DEFAULT_BORDER_COLOR = "rgb(161 161 170)"; // zinc-400

function matchSearch(c: CatechumeneWithFrat, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const nom = (c.nom ?? "").toLowerCase();
  const prenom = (c.prenom ?? "").toLowerCase();
  return nom.includes(q) || prenom.includes(q);
}

export function CatechumeneTilesWithFilter({
  catechumenes,
  responsableFratIds
}: {
  catechumenes: CatechumeneWithFrat[];
  responsableFratIds: string[];
}) {
  const [showOnlyMyFrats, setShowOnlyMyFrats] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const hasFratResponsability = responsableFratIds.length > 0;

  const filtered = useMemo(() => {
    let list = catechumenes;
    if (showOnlyMyFrats && hasFratResponsability) {
      const set = new Set(responsableFratIds);
      list = list.filter((c) => c.frat_id != null && set.has(c.frat_id));
    }
    if (searchQuery.trim()) {
      list = list.filter((c) => matchSearch(c, searchQuery));
    }
    return list;
  }, [
    catechumenes,
    showOnlyMyFrats,
    hasFratResponsability,
    responsableFratIds,
    searchQuery
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par nom ou prénom…"
          className="h-10 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm shadow-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100 sm:max-w-xs"
          aria-label="Rechercher par nom ou prénom"
        />
        <div className="flex flex-wrap items-center gap-3">
          <span
          className={`text-sm font-medium ${
            hasFratResponsability ? "text-zinc-700" : "text-zinc-400"
          }`}
        >
          Uniquement ma frat
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={showOnlyMyFrats}
          aria-disabled={!hasFratResponsability}
          disabled={!hasFratResponsability}
          onClick={() => hasFratResponsability && setShowOnlyMyFrats((v) => !v)}
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 ${
            hasFratResponsability
              ? showOnlyMyFrats
                ? "border-zinc-900 bg-zinc-900"
                : "border-zinc-200 bg-zinc-100"
              : "cursor-not-allowed border-zinc-200 bg-zinc-100 opacity-60"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              showOnlyMyFrats ? "translate-x-6" : "translate-x-0.5"
            } ${hasFratResponsability ? "" : "opacity-70"}`}
          />
        </button>
        {!hasFratResponsability && (
          <span className="text-xs text-zinc-400">
            Vous n&apos;êtes responsable d&apos;aucune frat
          </span>
        )}
        </div>
      </div>

      <CatechumeneTiles catechumenes={filtered} />
    </div>
  );
}

export function CatechumeneTiles({
  catechumenes,
  clickable = true
}: {
  catechumenes: CatechumeneWithFrat[];
  clickable?: boolean;
}) {
  if (catechumenes.length === 0) {
    return (
      <p className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
        Aucun catéchumène.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {catechumenes.map((c) => (
        <li key={c.id}>
          {clickable ? (
            <Link
              href={`/responsable/catechumenes/${c.id}`}
              className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
            >
              <CatechumeneTile catechumene={c} clickable />
            </Link>
          ) : (
            <CatechumeneTile catechumene={c} clickable={false} />
          )}
        </li>
      ))}
    </ul>
  );
}

function CatechumeneTile({
  catechumene,
  clickable = true
}: {
  catechumene: CatechumeneWithFrat;
  clickable?: boolean;
}) {
  const photoUrl = getCatechumenePhotoUrl(catechumene.photo_path);
  const borderColor =
    catechumene.frat?.color_oklch?.trim() || DEFAULT_BORDER_COLOR;

  return (
    <article
      className={`flex aspect-square flex-col overflow-hidden rounded-2xl border-[3px] bg-white shadow-sm transition-shadow hover:shadow-md ${
        clickable ? "cursor-pointer" : ""
      }`}
      style={{ borderColor }}
    >
      <div className="relative flex-1 shrink-0 overflow-hidden bg-zinc-100">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-4xl text-zinc-300"
            aria-hidden
          >
            —
          </div>
        )}
      </div>
      <div className="shrink-0 border-t border-zinc-100 px-3 py-2.5 text-center">
        <p className="truncate text-sm font-medium text-zinc-900">
          {catechumene.prenom} {catechumene.nom}
        </p>
      </div>
    </article>
  );
}
