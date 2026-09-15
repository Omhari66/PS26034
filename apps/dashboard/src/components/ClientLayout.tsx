"use client";

import React, { useEffect, useState, Suspense } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Navigation } from "./Navigation";
import { CommandPalette } from "./CommandPalette";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState<boolean>(false);
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("ps26034_auth_token");
    if (!token && pathname !== "/login" && pathname !== "/") {
      router.push("/login");
    }
  }, [pathname, router]);

  if (!mounted) {
    return <div className="min-h-screen bg-[#050508]" />;
  }

  const isPublicPage = pathname === "/" || pathname === "/login";

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050508]" />}>
      {!isPublicPage && <Navigation />}
      <main
        className={`flex-1 overflow-y-auto overflow-x-hidden min-w-0 outline-none focus:outline-none ${
          isPublicPage
            ? "w-full min-h-screen p-0 m-0 bg-[#030306]"
            : "p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto"
        }`}
      >
        {children}
      </main>
      {!isPublicPage && <CommandPalette />}
    </Suspense>
  );
}
