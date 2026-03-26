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
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par nom ou prénom…"
          className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-card px-3 text-sm shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 sm:max-w-xs"
          aria-label="Rechercher par nom ou prénom"
        />
        <div className="flex flex-wrap items-center gap-3">
          <span
          className={`text-sm font-medium ${
            hasFratResponsability ? "text-muted-foreground" : "text-muted-foreground"
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
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
            hasFratResponsability
              ? showOnlyMyFrats
                ? "border-primary bg-primary"
                : "border-border bg-muted"
              : "cursor-not-allowed border-border bg-muted opacity-60"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-card shadow-sm transition-transform ${
              showOnlyMyFrats ? "translate-x-6" : "translate-x-0.5"
            } ${hasFratResponsability ? "" : "opacity-70"}`}
          />
        </button>
        {!hasFratResponsability && (
          <span className="text-xs text-muted-foreground">
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
      <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
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
              className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
      className={`flex aspect-square flex-col overflow-hidden rounded-2xl border-[3px] bg-card shadow-sm transition-shadow hover:shadow-md ${
        clickable ? "cursor-pointer" : ""
      }`}
      style={{ borderColor }}
    >
      <div className="relative flex-1 shrink-0 overflow-hidden bg-muted">
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
            className="flex h-full w-full items-center justify-center text-4xl text-muted-foreground"
            aria-hidden
          >
            —
          </div>
        )}
      </div>
      <div className="shrink-0 border-t border-border/60 px-3 py-2.5 text-center">
        <p className="truncate text-sm font-medium text-foreground">
          {catechumene.prenom} {catechumene.nom}
        </p>
      </div>
    </article>
  );
}
