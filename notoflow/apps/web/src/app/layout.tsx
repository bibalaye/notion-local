import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NotoFlow",
    template: "%s — NotoFlow",
  },
  description: "Votre espace de productivité intelligent propulsé par Mistral AI. Notes, bases de données, wikis et collaboration en temps réel.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon.png", sizes: "64x64", type: "image/png" },
      { url: "/icons/icon.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon.png", sizes: "144x144", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/icon.png", sizes: "152x152", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NotoFlow",
  },
  other: {
    "msapplication-TileColor": "#0a0a0a",
    "msapplication-config": "/browserconfig.xml",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
