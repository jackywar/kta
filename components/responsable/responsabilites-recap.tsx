import { MarkdownContent } from "@/components/ui/markdown-content";

export type ResponsabiliteRecapRow = {
  id: string;
  libelle: string;
  descriptif: string | null;
  responsables: { id: string; displayName: string; role: string }[];
};

function roleLabelFr(role: string): string {
  if (role === "admin") return "Admin";
  if (role === "responsable") return "Responsable";
  if (role === "catechumene") return "Catéchumène";
  return role;
}

export function responsableDisplayName(p: {
  first_name: string | null;
  last_name: string | null;
  email: string;
}): string {
  const full = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  return full.length > 0 ? full : p.email;
}

export function ResponsabilitesRecap({ rows }: { rows: ResponsabiliteRecapRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
        Aucune responsabilité n&apos;est définie pour le moment.
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {rows.map((row) => (
        <li
          key={row.id}
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
            {row.libelle}
          </h2>
          {row.descriptif?.trim() ? (
            <div className="mt-3 border-t border-zinc-100 pt-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                Descriptif
              </p>
              <MarkdownContent content={row.descriptif} />
            </div>
          ) : null}
          <div className={row.descriptif?.trim() ? "mt-5" : "mt-4"}>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Responsables
            </p>
            {row.responsables.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-600">
                Aucun responsable n&apos;est associé à cette responsabilité.
              </p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {row.responsables.map((r) => (
                  <li
                    key={`${row.id}-${r.id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-800"
                  >
                    <span className="font-medium">{r.displayName}</span>
                    <span className="text-xs text-zinc-500">
                      ({roleLabelFr(r.role)})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
