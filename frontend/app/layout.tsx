import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amjad Healthcare AI — Multi-Agent Medical Coding Platform",
  description:
    "AI-powered medical coding, billing, RCM, claims review, and audit — an entire coding department, automated.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
