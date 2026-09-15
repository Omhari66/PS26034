"use client";

import React, { useState } from "react";
import { Mail, KeyRound, ArrowRight, Shield, Zap, AlertCircle, CheckCircle2 } from "lucide-react";

interface SignInFormProps {
  onSignIn: (email: string, pass: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  successMsg: string | null;
  onSwitchToSignUp: () => void;
}

export default function SignInForm({
  onSignIn,
  loading,
  error,
  successMsg,
  onSwitchToSignUp,
}: SignInFormProps) {
  const [email, setEmail] = useState<string>("supervisor@demo.ps26034");
  const [password, setPassword] = useState<string>("supervisor123");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignIn(email, password);
  };

  const fillDemoRole = (role: "supervisor" | "inspector") => {
    if (role === "supervisor") {
      setEmail("supervisor@demo.ps26034");
      setPassword("supervisor123");
    } else {
      setEmail("inspector@demo.ps26034");
      setPassword("inspector123");
    }
  };

  return (
    <div className="w-full space-y-6 text-left">
      {/* Header & Technical Eyebrow */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono font-extrabold text-amber-400 uppercase tracking-widest">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>SECURE ACCESS / 01</span>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">Welcome back.</h2>
        <p className="text-xs text-zinc-400 font-medium leading-relaxed">
          Access your inspection intelligence workspace.
        </p>
      </div>

      {/* Quick Demo Credentials Switcher */}
      <div className="p-3.5 rounded-2xl bg-[#0e0f1d] border border-zinc-800 space-y-2">
        <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
          <span>Quick Demo Login Preset:</span>
          <span className="text-amber-400 font-bold">Authorized SSO</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillDemoRole("supervisor")}
            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              email.includes("supervisor")
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                : "bg-[#141527] text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Supervisor</span>
          </button>
          <button
            type="button"
            onClick={() => fillDemoRole("inspector")}
            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              email.includes("inspector")
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                : "bg-[#141527] text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Inspector</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 shadow-sm font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5 shadow-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-amber-400" />
            <span>Work Email</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="officer@metrology.gov.in"
            className="w-full bg-[#0c0d18] border border-zinc-800 focus:border-amber-500/80 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium transition-all shadow-inner"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Password</span>
            </span>
            <span className="text-[10px] text-zinc-500 hover:text-amber-400 cursor-pointer transition-colors">
              Forgot?
            </span>
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-[#0c0d18] border border-zinc-800 focus:border-amber-500/80 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium transition-all shadow-inner"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 text-black font-black text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 cursor-pointer group"
        >
          {loading ? (
            <span>Authenticating Workspace...</span>
          ) : (
            <>
              <span>Sign In →</span>
            </>
          )}
        </button>
      </form>

    </div>
  );
}
