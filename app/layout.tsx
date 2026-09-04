import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { PaletteProvider } from "@/components/theme/palette-provider";
import { getCurrentUserProfile } from "@/lib/auth/current-profile";
import { DEFAULT_PALETTE } from "@/lib/theme";

export const metadata: Metadata = {
  title: "KTA",
  description: "Application KTA pour la gestion du catéchuménat",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KTA"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#18181b" }
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Mémoïsé par requête : la Topbar et la page réutilisent cette même lecture.
  const { profile } = await getCurrentUserProfile();

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      data-theme={profile?.theme_palette ?? DEFAULT_PALETTE}
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <ThemeProvider initialMode={profile?.theme_mode ?? null}>
          <PaletteProvider initialPalette={profile?.theme_palette ?? null}>
            {children}
          </PaletteProvider>
        </ThemeProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

