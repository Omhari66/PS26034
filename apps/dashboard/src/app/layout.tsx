import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Navigation } from "../components/Navigation";
import { CommandPalette } from "../components/CommandPalette";

export const metadata: Metadata = {
  title: "PS 26034 — Legal Metrology Dashboard",
  description: "Supervisor compliance review and decision quality analytics dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#07070a] text-zinc-100 min-h-screen flex selection:bg-amber-500/30 selection:text-white overflow-x-hidden">
        <Suspense fallback={<div className="min-h-screen bg-[#07070a]" />}>
          <Navigation />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden w-full max-w-[1600px] mx-auto min-w-0 outline-none focus:outline-none">
            {children}
          </main>
          <CommandPalette />
        </Suspense>
      </body>
    </html>
  );
}
