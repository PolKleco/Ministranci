import type { Metadata } from "next";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";

export const metadata: Metadata = {
  title: "Ministranci - Aplikacja dla ministrantów",
  description: "Zarządzaj ministrantami, planuj służby i buduj zaangażowaną wspólnotę parafialną.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="antialiased">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
