import type { Metadata } from "next";
import "./globals.css";
import { ClientLayout } from "../components/ClientLayout";

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
      <body className="bg-[#050508] text-zinc-100 min-h-screen flex selection:bg-amber-500/30 selection:text-white overflow-x-hidden">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
