import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LayoutDashboard, TrendingUp, FileText } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Careflow Copilot",
  description: "Minimal, clean clinical copilot dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-stone-50 text-stone-900 antialiased`}>
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center px-4 md:px-6">
              <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-lg mr-6">
                <span className="text-blue-600">CareFlow</span>
                <span className="text-stone-400">Copilot</span>
              </Link>
              <nav className="flex items-center gap-6 text-sm font-medium">
                <Link href="/dashboard" className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link href="/forecast" className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors">
                  <TrendingUp className="h-4 w-4" />
                  Forecast
                </Link>
                <Link href="/note-analyzer" className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors">
                  <FileText className="h-4 w-4" />
                  Note Analyzer
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1 container mx-auto px-4 py-8 md:px-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
