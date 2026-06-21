import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Copilot Exposure Lab",
  description:
    "Safely test whether Microsoft 365 Copilot, Copilot Studio agents, and SharePoint/OneDrive permissions could expose sensitive data — evidence-backed findings, deterministic risk scores, and Microsoft-native remediation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-subtle text-ink antialiased">{children}</body>
    </html>
  );
}
