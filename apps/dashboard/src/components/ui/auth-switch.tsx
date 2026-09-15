"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  KeyRound,
  Shield,
  Zap,
  Activity,
  CheckCircle2,
  AlertCircle,
  Compass,
} from "lucide-react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function AuthSwitch() {
  const router = useRouter();
  const [isInspector, setIsInspector] = useState<boolean>(false);

  // Login Form States
  const [email, setEmail] = useState<string>("supervisor@demo.ps26034");
  const [password, setPassword] = useState<string>("supervisor123");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleToggle = (toInspector: boolean) => {
    setIsInspector(toInspector);
    setError(null);
    setSuccessMsg(null);
    if (toInspector) {
      setEmail("inspector@demo.ps26034");
      setPassword("inspector123");
    } else {
      setEmail("supervisor@demo.ps26034");
      setPassword("supervisor123");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await api.login(email, password);
      if (res.token) {
        const derivedName = email
          .split("@")[0]
          .replace(/[._-]/g, " ")
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        localStorage.setItem("ps26034_auth_token", res.token);
        localStorage.setItem("ps26034_user_email", email);
        localStorage.setItem("ps26034_user_name", derivedName);
        localStorage.setItem(
          "ps26034_user_role",
          isInspector || email.includes("inspector") ? "Inspector" : "Supervisor"
        );

        setSuccessMsg("Authentication Successful! Redirecting to Executive Dashboard...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 850);
      } else {
        setError("Invalid credentials received from server.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in. Check backend server connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl min-h-[560px] relative rounded-3xl bg-[#090a14]/95 border border-zinc-800/90 shadow-[0_35px_90px_rgba(0,0,0,0.95)] backdrop-blur-2xl overflow-hidden my-auto flex">
      {/* ───────────────────────────────────────────────────────────────────────
          FORM 1 (LEFT SIDE) — SUPERVISOR SIGN IN
      ─────────────────────────────────────────────────────────────────────── */}
      <div
        className={`w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center text-left space-y-6 transition-all duration-700 ease-in-out ${
          isInspector ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
        }`}
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono font-extrabold text-amber-400 uppercase tracking-widest">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Supervisor Executive Portal</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Supervisor Sign In</h2>
          <p className="text-xs text-zinc-400 font-medium leading-relaxed">
            Access spatial evidence review queue, audit trails, and decision analytics.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>Supervisor Email</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="supervisor@demo.ps26034"
              className="w-full bg-[#0d0e18] border border-zinc-800 focus:border-amber-500/80 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Password</span>
              </span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0d0e18] border border-zinc-800 focus:border-amber-500/80 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium transition-all"
            />
          </div>

          {error && !isInspector && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && !isInspector && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 text-black font-black text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Supervisor Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="md:hidden pt-2 text-center">
          <button
            type="button"
            onClick={() => handleToggle(true)}
            className="text-xs text-indigo-400 underline font-bold"
          >
            Switch to Field Inspector Mode
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          FORM 2 (RIGHT SIDE) — FIELD INSPECTOR SIGN IN
      ─────────────────────────────────────────────────────────────────────── */}
      <div
        className={`w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center text-left space-y-6 transition-all duration-700 ease-in-out ${
          !isInspector ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
        }`}
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-mono font-extrabold text-indigo-400 uppercase tracking-widest">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>Field Officer Portal</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Field Inspector Sign In</h2>
          <p className="text-xs text-zinc-400 font-medium leading-relaxed">
            Enter official credentials to sync mobile captures with Legal Metrology engine.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>Inspector Email</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="inspector@demo.ps26034"
              className="w-full bg-[#0d0e18] border border-zinc-800 focus:border-indigo-500/80 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span>Password</span>
              </span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0d0e18] border border-zinc-800 focus:border-indigo-500/80 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all"
            />
          </div>

          {error && isInspector && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && isInspector && (
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 text-white font-black text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(99,102,241,0.35)] flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span>Authenticating Inspector...</span>
            ) : (
              <>
                <span>Sign In to Inspector Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="md:hidden pt-2 text-center">
          <button
            type="button"
            onClick={() => handleToggle(false)}
            className="text-xs text-amber-400 underline font-bold"
          >
            Switch to Executive Supervisor Mode
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          EXACT SLIDING CONTAINER OVERLAY (Matches exact 1:1 animation from prompt image)
          - Royal Indigo / Purple & Amber palette (Replacing green!)
      ─────────────────────────────────────────────────────────────────────── */}
      <div
        className={`hidden md:block absolute top-0 left-1/2 w-1/2 h-full overflow-hidden z-30 transition-transform duration-700 ease-in-out ${
          isInspector ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        <div
          className={`absolute top-0 -left-full w-[200%] h-full text-white transition-transform duration-700 ease-in-out bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 shadow-2xl ${
            isInspector ? "translate-x-1/2" : "translate-x-0"
          }`}
          style={{
            clipPath: isInspector
              ? "polygon(0 0, 100% 0, 88% 100%, 0% 100%)"
              : "polygon(12% 0, 100% 0, 100% 100%, 0% 100%)",
          }}
        >
          {/* Overlay Left Content (Shown when Inspector form is active on left) */}
          <div
            className={`absolute top-0 left-0 w-1/2 h-full flex flex-col items-center justify-center p-10 text-center transition-transform duration-700 ease-in-out space-y-5 ${
              isInspector ? "translate-x-0" : "-translate-x-1/4"
            }`}
          >
            <div className="p-3.5 rounded-2xl bg-black/20 border border-white/20 shadow-md">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Senior Supervisor?
            </h2>
            <p className="text-xs font-medium text-white/90 leading-relaxed max-w-xs">
              Switch to Executive Supervisor Mode to inspect visual spatial bounding boxes, approve officer overrides, and log immutable court audit records.
            </p>
            <button
              type="button"
              onClick={() => handleToggle(false)}
              className="px-6 py-3 rounded-full border-2 border-white text-white font-black text-xs hover:bg-white hover:text-black transition-all shadow-lg cursor-pointer tracking-wider uppercase"
            >
              SWITCH TO SUPERVISOR →
            </button>
          </div>

          {/* Overlay Right Content (Shown when Supervisor form is active on right) */}
          <div
            className={`absolute top-0 right-0 w-1/2 h-full flex flex-col items-center justify-center p-10 text-center transition-transform duration-700 ease-in-out space-y-5 ${
              !isInspector ? "translate-x-0" : "translate-x-1/4"
            }`}
          >
            <div className="p-3.5 rounded-2xl bg-black/20 border border-white/20 shadow-md">
              <Compass className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Field Inspector?
            </h2>
            <p className="text-xs font-medium text-white/90 leading-relaxed max-w-xs">
              Switch to Mobile Field Inspection Mode to perform real-time camera photo captures, Dual-OCR bounding box cross-checks, and field text reconciliation.
            </p>
            <button
              type="button"
              onClick={() => handleToggle(true)}
              className="px-6 py-3 rounded-full border-2 border-white text-white font-black text-xs hover:bg-white hover:text-black transition-all shadow-lg cursor-pointer tracking-wider uppercase"
            >
              SWITCH TO INSPECTOR →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
