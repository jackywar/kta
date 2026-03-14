import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KTA",
  description: "Application KTA pour la gestion du catéchuménat"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

