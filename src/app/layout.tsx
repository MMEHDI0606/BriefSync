import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "BriefSync",
  description: "Meeting-to-Ops-Ticket pipeline",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
            <a href="/" className="text-sm font-bold tracking-wide text-slate-900">
              BRIEFSYNC
            </a>
            <div className="flex items-center gap-4 text-sm text-slate-700">
              <a href="/history" className="hover:text-slate-900">
                History
              </a>
              <a href="/settings" className="hover:text-slate-900">
                Settings
              </a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
