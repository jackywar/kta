"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { getCatechumenePhotoUrl } from "@/lib/storage";
import {
  CANDIDAT_SUIVI_STATUT_OPTIONS,
  formatProfilDisplayName,
  getCandidatSuiviStatutMeta,
  type CandidatSuiviStatut,
  type CandidatWithResponsable
} from "@/lib/catechumenes";

type StatutFilterValue = "all" | "none" | CandidatSuiviStatut;

function matchesStatutFilter(
  c: CandidatWithResponsable,
  filter: StatutFilterValue
): boolean {
  if (filter === "all") return true;
  const v = c.candidat_suivi_statut ?? null;
  if (filter === "none") return v == null;
  return v === filter;
}

function matchSearch(c: CandidatWithResponsable, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const nom = (c.nom ?? "").toLowerCase();
  const prenom = (c.prenom ?? "").toLowerCase();
  if (nom.includes(q) || prenom.includes(q)) return true;
  if (c.responsable) {
    const rn = formatProfilDisplayName(c.responsable).toLowerCase();
    if (rn.includes(q)) return true;
  }
  const meta = getCandidatSuiviStatutMeta(c.candidat_suivi_statut ?? null);
  if (meta) {
    const st = `${meta.emoji} ${meta.shortLabel} ${meta.label}`.toLowerCase();
    if (st.includes(q)) return true;
  }
  return false;
}

export function CandidatTilesWithFilter({
  candidats
}: {
  candidats: CandidatWithResponsable[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statutFilter, setStatutFilter] = useState<StatutFilterValue>("all");

  const filtered = useMemo(() => {
    let list = candidats;
    if (searchQuery.trim()) {
      list = list.filter((c) => matchSearch(c, searchQuery));
    }
    if (statutFilter !== "all") {
      list = list.filter((c) => matchesStatutFilter(c, statutFilter));
    }
    return list;
  }, [candidats, searchQuery, statutFilter]);

  const hasCandidats = candidats.length > 0;
  const noMatch = hasCandidats && filtered.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <label htmlFor="candidats-search" className="text-xs font-medium text-muted-foreground">
            Recherche
          </label>
          <input
            id="candidats-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nom, prénom, responsable, statut…"
            className="h-10 w-full max-w-md rounded-lg border border-border bg-card px-3 text-sm shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            aria-label="Rechercher"
          />
        </div>
        <div className="w-full space-y-1.5 sm:w-auto sm:min-w-[220px]">
          <label htmlFor="candidats-statut" className="text-xs font-medium text-muted-foreground">
            Statut
          </label>
          <select
            id="candidats-statut"
            value={statutFilter}
            onChange={(e) =>
              setStatutFilter(e.target.value as StatutFilterValue)
            }
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          >
            <option value="all">Tous les statuts</option>
            <option value="none">Sans statut</option>
            {CANDIDAT_SUIVI_STATUT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.emoji} {o.shortLabel}
              </option>
            ))}
          </select>
        </div>
      </div>
      {noMatch ? (
        <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Aucun candidat ne correspond à la recherche ou au filtre de statut.
        </p>
      ) : (
        <CandidatTiles candidats={filtered} />
      )}
    </div>
  );
}

export function CandidatTiles({ candidats }: { candidats: CandidatWithResponsable[] }) {
  if (candidats.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Aucun candidat.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {candidats.map((c) => (
        <li key={c.id}>
          <Link
            href={`/responsable/candidats/${c.id}`}
            className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <CandidatTile candidat={c} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CandidatTile({ candidat }: { candidat: CandidatWithResponsable }) {
  const photoUrl = getCatechumenePhotoUrl(candidat.photo_path);
  const statutMeta = getCandidatSuiviStatutMeta(
    candidat.candidat_suivi_statut ?? null
  );
  const responsableLabel = candidat.responsable
    ? formatProfilDisplayName(candidat.responsable)
    : null;

  return (
    <article className="flex aspect-square cursor-pointer flex-col overflow-hidden rounded-2xl border-[3px] border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative min-h-0 flex-1 overflow-hidden bg-muted">
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
      <div className="shrink-0 border-t border-border/60 px-2 py-2 text-center">
        <p className="truncate text-sm font-medium text-foreground">
          {candidat.prenom} {candidat.nom}
        </p>
        <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Candidat
        </p>
        {statutMeta ? (
          <p
            className="mt-1 line-clamp-2 text-[11px] leading-tight text-muted-foreground"
            title={`${statutMeta.emoji} ${statutMeta.label}`}
          >
            <span aria-hidden>{statutMeta.emoji}</span>{" "}
            <span>{statutMeta.shortLabel}</span>
          </p>
        ) : (
          <p className="mt-1 text-[11px] text-muted-foreground">Sans statut</p>
        )}
        {responsableLabel ? (
          <p
            className="mt-1 truncate text-[11px] leading-tight text-muted-foreground"
            title={responsableLabel}
          >
            <span className="text-muted-foreground">Resp.</span> {responsableLabel}
          </p>
        ) : (
          <p className="mt-1 truncate text-[11px] text-muted-foreground">Sans responsable</p>
        )}
      </div>
    </article>
  );
}
