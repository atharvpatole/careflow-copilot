import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MobileNav } from "./MobileNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Careflow Copilot",
  description: "Minimal, clean clinical copilot dashboard",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
          <MobileNav />
          <main className="flex-1 container mx-auto px-4 py-6 md:px-6 md:py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
