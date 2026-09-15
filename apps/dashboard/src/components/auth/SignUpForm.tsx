"use client";

import React, { useState } from "react";
import { User, Mail, KeyRound, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";

interface SignUpFormProps {
  onSignUp: (fullName: string, email: string, pass: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  successMsg: string | null;
  onSwitchToSignIn: () => void;
}

export default function SignUpForm({
  onSignUp,
  loading,
  error,
  successMsg,
  onSwitchToSignIn,
}: SignUpFormProps) {
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [validationErr, setValidationErr] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErr(null);

    if (password !== confirmPassword) {
      setValidationErr("Passwords do not match.");
      return;
    }

    onSignUp(fullName, email, password);
  };

  return (
    <div className="w-full space-y-5 text-left">
      {/* Header & Technical Eyebrow */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono font-extrabold text-cyan-400 uppercase tracking-widest">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>ACCOUNT PROVISIONING / 02</span>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">Create your workspace.</h2>
        <p className="text-xs text-zinc-400 font-medium leading-relaxed">
          Start managing inspections, evidence and compliance workflows.
        </p>
      </div>

      {/* Notifications */}
      {(error || validationErr) && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 shadow-sm font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error || validationErr}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2.5 shadow-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="space-y-1">
          <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>Full Name</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Officer Name"
            className="w-full bg-[#0c0d18] border border-zinc-800 focus:border-cyan-500/80 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-medium transition-all shadow-inner"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-cyan-400" />
            <span>Work Email</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="officer@metrology.gov.in"
            className="w-full bg-[#0c0d18] border border-zinc-800 focus:border-cyan-500/80 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-medium transition-all shadow-inner"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0c0d18] border border-zinc-800 focus:border-cyan-500/80 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-medium transition-all shadow-inner"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>Confirm Password</span>
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0c0d18] border border-zinc-800 focus:border-cyan-500/80 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-medium transition-all shadow-inner"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 text-black font-black text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(6,182,212,0.35)] flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <span>Provisioning Account...</span>
          ) : (
            <>
              <span>Sign Up →</span>
            </>
          )}
        </button>
      </form>

    </div>
  );
}
