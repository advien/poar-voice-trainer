import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "POAR Voice Trainer",
  description:
    "Voice-based AI training for explaining prosthetics, orthotics, and assistive robotics clearly and professionally.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
            <Link href="/" className="font-semibold text-brand">
              POAR<span className="text-slate-400"> Voice Trainer</span>
            </Link>
            <nav className="flex items-center gap-5 text-sm">
              <Link
                href="/modes"
                className="text-slate-600 hover:text-brand transition-colors"
              >
                Practice modes
              </Link>
              <Link
                href="/progress"
                className="text-slate-600 hover:text-brand transition-colors"
              >
                Progress
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-4 text-xs text-slate-400">
            POAR Voice Trainer — MVP skeleton. Prosthetics · Orthotics ·
            Assistive Robotics.
          </div>
        </footer>
      </body>
    </html>
  );
}
