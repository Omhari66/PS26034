"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Shield,
  Zap,
  User,
  BadgeCheck,
} from "lucide-react";
import { api } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Login form state
  const [email, setEmail] = useState<string>("supervisor@demo.ps26034");
  const [password, setPassword] = useState<string>("supervisor123");

  // Registration form state
  const [regFullName, setRegFullName] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regRole, setRegRole] = useState<"supervisor" | "inspector">("supervisor");
  const [regPassword, setRegPassword] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
        localStorage.setItem("ps26034_user_role", email.includes("inspector") ? "Inspector" : "Supervisor");
        router.push("/dashboard");
      } else {
        setError("Invalid credentials received from server.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (!regEmail || !regPassword || !regFullName) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      const token = `demo_jwt_token_${Date.now()}`;
      localStorage.setItem("ps26034_auth_token", token);
      localStorage.setItem("ps26034_user_email", regEmail);
      localStorage.setItem("ps26034_user_name", regFullName);
      localStorage.setItem("ps26034_user_role", regRole === "supervisor" ? "Supervisor" : "Inspector");

      setSuccessMsg("Officer Account Created Successfully! Redirecting to Dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err: any) {
      setError("Could not register officer account.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoRole = (role: "supervisor" | "inspector") => {
    setActiveTab("login");
    if (role === "supervisor") {
      setEmail("supervisor@demo.ps26034");
      setPassword("supervisor123");
    } else {
      setEmail("inspector@demo.ps26034");
      setPassword("inspector123");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050508] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10 space-y-6"
      >
        {/* Brand Logo Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-500 to-amber-400 text-black shadow-[0_0_35px_rgba(245,158,11,0.35)] border border-amber-300/50 mb-1">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-700/80 text-[10px] font-mono font-extrabold text-amber-300 uppercase tracking-widest mb-2 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              PS 26034 Legal Metrology Auth
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Legal Metrology Inspection Studio
            </h1>
            <p className="text-xs text-zinc-400 font-medium mt-1">
              Sign in or register as an authorized inspection officer
            </p>
          </div>
        </div>

        {/* Login / Register Card */}
        <div className="bg-[#0b0c12]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#121218] border border-zinc-800">
            <button
              type="button"
              onClick={() => { setActiveTab("login"); setError(null); setSuccessMsg(null); }}
              className={`py-2 text-xs font-black rounded-xl transition-all ${
                activeTab === "login"
                  ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("register"); setError(null); setSuccessMsg(null); }}
              className={`py-2 text-xs font-black rounded-xl transition-all ${
                activeTab === "register"
                  ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Register Officer
            </button>
          </div>

          {activeTab === "login" && (
            <div className="space-y-2">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                Quick Demo Credentials:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoRole("supervisor")}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center gap-2 ${
                    email.includes("supervisor")
                      ? "bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      : "bg-[#121218] text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Supervisor</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemoRole("inspector")}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center gap-2 ${
                    email.includes("inspector")
                      ? "bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      : "bg-[#121218] text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Inspector</span>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {activeTab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="supervisor@demo.ps26034"
                  className="w-full bg-[#121218] border border-zinc-800 focus:border-amber-500/80 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium transition-all shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#121218] border border-zinc-800 focus:border-amber-500/80 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium transition-all shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 text-black font-black text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Omkar Dubey"
                  className="w-full bg-[#121218] border border-zinc-800 focus:border-amber-500/80 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium transition-all shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Govt / Dept Email</span>
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="omkar@sih.gov.in"
                  className="w-full bg-[#121218] border border-zinc-800 focus:border-amber-500/80 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium transition-all shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Officer Designation</span>
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as "supervisor" | "inspector")}
                  className="w-full bg-[#121218] border border-zinc-800 focus:border-amber-500/80 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none font-medium transition-all shadow-inner"
                >
                  <option value="supervisor">Senior Legal Metrology Supervisor</option>
                  <option value="inspector">Field Inspection Officer</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#121218] border border-zinc-800 focus:border-amber-500/80 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium transition-all shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Registering...</span>
                ) : (
                  <>
                    <span>Create Officer Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
