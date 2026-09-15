"use client";

import React from "react";
import KineticGrid from "@/components/ui/kinetic-grid";
import AuthShell from "@/components/auth/AuthShell";

export default function LoginPage() {
  return (
    <KineticGrid className="bg-[#030306]">
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
        {/* Ambient Radial Lighting Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] bg-amber-500/10 rounded-full blur-[170px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none" />

        {/* AuthShell Orchestrator Container */}
        <AuthShell />
      </div>
    </KineticGrid>
  );
}
