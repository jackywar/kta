import { redirect } from "next/navigation";
import {
  TopbarClient,
  type TopbarNavLink
} from "@/components/layout/topbar-client";
import { getCurrentUserProfile } from "@/lib/auth/current-profile";

export async function Topbar() {
  const { user, profile } = await getCurrentUserProfile();

  let isAdmin = false;
  let isResponsable = false;
  let isCatechumene = false;
  let displayName = "Utilisateur";

  if (user) {
    if (profile?.disabled_at) {
      redirect("/disabled");
    }

    isAdmin = profile?.role === "admin";
    isResponsable = profile?.role === "responsable";
    isCatechumene = profile?.role === "catechumene";

    if (profile) {
      const fullName = [profile.first_name, profile.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();
      if (fullName.length > 0) {
        displayName = fullName;
      }
    }
  }

  const navLinks: TopbarNavLink[] = [];
  if (isAdmin) {
    navLinks.push(
      { href: "/admin/events", label: "Évènements" },
      { href: "/admin/users", label: "Users" },
      { href: "/admin/frats", label: "Frats" },
      { href: "/admin/catechumenes", label: "Catéchumènes" },
      { href: "/admin/pages", label: "Pages" },
      { href: "/admin/responsabilites", label: "Responsabilités" }
    );
  }
  if (isResponsable) {
    navLinks.push(
      { href: "/responsable/frats", label: "Frats" },
      { href: "/responsable/events", label: "Évènements" },
      {
        href: "/responsable/catechumenes",
        label: isAdmin ? "Mes catéchumènes" : "Catéchumènes"
      },
      { href: "/responsable/candidats", label: "Candidats" },
      {
        href: "/responsable/responsabilites",
        label: "Récap responsabilités"
      }
    );
  }
  if (isCatechumene) {
    navLinks.push(
      { href: "/catechumene/frat", label: "Ma frat" },
      { href: "/catechumene/events", label: "Évènements" }
    );
  }

  const roleParts: string[] = [];
  if (isAdmin) roleParts.push("Admin");
  if (isResponsable) roleParts.push("Responsable");
  if (isCatechumene) roleParts.push("Catéchumène");
  const roleLine = roleParts.join(" · ");

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
      <TopbarClient
        displayName={displayName}
        roleLine={roleLine}
        navLinks={navLinks}
      />
    </header>
  );
}
