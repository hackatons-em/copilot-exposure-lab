import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/config";
import "./globals.css";

/**
 * Type is system-native first (SF Pro on Apple, Segoe on Windows). Inter is loaded
 * as the cross-platform fallback so non-Apple devices still render a clean grotesk.
 * Display + body share the family — Apple distinguishes by size/weight, not typeface.
 */
const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

/** Data typeface — evidence ids, scores, paths. */
const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

const DESCRIPTION =
  "Safely test whether Microsoft 365 Copilot, Copilot Studio agents, and SharePoint/OneDrive permissions could expose sensitive data — evidence-backed findings, deterministic risk scores, and Microsoft-native remediation.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Copilot Exposure Lab — Run a Copilot Exposure Drill Before Rollout",
    template: "%s · Copilot Exposure Lab",
  },
  description: DESCRIPTION,
  applicationName: "Copilot Exposure Lab",
  keywords: [
    "Microsoft 365 Copilot security",
    "Copilot data exposure",
    "SharePoint oversharing",
    "Copilot Studio agent security",
    "Microsoft Purview",
    "data security posture management",
    "MITRE ATT&CK",
  ],
  authors: [{ name: "Copilot Exposure Lab" }],
  openGraph: {
    type: "website",
    siteName: "Copilot Exposure Lab",
    title: "Know what Copilot would expose — before you turn it on.",
    description: DESCRIPTION,
    url: SITE_URL,
    images: [{ url: "/og.svg", width: 1200, height: 630, alt: "Copilot Exposure Lab" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Copilot Exposure Lab",
    description: DESCRIPTION,
    images: ["/og.svg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
