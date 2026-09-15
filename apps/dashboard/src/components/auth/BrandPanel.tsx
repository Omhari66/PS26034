"use client";

import React from "react";
import { ShieldCheck, Cpu, ArrowRight } from "lucide-react";

interface BrandPanelProps {
  mode: "signin" | "signup";
  onToggleMode: () => void;
}

export default function BrandPanel({ mode, onToggleMode }: BrandPanelProps) {
  const isSignIn = mode === "signin";

  return (
    <div className="w-full h-full flex flex-col justify-between text-left relative overflow-hidden z-20 selection:bg-amber-500/30">
      {/* Internal Content Wrapper */}
      <div className="w-full h-full flex flex-col justify-between relative z-10">
        {/* Top Header & Brand Identity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-500 to-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                <ShieldCheck className="w-5 h-5 text-black" />
              </div>
              <div>
                <div className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>PS 26034</span>
                  <span className="text-amber-400 text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/15 border border-amber-500/30">
                    AI
                  </span>
                </div>
                <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-wide">Legal Metrology Studio</p>
              </div>
            </div>
          </div>

          {/* Copy */}
          {isSignIn ? (
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[9px] font-extrabold uppercase tracking-widest">
                <span>PS26034 / SECURE GATEWAY</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                Your compliance <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
                  workspace awaits.
                </span>
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed font-medium max-w-sm">
                Access inspection intelligence, evidence records and compliance workflows from one secure workspace.
              </p>

              {/* Status Indicators */}
              <div className="pt-1 flex flex-wrap gap-1.5 text-[9px] font-mono text-zinc-300">
                <span className="px-2 py-0.5 rounded-lg bg-black/40 border border-zinc-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  IDENTITY VERIFIED
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-black/40 border border-zinc-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  AUDIT READY
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-black/40 border border-zinc-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  ENCRYPTED SESSION
                </span>
              </div>

              {/* Switch Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="px-6 py-2.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-amber-500/40 text-white font-black text-xs transition-all shadow-[0_0_25px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95 group"
                >
                  <span>SIGN UP</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[9px] font-extrabold uppercase tracking-widest">
                <span>PS26034 / WORKSPACE SETUP</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                Build a <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">
                  defensible workflow.
                </span>
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed font-medium max-w-sm">
                Create a secure workspace for inspections, rule validation, supervisor review and audit evidence.
              </p>

              {/* Status Indicators */}
              <div className="pt-1 flex flex-wrap gap-1.5 text-[9px] font-mono text-zinc-300">
                <span className="px-2 py-0.5 rounded-lg bg-black/40 border border-zinc-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  INSPECTION READY
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-black/40 border border-zinc-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  RULE ENGINE
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-black/40 border border-zinc-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  AUDIT TRAIL
                </span>
              </div>

              {/* Switch Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="px-6 py-2.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-cyan-500/40 text-white font-black text-xs transition-all shadow-[0_0_25px_rgba(6,182,212,0.25)] flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95 group"
                >
                  <span>SIGN IN</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
