import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "POAR Voice Trainer",
  description:
    "Voice-based AI training for explaining prosthetics, orthotics, and assistive robotics clearly and professionally.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Decides between "Sign in" and "Account" in the header. A signed-out
  // visitor costs one anonymous call to Supabase and sees the trial as before.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
              {user ? (
                <Link
                  href="/account"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                >
                  Account
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                >
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-6 py-4 text-xs text-slate-400">
            <span>
              POAR Voice Trainer — practice explaining Prosthetics, Orthotics
              &amp; Assistive Robotics.
            </span>
            <Link href="/privacy" className="hover:text-brand">
              Privacy
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
