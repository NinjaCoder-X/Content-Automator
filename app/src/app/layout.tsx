import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Content Factory — Viral Short-Form Generator",
  description:
    "Generate viral-ready hooks, scripts, scene breakdowns, captions, and 7-day content plans for Instagram Reels, YouTube Shorts, and Facebook Reels in seconds.",
  metadataBase: new URL("https://aicontentfactory.app"),
  openGraph: {
    title: "AI Content Factory",
    description:
      "Viral short-form content engine. Hooks, scripts, captions, and a 7-day planner — generated in seconds.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
